-- =============================================
-- STANDARDIZE SESSION DATE FIELDS
-- =============================================
-- This migration ensures all sessions use start_time TIMESTAMP consistently
-- and backfills start_time from scheduled_date + scheduled_time if needed

-- Step 1: Ensure start_time column exists (should already exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sessions' AND column_name = 'start_time'
    ) THEN
        ALTER TABLE sessions ADD COLUMN start_time TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE '✅ Added start_time column';
    ELSE
        RAISE NOTICE '✅ start_time column already exists';
    END IF;
END $$;

-- Step 2: Ensure end_time column exists (should already exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sessions' AND column_name = 'end_time'
    ) THEN
        ALTER TABLE sessions ADD COLUMN end_time TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE '✅ Added end_time column';
    ELSE
        RAISE NOTICE '✅ end_time column already exists';
    END IF;
END $$;

-- Step 3: Backfill start_time from scheduled_date + scheduled_time
-- Only update rows where start_time is NULL but scheduled_date/time exist
UPDATE sessions
SET 
    start_time = (scheduled_date || ' ' || scheduled_time)::TIMESTAMP WITH TIME ZONE
WHERE 
    start_time IS NULL 
    AND scheduled_date IS NOT NULL 
    AND scheduled_time IS NOT NULL;

-- Step 4: Backfill end_time from start_time + duration_minutes
-- Only update rows where end_time is NULL but start_time and duration exist
UPDATE sessions
SET 
    end_time = start_time + INTERVAL '1 minute' * COALESCE(duration_minutes, duration, 60)
WHERE 
    end_time IS NULL 
    AND start_time IS NOT NULL;

-- Step 5: Create index on start_time for performance (if not exists)
CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_sessions_end_time ON sessions(end_time);
CREATE INDEX IF NOT EXISTS idx_sessions_start_time_status ON sessions(start_time, status);

-- Step 6: Verify data consistency
DO $$
DECLARE
    v_null_start_time INTEGER;
    v_null_end_time INTEGER;
    v_total_sessions INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_null_start_time FROM sessions WHERE start_time IS NULL;
    SELECT COUNT(*) INTO v_null_end_time FROM sessions WHERE end_time IS NULL;
    SELECT COUNT(*) INTO v_total_sessions FROM sessions;
    
    RAISE NOTICE '📊 Migration Results:';
    RAISE NOTICE '   Total sessions: %', v_total_sessions;
    RAISE NOTICE '   Sessions with NULL start_time: %', v_null_start_time;
    RAISE NOTICE '   Sessions with NULL end_time: %', v_null_end_time;
    
    IF v_null_start_time = 0 AND v_null_end_time = 0 THEN
        RAISE NOTICE '✅ All sessions have start_time and end_time!';
    ELSE
        RAISE WARNING '⚠️ Some sessions still have NULL times. Manual intervention may be needed.';
    END IF;
END $$;

-- =============================================
-- NOTES:
-- =============================================
-- 1. This migration maintains backward compatibility by keeping 
--    scheduled_date and scheduled_time columns (they're still used in some queries)
-- 2. All new code should prefer start_time TIMESTAMP over scheduled_date + scheduled_time
-- 3. The indexes will improve query performance for date-based filters
-- 4. Consider deprecating scheduled_date/scheduled_time in a future migration
-- =============================================

