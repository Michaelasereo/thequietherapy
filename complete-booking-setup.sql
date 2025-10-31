-- =============================================
-- COMPLETE BOOKING SETUP - ALL REQUIRED COLUMNS
-- Run this before launch to ensure booking works
-- =============================================

-- 1. Add ALL missing columns to sessions table
-- =============================================
DO $$
BEGIN
    -- Title column (required by booking function)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'sessions' AND column_name = 'title'
    ) THEN
        ALTER TABLE sessions ADD COLUMN title VARCHAR(255);
        RAISE NOTICE '✅ Added title column';
    END IF;

    -- Description column (required by booking function)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'sessions' AND column_name = 'description'
    ) THEN
        ALTER TABLE sessions ADD COLUMN description TEXT;
        RAISE NOTICE '✅ Added description column';
    END IF;

    -- Scheduled date column (required by booking function)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'sessions' AND column_name = 'scheduled_date'
    ) THEN
        ALTER TABLE sessions ADD COLUMN scheduled_date DATE;
        RAISE NOTICE '✅ Added scheduled_date column';
    END IF;

    -- Scheduled time column (required by booking function)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'sessions' AND column_name = 'scheduled_time'
    ) THEN
        ALTER TABLE sessions ADD COLUMN scheduled_time TIME;
        RAISE NOTICE '✅ Added scheduled_time column';
    END IF;

    -- Start time column (required by booking function)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'sessions' AND column_name = 'start_time'
    ) THEN
        ALTER TABLE sessions ADD COLUMN start_time TIMESTAMP WITH TIME ZONE;
        ALTER TABLE sessions ALTER COLUMN start_time SET DEFAULT NOW();
        RAISE NOTICE '✅ Added start_time column';
    END IF;

    -- End time column (required by booking function)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'sessions' AND column_name = 'end_time'
    ) THEN
        ALTER TABLE sessions ADD COLUMN end_time TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE '✅ Added end_time column';
    END IF;

    -- Duration minutes column (required by booking function)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'sessions' AND column_name = 'duration_minutes'
    ) THEN
        ALTER TABLE sessions ADD COLUMN duration_minutes INTEGER DEFAULT 60;
        RAISE NOTICE '✅ Added duration_minutes column';
    END IF;

    -- Session type column (required by booking function)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'sessions' AND column_name = 'session_type'
    ) THEN
        ALTER TABLE sessions ADD COLUMN session_type VARCHAR(50) DEFAULT 'video';
        RAISE NOTICE '✅ Added session_type column';
    END IF;
    
    -- Add session_type constraint if column exists and constraint doesn't
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'sessions' AND column_name = 'session_type'
    ) AND NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'check_session_type'
    ) THEN
        ALTER TABLE sessions ADD CONSTRAINT check_session_type CHECK (session_type IN ('video', 'audio', 'chat', 'in_person'));
        RAISE NOTICE '✅ Added session_type constraint';
    END IF;

    -- Status column (required by booking function)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'sessions' AND column_name = 'status'
    ) THEN
        ALTER TABLE sessions ADD COLUMN status VARCHAR(50) DEFAULT 'scheduled';
        RAISE NOTICE '✅ Added status column';
    END IF;
    
    -- Add status constraint if column exists and constraint doesn't
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'sessions' AND column_name = 'status'
    ) AND NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'check_status'
    ) THEN
        ALTER TABLE sessions ADD CONSTRAINT check_status CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'));
        RAISE NOTICE '✅ Added status constraint';
    END IF;

    -- Created at column (required by booking function)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'sessions' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE sessions ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE '✅ Added created_at column';
    END IF;

    -- Updated at column (required by booking function)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'sessions' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE sessions ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE '✅ Added updated_at column';
    END IF;

    -- User ID column (required by booking function)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'sessions' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE sessions ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE CASCADE;
        RAISE NOTICE '✅ Added user_id column';
    END IF;

    -- Therapist ID column (required by booking function)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'sessions' AND column_name = 'therapist_id'
    ) THEN
        ALTER TABLE sessions ADD COLUMN therapist_id UUID REFERENCES users(id) ON DELETE CASCADE;
        RAISE NOTICE '✅ Added therapist_id column';
    END IF;

    RAISE NOTICE '✅ All sessions table columns verified!';
