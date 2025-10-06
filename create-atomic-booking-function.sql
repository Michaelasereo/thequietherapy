-- =============================================
-- ATOMIC BOOKING FUNCTION WITH CREDIT DEDUCTION
-- =============================================
-- This function ensures booking and credit deduction happen atomically

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
    title TEXT,
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
BEGIN
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
    SELECT credits_balance, credits_used INTO v_credits_balance, v_credits_used
    FROM user_credits
    WHERE user_id = p_user_id
    AND user_type IN ('user', 'individual')
    ORDER BY created_at DESC
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
    UPDATE user_credits
    SET 
        credits_balance = credits_balance - 1,
        credits_used = credits_used + 1,
        updated_at = NOW()
    WHERE user_id = p_user_id
    AND user_type IN ('user', 'individual')
    AND credits_balance >= 1;
    
    -- Verify credit deduction was successful
    IF NOT FOUND THEN
        -- Rollback session creation
        DELETE FROM sessions WHERE id = v_session_id;
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
    
    -- Enqueue reminder notifications
    PERFORM enqueue_notification(
        'booking_reminder_24h',
        p_user_id,
        p_therapist_id,
        v_session_id,
        jsonb_build_object(
            'session_id', v_session_id,
            'session_date', p_session_date,
            'session_time', p_session_time,
            'therapist_id', p_therapist_id
        ),
        1440 -- 24 hours before
    );
    
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
    
    -- Return the created session
    SELECT 
        s.id,
        s.user_id,
        s.therapist_id,
        s.title,
        s.description,
        s.scheduled_date,
        s.scheduled_time,
        s.start_time,
        s.end_time,
        s.duration_minutes,
        s.session_type,
        s.status,
        s.created_at
    INTO v_session_record
    FROM sessions s
    WHERE s.id = v_session_id;
    
    RETURN QUERY SELECT 
        v_session_record.id,
        v_session_record.user_id,
        v_session_record.therapist_id,
        v_session_record.title,
        v_session_record.description,
        v_session_record.scheduled_date,
        v_session_record.scheduled_time,
        v_session_record.start_time,
        v_session_record.end_time,
        v_session_record.duration_minutes,
        v_session_record.session_type,
        v_session_record.status,
        v_session_record.created_at;
        
END;
$$ LANGUAGE plpgsql;

-- Add comment for documentation
COMMENT ON FUNCTION create_session_with_credit_deduction IS 'Atomically creates a session and deducts user credits with conflict prevention';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_session_with_credit_deduction TO authenticated;
