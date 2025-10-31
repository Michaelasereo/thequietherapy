-- =============================================
-- ADD SESSION APPROVAL SYSTEM
-- Adds pending_approval status and instant session support
-- =============================================

-- 1. Add pending_approval to status constraint
-- =============================================
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop ANY existing check constraints on sessions (handles legacy names like "check_status")
    FOR r IN (
        SELECT conname
        FROM pg_constraint c
        JOIN pg_class t ON t.oid = c.conrelid
        JOIN pg_namespace n ON n.oid = t.relnamespace
        WHERE t.relname = 'sessions'
          AND n.nspname = 'public'
          AND c.contype = 'c'
    ) LOOP
        EXECUTE format('ALTER TABLE public.sessions DROP CONSTRAINT IF EXISTS %I', r.conname);
    END LOOP;

    -- Add new constraint with pending_approval
    ALTER TABLE public.sessions 
    ADD CONSTRAINT sessions_status_check 
    CHECK (status IN (
        'pending_approval',
        'scheduled', 
        'confirmed', 
        'in_progress', 
        'completed', 
        'cancelled', 
        'no_show'
    ));
    
    RAISE NOTICE '✅ Recreated sessions_status_check with pending_approval';
END $$;

-- 2. Add is_instant flag for immediate sessions
-- =============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'sessions' AND column_name = 'is_instant'
    ) THEN
        ALTER TABLE sessions ADD COLUMN is_instant BOOLEAN DEFAULT false;
        RAISE NOTICE '✅ Added is_instant column';
    END IF;
END $$;

-- 3. Add requires_approval flag
-- =============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'sessions' AND column_name = 'requires_approval'
    ) THEN
        ALTER TABLE sessions ADD COLUMN requires_approval BOOLEAN DEFAULT false;
        RAISE NOTICE '✅ Added requires_approval column';
    END IF;
END $$;

-- 4. Add created_by column to track who created the session
-- =============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'sessions' AND column_name = 'created_by'
    ) THEN
        ALTER TABLE sessions ADD COLUMN created_by UUID REFERENCES users(id);
        RAISE NOTICE '✅ Added created_by column';
    END IF;
END $$;

-- 5. Create function to approve session and deduct credit
-- =============================================
CREATE OR REPLACE FUNCTION approve_session_and_deduct_credit(
    p_session_id UUID,
    p_user_id UUID
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
    v_session_record RECORD;
    v_credits_balance INTEGER;
    v_credits_used INTEGER;
    v_start_time TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get session record
    SELECT * INTO v_session_record
    FROM sessions
    WHERE id = p_session_id
    AND user_id = p_user_id
    AND status = 'pending_approval'
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Session not found or not pending approval';
    END IF;
    
    -- Check user has credits
    SELECT uc.credits_balance, uc.credits_used INTO v_credits_balance, v_credits_used
    FROM user_credits uc
    WHERE uc.user_id = p_user_id
    AND uc.user_type IN ('user', 'individual')
    ORDER BY uc.created_at DESC
    LIMIT 1;
    
    IF v_credits_balance IS NULL OR v_credits_balance < 1 THEN
        RAISE EXCEPTION 'Insufficient credits: You need at least 1 credit to approve this session';
    END IF;
    
    -- Update session status to scheduled (or confirmed if instant)
    IF v_session_record.is_instant THEN
        UPDATE sessions
        SET 
            status = 'confirmed',
            updated_at = NOW()
        WHERE id = p_session_id
        RETURNING * INTO v_session_record;
    ELSE
        UPDATE sessions
        SET 
            status = 'scheduled',
            updated_at = NOW()
        WHERE id = p_session_id
        RETURNING * INTO v_session_record;
    END IF;
    
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
        -- Rollback session status change
        UPDATE sessions
        SET status = 'pending_approval', updated_at = NOW()
        WHERE id = p_session_id;
        RAISE EXCEPTION 'Failed to deduct credits: Insufficient balance or concurrent modification';
    END IF;
    
    -- Return the updated session
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
    WHERE s.id = p_session_id;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION approve_session_and_deduct_credit TO authenticated;

COMMENT ON FUNCTION approve_session_and_deduct_credit IS 'Approves a pending session and deducts user credit atomically';

-- 6. Create indexes for performance
-- =============================================
CREATE INDEX IF NOT EXISTS idx_sessions_status_pending ON sessions(status) WHERE status = 'pending_approval';
CREATE INDEX IF NOT EXISTS idx_sessions_user_status ON sessions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_sessions_therapist_status ON sessions(therapist_id, status);
CREATE INDEX IF NOT EXISTS idx_sessions_requires_approval ON sessions(requires_approval) WHERE requires_approval = true;

SELECT '✅ Session approval system setup complete!' as status;