END $$;

-- 2. Ensure check_booking_conflict function exists
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

-- 3. Ensure user_credits table has required columns
-- =============================================
DO $$
BEGIN
    -- Ensure user_credits table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_credits') THEN
        CREATE TABLE user_credits (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
            user_type VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (user_type IN ('user', 'individual', 'therapist', 'partner')),
            credits_balance INTEGER NOT NULL DEFAULT 0,
            credits_purchased INTEGER NOT NULL DEFAULT 0,
            credits_used INTEGER NOT NULL DEFAULT 0,
            credits_expired INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        );
        RAISE NOTICE '✅ Created user_credits table';
    END IF;

    -- Add missing columns to existing user_credits table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_credits' AND column_name = 'credits_balance'
    ) THEN
        ALTER TABLE user_credits ADD COLUMN credits_balance INTEGER NOT NULL DEFAULT 0;
        RAISE NOTICE '✅ Added credits_balance column';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_credits' AND column_name = 'credits_used'
    ) THEN
        ALTER TABLE user_credits ADD COLUMN credits_used INTEGER NOT NULL DEFAULT 0;
        RAISE NOTICE '✅ Added credits_used column';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_credits' AND column_name = 'user_type'
    ) THEN
        ALTER TABLE user_credits ADD COLUMN user_type VARCHAR(20) NOT NULL DEFAULT 'user';
        RAISE NOTICE '✅ Added user_type column';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_credits' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE user_credits ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        ALTER TABLE user_credits ALTER COLUMN created_at SET NOT NULL;
        RAISE NOTICE '✅ Added created_at column';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_credits' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE user_credits ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        ALTER TABLE user_credits ALTER COLUMN updated_at SET NOT NULL;
        RAISE NOTICE '✅ Added updated_at column';
    END IF;

    RAISE NOTICE '✅ All user_credits table columns verified!';
END $$;

-- 4. Create exclusion constraint to prevent double bookings
-- =============================================
DO $$
BEGIN
    -- Drop existing exclusion constraint if it exists
    DROP INDEX IF EXISTS idx_sessions_therapist_time_exclusion;
    
    -- Create exclusion constraint to prevent overlapping bookings for same therapist
    CREATE UNIQUE INDEX idx_sessions_therapist_time_exclusion ON sessions (therapist_id, start_time)
    WHERE status IN ('scheduled', 'confirmed', 'in_progress');
    
    RAISE NOTICE '✅ Created exclusion constraint for double booking prevention';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⚠️  Exclusion constraint may already exist or have different structure';
END $$;

-- 5. Create indexes for performance
-- =============================================
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_therapist_id ON sessions(therapist_id);
CREATE INDEX IF NOT EXISTS idx_sessions_scheduled_date ON sessions(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_sessions_end_time ON sessions(end_time);
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_user_credits_user_type ON user_credits(user_id, user_type);

-- 6. Verify booking function exists
-- =============================================
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'create_session_with_credit_deduction'
    ) THEN
        RAISE NOTICE '✅ Booking function exists';
    ELSE
        RAISE EXCEPTION '❌ Booking function create_session_with_credit_deduction does not exist! Run redeploy-booking-function.sql first.';
    END IF;
END $$;

-- 7. Final verification - show all sessions columns
-- =============================================
SELECT 
    'SESSIONS TABLE COLUMNS' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'sessions'
ORDER BY ordinal_position;

-- 8. Show user_credits columns
SELECT 
    'USER_CREDITS TABLE COLUMNS' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'user_credits'
ORDER BY ordinal_position;

SELECT '✅ Complete booking setup finished! All required columns and functions are ready.' as status;

