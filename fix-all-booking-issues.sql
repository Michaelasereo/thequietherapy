-- =============================================
-- COMPREHENSIVE BOOKING SYSTEM FIX
-- Senior Engineer Review - All Critical Issues
-- =============================================

-- Step 1: Ensure check_booking_conflict function exists
-- =============================================
CREATE OR REPLACE FUNCTION check_booking_conflict(
    p_therapist_id UUID,
    p_session_date DATE,
    p_start_time TIME,
    p_end_time TIME
) RETURNS BOOLEAN AS $$
DECLARE
    conflict_count INTEGER;
    p_start_timestamp TIMESTAMP WITH TIME ZONE;
    p_end_timestamp TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Convert DATE and TIME to proper TIMESTAMP WITH TIME ZONE
    p_start_timestamp := (p_session_date || ' ' || p_start_time)::TIMESTAMP WITH TIME ZONE;
    p_end_timestamp := (p_session_date || ' ' || p_end_time)::TIMESTAMP WITH TIME ZONE;
    
    -- Check for existing sessions that overlap using proper timestamp comparison
    SELECT COUNT(*) INTO conflict_count
    FROM sessions s
    WHERE s.therapist_id = p_therapist_id
    AND s.status IN ('scheduled', 'confirmed', 'in_progress')
    -- Check for time overlap: session overlaps if start < end AND end > start
    AND s.start_time < p_end_timestamp 
    AND s.end_time > p_start_timestamp;
    
    RETURN conflict_count > 0;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION check_booking_conflict TO authenticated;

COMMENT ON FUNCTION check_booking_conflict IS 'Checks for booking conflicts using proper timestamp comparison';

SELECT '✅ Step 1: check_booking_conflict function verified/created' as status;

-- Step 2: Update booking function with correct credit logic
-- =============================================
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
    v_user_exists BOOLEAN;
    v_therapist_exists BOOLEAN;
BEGIN
    -- ✅ VALIDATION 1: Verify user exists
    SELECT EXISTS(SELECT 1 FROM users WHERE id = p_user_id AND is_active = true)
    INTO v_user_exists;
    
    IF NOT v_user_exists THEN
        RAISE EXCEPTION 'User not found or inactive: user_id = %', p_user_id;
    END IF;
    
    -- ✅ VALIDATION 2: Verify therapist exists and is active
    SELECT EXISTS(
        SELECT 1 FROM users u
        WHERE u.id = p_therapist_id 
        AND u.user_type = 'therapist'
        AND u.is_active = true
        AND u.is_verified = true
    ) INTO v_therapist_exists;
    
    IF NOT v_therapist_exists THEN
        RAISE EXCEPTION 'Therapist not found, inactive, or unverified: therapist_id = %', p_therapist_id;
    END IF;
    
    -- ✅ VALIDATION 3: Verify therapist enrollment is approved
    IF NOT EXISTS (
        SELECT 1 FROM therapist_enrollments te
        JOIN users u ON te.email = u.email
        WHERE u.id = p_therapist_id
        AND te.status = 'approved'
        AND te.is_active = true
    ) THEN
        RAISE EXCEPTION 'Therapist enrollment not approved: therapist_id = %', p_therapist_id;
    END IF;
    
    -- Derive an advisory lock key scoped to therapist and date to serialize bookings
    v_lock_key := ('x' || substr(md5(p_therapist_id::text || ':' || p_session_date::text), 1, 16))::bit(64)::bigint;

    -- Acquire transactional advisory lock (auto-released on commit/rollback)
    PERFORM pg_advisory_xact_lock(v_lock_key);
    
    -- Calculate session times
    v_start_time := (p_session_date || ' ' || p_session_time)::TIMESTAMP WITH TIME ZONE;
    v_end_time := v_start_time + INTERVAL '1 minute' * p_duration_minutes;
    
    -- ✅ VALIDATION 4: Check for conflicts BEFORE creating session
    IF check_booking_conflict(p_therapist_id, p_session_date, p_session_time, p_session_time + INTERVAL '1 minute' * p_duration_minutes) THEN
        RAISE EXCEPTION 'Booking conflict: Time slot is already booked';
    END IF;
    
    -- ✅ VALIDATION 5: Get credits - ONLY check for 'user' type (individual users only have credits)
    SELECT 
        uc.credits_balance,
        uc.credits_used
    INTO v_total_balance, v_credits_used
    FROM user_credits uc
    WHERE uc.user_id = p_user_id
    AND uc.user_type = 'user'  -- Only 'user' type has credits
    LIMIT 1;
    
    -- ✅ VALIDATION 6: Validate credits BEFORE creating session
    IF v_total_balance IS NULL OR v_total_balance < 1 THEN
        RAISE EXCEPTION 'Insufficient credits: You need at least 1 credit to book a session. Current balance: %', COALESCE(v_total_balance, 0);
    END IF;
    
    -- ✅ VALIDATION 7: Validate session is in the future
    IF v_start_time <= NOW() THEN
        RAISE EXCEPTION 'Cannot book sessions in the past. Session time: %, Current time: %', v_start_time, NOW();
    END IF;
    
    -- ✅ STEP 1: Create session record (will be prevented by exclusion constraint if race)
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
    
    -- ✅ STEP 2: Deduct credit atomically (must match the credit check above)
    UPDATE user_credits uc
    SET 
        credits_balance = uc.credits_balance - 1,
        credits_used = uc.credits_used + 1,
        updated_at = NOW()
    WHERE uc.user_id = p_user_id
    AND uc.user_type = 'user'  -- Only 'user' type has credits
    AND uc.credits_balance >= 1;  -- Ensure we don't deduct if balance changed
    
    -- ✅ VALIDATION 8: Verify credit deduction was successful
    IF NOT FOUND THEN
        -- Rollback session creation
        DELETE FROM sessions WHERE id = v_session_id;
        RAISE EXCEPTION 'Failed to deduct credits: Insufficient balance or concurrent modification. Session was not created.';
    END IF;
    
    -- ✅ STEP 3: Enqueue notifications (non-critical, wrapped in exception handler)
    BEGIN
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
    EXCEPTION WHEN OTHERS THEN
        -- Notifications are non-critical - continue if they fail
        RAISE NOTICE 'Notification queuing failed (non-critical): %', SQLERRM;
    END;
    
    -- ✅ STEP 4: Log booking audit trail (non-critical)
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
        -- Audit log is optional - continue if it fails
        RAISE NOTICE 'Audit log failed (non-critical): %', SQLERRM;
    END;
    
    -- ✅ STEP 5: Return the created session
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_session_with_credit_deduction TO authenticated;

COMMENT ON FUNCTION create_session_with_credit_deduction IS 'Atomically creates a session and deducts user credits with comprehensive validation - Only checks user_type = user (individual users only)';

SELECT '✅ Step 2: Booking function updated with comprehensive validation' as status;

-- Step 3: Verify all functions exist
-- =============================================
SELECT 
    'FUNCTION VERIFICATION' as check_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'create_session_with_credit_deduction')
        THEN '✅ create_session_with_credit_deduction exists'
        ELSE '❌ create_session_with_credit_deduction MISSING'
    END as status
UNION ALL
SELECT 
    'CONFLICT FUNCTION CHECK' as check_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'check_booking_conflict')
        THEN '✅ check_booking_conflict exists'
        ELSE '❌ check_booking_conflict MISSING'
    END as status;

SELECT '✅ All booking functions verified!' as final_status;

