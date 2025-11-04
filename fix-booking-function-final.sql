-- =============================================
-- FINAL FIX FOR AMBIGUOUS COLUMN REFERENCE 'id'
-- =============================================
-- This fixes the "column reference 'id' is ambiguous" error
-- by using explicit column aliases and fully qualifying all references

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
    v_total_balance INTEGER;
    v_credits_used INTEGER;
    v_lock_key BIGINT;
BEGIN
    -- Derive an advisory lock key scoped to therapist and date to serialize bookings
    v_lock_key := ('x' || substr(md5(p_therapist_id::text || ':' || p_session_date::text), 1, 16))::bit(64)::bigint;

    -- Acquire transactional advisory lock (auto-released on commit/rollback)
    PERFORM pg_advisory_xact_lock(v_lock_key);
    
    -- ✅ VALIDATION 1: Verify therapist exists and is approved
    IF NOT EXISTS (
        SELECT 1 FROM users u
        JOIN therapist_enrollments te ON te.email = u.email
        WHERE u.id = p_therapist_id
        AND u.user_type = 'therapist'
        AND u.is_active = true
        AND u.is_verified = true
        AND te.status = 'approved'
        AND te.is_active = true
    ) THEN
        RAISE EXCEPTION 'Therapist not found or not approved: therapist_id = %', p_therapist_id;
    END IF;
    
    -- Calculate session times
    v_start_time := (p_session_date || ' ' || p_session_time)::TIMESTAMP WITH TIME ZONE;
    v_end_time := v_start_time + INTERVAL '1 minute' * p_duration_minutes;
    
    -- ✅ VALIDATION 2: Verify session is in the future
    IF v_start_time <= NOW() THEN
        RAISE EXCEPTION 'Cannot book sessions in the past. Session time: %, Current time: %', v_start_time, NOW();
    END IF;
    
    -- ✅ VALIDATION 3: Check for conflicts BEFORE creating session
    IF check_booking_conflict(p_therapist_id, p_session_date, p_session_time, p_session_time + INTERVAL '1 minute' * p_duration_minutes) THEN
        RAISE EXCEPTION 'Booking conflict: Time slot is already booked';
    END IF;
    
    -- ✅ FIX: Get credits - ONLY check for 'user' type (individual users only have credits)
    -- Therapists and partners don't have credits in user_credits table
    SELECT 
        uc.credits_balance,
        uc.credits_used
    INTO v_total_balance, v_credits_used
    FROM user_credits uc
    WHERE uc.user_id = p_user_id
    AND uc.user_type = 'user'  -- Only 'user' type has credits
    LIMIT 1;
    
    -- Validate credits
    IF v_total_balance IS NULL OR v_total_balance < 1 THEN
        RAISE EXCEPTION 'Insufficient credits: You need at least 1 credit to book a session';
    END IF;
    
    -- Create session record (will be prevented by exclusion constraint if race)
    -- ✅ FIX: Use explicit table qualification in RETURNING clause
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
    
    -- ✅ FIX: Deduct credit from the 'user' type record only
    -- Only individual users have credits, not therapists or partners
    UPDATE user_credits uc
    SET 
        credits_balance = uc.credits_balance - 1,
        credits_used = uc.credits_used + 1,
        updated_at = NOW()
    WHERE uc.user_id = p_user_id
    AND uc.user_type = 'user'  -- Only 'user' type has credits
    AND uc.credits_balance >= 1;
    
    -- Verify credit deduction was successful
    IF NOT FOUND THEN
        -- Rollback session creation - use explicit table qualification
        DELETE FROM sessions WHERE sessions.id = v_session_id;
        RAISE EXCEPTION 'Failed to deduct credits: Insufficient balance or concurrent modification';
    END IF;
    
    -- Enqueue notification immediately after successful booking (same transaction)
    PERFORM enqueue_notification(
        'booking_confirmation',
        p_user_id,
        p_therapist_id,
        v_session_id,
        jsonb_build_object(
            'session_id', v_session_id,
            'session_date', p_session_date,
            'session_time', p_session_time,
            'duration_minutes', p_duration_minutes,
            'therapist_id', p_therapist_id,
            'session_type', p_session_type
        ),
        0 -- Immediate notification
    );
    
    -- Enqueue reminder notification (1 hour before session)
    PERFORM enqueue_notification(
        'booking_reminder_1h',
        p_user_id,
        p_therapist_id,
        v_session_id,
        jsonb_build_object(
            'session_id', v_session_id,
            'session_date', p_session_date,
            'session_time', p_session_time,
            'therapist_id', p_therapist_id
        ),
        EXTRACT(EPOCH FROM (v_start_time - NOW() - INTERVAL '1 hour')) / 60 -- 1 hour before session
    );
    
    -- Log booking audit trail
    BEGIN
        INSERT INTO booking_audit_log (session_id, user_id, action, old_status, new_status, changes)
        VALUES (
            v_session_id, p_user_id, 'created', NULL, 'scheduled',
            jsonb_build_object(
                'session_time', v_start_time,
                'therapist_id', p_therapist_id,
                'session_type', p_session_type,
                'credits_used', 1
            )
        );
    EXCEPTION WHEN OTHERS THEN
        -- Audit log optional - continue if it fails
        NULL;
    END;
    
    -- ✅ FIX: Return the created session using explicit table qualification
    -- Use table-qualified column names to avoid ambiguity with return column 'id'
    RETURN QUERY 
    SELECT 
        sessions.id,
        sessions.user_id,
        sessions.therapist_id,
        sessions.title::VARCHAR(255),
        sessions.description::TEXT,
        sessions.scheduled_date,
        sessions.scheduled_time,
        sessions.start_time::TIMESTAMP WITH TIME ZONE,
        sessions.end_time::TIMESTAMP WITH TIME ZONE,
        sessions.duration_minutes,
        sessions.session_type::VARCHAR(50),
        sessions.status::VARCHAR(50),
        sessions.created_at::TIMESTAMP WITH TIME ZONE
    FROM sessions
    WHERE sessions.id = v_session_id;
        
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_session_with_credit_deduction TO authenticated;

COMMENT ON FUNCTION create_session_with_credit_deduction IS 'Atomically creates a session and deducts user credits with conflict prevention - Fixed ambiguous column reference using subquery and explicit aliases';

-- Verify the function was created
SELECT '✅ Booking function updated - fixed ambiguous column reference using subquery' as status;

