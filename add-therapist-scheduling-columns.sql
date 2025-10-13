-- Add missing columns for therapist scheduling feature
-- Run this in your Supabase SQL Editor

-- 1. Add duration column (base field) if it doesn't exist
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT 30;

-- 2. Add scheduled_date and scheduled_time for easier querying
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS scheduled_date DATE,
ADD COLUMN IF NOT EXISTS scheduled_time TIME;

-- 3. Add notes, title and description for session details
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS title VARCHAR(255),
ADD COLUMN IF NOT EXISTS description TEXT;

-- 4. Add duration_minutes (some queries use this instead of duration)
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;

-- 5. Add credit tracking column
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS credit_used_id UUID REFERENCES user_credits(id) ON DELETE SET NULL;

-- 6. Add flag to track therapist-scheduled sessions
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS scheduled_by_therapist BOOLEAN DEFAULT false;

-- 7. Fix the broken check_booking_conflict function (if it exists)
-- This function was comparing TIME with TIMESTAMP WITH TIME ZONE which causes errors
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
    -- Convert TIME to TIMESTAMP WITH TIME ZONE for proper comparison
    p_start_timestamp := (p_session_date || ' ' || p_start_time)::TIMESTAMP WITH TIME ZONE;
    p_end_timestamp := (p_session_date || ' ' || p_end_time)::TIMESTAMP WITH TIME ZONE;
    
    -- Check for existing sessions that overlap using proper TIMESTAMP comparisons
    SELECT COUNT(*) INTO conflict_count
    FROM sessions s
    WHERE s.therapist_id = p_therapist_id
    AND s.status IN ('scheduled', 'confirmed', 'in_progress')
    AND (
        -- Compare TIMESTAMP WITH TIME ZONE values
        (s.start_time < p_end_timestamp AND s.end_time > p_start_timestamp)
    );
    
    RETURN conflict_count > 0;
END;
$$ LANGUAGE plpgsql;

-- 8. Create a trigger to auto-populate scheduled_date/time from start_time
CREATE OR REPLACE FUNCTION sync_scheduled_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- If start_time is provided, extract date and time
  IF NEW.start_time IS NOT NULL THEN
    NEW.scheduled_date := NEW.start_time::DATE;
    NEW.scheduled_time := NEW.start_time::TIME;
  END IF;
  
  -- If scheduled_date/time are provided, construct start_time
  IF NEW.scheduled_date IS NOT NULL AND NEW.scheduled_time IS NOT NULL AND NEW.start_time IS NULL THEN
    NEW.start_time := (NEW.scheduled_date || ' ' || NEW.scheduled_time)::TIMESTAMP WITH TIME ZONE;
  END IF;
  
  -- Sync duration and duration_minutes
  IF NEW.duration IS NOT NULL AND NEW.duration_minutes IS NULL THEN
    NEW.duration_minutes := NEW.duration;
  END IF;
  
  IF NEW.duration_minutes IS NOT NULL AND NEW.duration IS NULL THEN
    NEW.duration := NEW.duration_minutes;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS sync_session_fields ON sessions;
CREATE TRIGGER sync_session_fields
  BEFORE INSERT OR UPDATE ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION sync_scheduled_fields();

-- 9. Update existing records to populate the new fields
-- First, set default duration if null
UPDATE sessions SET duration = 30 WHERE duration IS NULL;

-- Then sync all the fields
UPDATE sessions 
SET 
  scheduled_date = COALESCE(scheduled_date, start_time::DATE),
  scheduled_time = COALESCE(scheduled_time, start_time::TIME),
  duration_minutes = COALESCE(duration_minutes, duration)
WHERE start_time IS NOT NULL;

-- 10. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sessions_scheduled_date ON sessions(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_sessions_credit_used ON sessions(credit_used_id);
CREATE INDEX IF NOT EXISTS idx_sessions_scheduled_by_therapist ON sessions(scheduled_by_therapist);
CREATE INDEX IF NOT EXISTS idx_sessions_therapist_date ON sessions(therapist_id, scheduled_date);

-- 11. Refresh the PostgREST schema cache (this tells Supabase to reload)
NOTIFY pgrst, 'reload schema';

-- IMPORTANT: After running this, you may need to manually refresh in Supabase:
-- Go to Settings > API > "Reload schema cache" button
-- OR wait 1-2 minutes for automatic cache refresh

-- 12. Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'sessions' 
AND table_schema = 'public'
ORDER BY ordinal_position;

