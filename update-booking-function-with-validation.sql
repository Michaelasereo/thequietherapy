-- =============================================
-- UPDATE BOOKING FUNCTION WITH THERAPIST VALIDATION
-- =============================================
-- Add validation at the start to prevent therapist_id mismatches

CREATE OR REPLACE FUNCTION create_session_with_credit_deduction(
    p_user_id UUID,
    p_therapist_id UUID,
    p_session_date DATE,
    p_session_time TIME,
    p_duration_minutes INTEGER DEFAULT 60,
    p_session_type VARCHAR(50) DEFAULT 'video',
    p_notes TEXT DEFAULT '',
    p_title TEXT DEFAULT 'Therapy Session'
) RETURNS TABLE(
    id UUID,
    user_id UUID,
    therapist_id UUID,
    title VARCHAR(255),
    description TEXT,
    scheduled_date DATE,
    scheduled_time TIME,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    session_type VARCHAR(50),
    status VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    v_session_id UUID;
    v_start_time TIMESTAMP WITH TIME ZONE;
    v_end_time TIMESTAMP WITH TIME ZONE;
    v_credits_balance INTEGER;
    v_credits_used INTEGER;
    v_session_record RECORD;
    v_lock_key BIGINT;
    v_therapist_valid BOOLEAN;
BEGIN
    -- ✅ SAFEGUARD: Validate therapist_id BEFORE creating session
    SELECT EXISTS (
        SELECT 1 
        FROM users 
        WHERE id = p_therapist_id 
        AND user_type = 'therapist'
        AND is_active = true
        AND is_verified = true
    ) INTO v_therapist_valid;
    
    IF NOT v_therapist_valid THEN
        RAISE EXCEPTION 'Invalid therapist_id: Therapist not found, inactive, or unverified. therapist_id: %', p_therapist_id;
    END IF;
    
    -- Derive an advisory lock key scoped to therapist and date to serialize bookings
    v_lock_key := ('x' || substr(md5(p_therapist_id::text || ':' || p_session_date::text), 1, 16))::bit(64)::bigint;

    -- Acquire transactional advisory lock (auto-released on commit/rollback)
    PERFORM pg_advisory_xact_lock(v_lock_key);
    
    -- Calculate session times
    v_start_time := (p_session_date || ' ' || p_session_time)::TIMESTAMP WITH TIME ZONE;
    v_end_time := v_start_time + INTERVAL '1 minute' * p_duration_minutes;
    
    -- Check for conflicts one more time (double-check)
    IF check_booking_conflict(p_therapist_id, p_session_date, p_session_time, p_session_time + INTERVAL '1 minute' * p_duration_minutes) THEN
        RAISE EXCEPTION 'Booking conflict: Time slot is already booked';
    END IF;
    
    -- Get current credit balance
    SELECT uc.credits_balance, uc.credits_used INTO v_credits_balance, v_credits_used
    FROM user_credits uc
    WHERE uc.user_id = p_user_id
    AND uc.user_type IN ('user', 'individual')
    ORDER BY uc.created_at DESC
    LIMIT 1;
    
    -- Validate credits
    IF v_credits_balance IS NULL OR v_credits_balance < 1 THEN
        RAISE EXCEPTION 'Insufficient credits: You need at least 1 credit to book a session';
    END IF;
    
    -- Create session record (will be prevented by exclusion constraint if race)
    INSERT INTO sessions (
        user_id,
        therapist_id,
        title,
        description,
        scheduled_date,
        scheduled_time,
        start_time,
        end_time,
        duration_minutes,
        session_type,
        status,
        created_at,
        updated_at
    ) VALUES (
        p_user_id,
        p_therapist_id,
        p_title,
        p_notes,
        p_session_date,
        p_session_time,
        v_start_time,
        v_end_time,
        p_duration_minutes,
        p_session_type,
        'scheduled',
        NOW(),
        NOW()
    ) RETURNING id INTO v_session_id;
    
    -- Deduct credit atomically
    UPDATE user_credits uc
    SET 
        credits_balance = uc.credits_balance - 1,
        credits_used = uc.credits_used + 1,
        updated_at = NOW()
    WHERE uc.user_id = p_user_id
    AND uc.user_type IN ('user', 'individual')
    AND uc.credits_balance >= 1;
    
    -- Verify credit deduction was successful
    IF NOT FOUND THEN
        -- Rollback session creation
        DELETE FROM sessions WHERE id = v_session_id;
        RAISE EXCEPTION 'Failed to deduct credits: Insufficient balance or concurrent modification';
    END IF;
    
    -- Return the created session directly (cast types to match return signature)
    RETURN QUERY 
    SELECT 
        s.id,
        s.user_id,
        s.therapist_id,
        s.title::VARCHAR(255),
        s.description::TEXT,
        s.scheduled_date,
        s.scheduled_time,
        s.start_time::TIMESTAMP WITH TIME ZONE,
        s.end_time::TIMESTAMP WITH TIME ZONE,
        s.duration_minutes,
        s.session_type::VARCHAR(50),
        s.status::VARCHAR(50),
        s.created_at::TIMESTAMP WITH TIME ZONE
    FROM sessions s
    WHERE s.id = v_session_id;
        
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_session_with_credit_deduction IS 'Atomically creates a session and deducts user credits with conflict prevention and therapist validation';

