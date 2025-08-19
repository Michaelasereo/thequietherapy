-- =====================================================
-- ALTER EXISTING THERAPIST AVAILABILITY TABLE
-- =====================================================
-- This script alters the existing table to add missing columns
-- Run this in your Supabase SQL Editor

-- 1. First, let's see what columns currently exist
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'therapist_availability'
ORDER BY ordinal_position;

-- 2. Add the missing therapist_email column
ALTER TABLE therapist_availability 
ADD COLUMN IF NOT EXISTS therapist_email TEXT;

-- 3. Add other missing columns if they don't exist
ALTER TABLE therapist_availability 
ADD COLUMN IF NOT EXISTS session_duration INTEGER DEFAULT 60;

ALTER TABLE therapist_availability 
ADD COLUMN IF NOT EXISTS max_sessions_per_day INTEGER DEFAULT 8;

ALTER TABLE therapist_availability 
ADD COLUMN IF NOT EXISTS session_title TEXT DEFAULT 'Individual Therapy Session';

ALTER TABLE therapist_availability 
ADD COLUMN IF NOT EXISTS session_type TEXT DEFAULT 'individual' CHECK (session_type IN ('individual', 'group'));

ALTER TABLE therapist_availability 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE therapist_availability 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 4. Update existing records to have therapist_email
-- This assumes the existing records are for the current therapist
UPDATE therapist_availability 
SET therapist_email = 'michaelasereoo@gmail.com'
WHERE therapist_email IS NULL;

-- 5. Make therapist_email NOT NULL after populating it
ALTER TABLE therapist_availability 
ALTER COLUMN therapist_email SET NOT NULL;

-- 6. Add unique constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'therapist_availability_therapist_email_day_of_week_key'
    ) THEN
        ALTER TABLE therapist_availability 
        ADD CONSTRAINT therapist_availability_therapist_email_day_of_week_key 
        UNIQUE (therapist_email, day_of_week);
    END IF;
END $$;

-- 7. Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_therapist_availability_email ON therapist_availability(therapist_email);
CREATE INDEX IF NOT EXISTS idx_therapist_availability_day ON therapist_availability(day_of_week);

-- 8. Enable RLS if not already enabled
ALTER TABLE therapist_availability ENABLE ROW LEVEL SECURITY;

-- 9. Create or update policies
DROP POLICY IF EXISTS "Therapists can manage their own availability" ON therapist_availability;
CREATE POLICY "Therapists can manage their own availability" ON therapist_availability
  FOR ALL USING (therapist_email = auth.email());

DROP POLICY IF EXISTS "Users can view therapist availability" ON therapist_availability;
CREATE POLICY "Users can view therapist availability" ON therapist_availability
  FOR SELECT USING (true);

-- 10. Insert sample data for the existing therapist (if not exists)
-- First, let's update existing records with default values for new columns
UPDATE therapist_availability 
SET 
  session_duration = COALESCE(session_duration, 60),
  max_sessions_per_day = COALESCE(max_sessions_per_day, 8),
  session_title = COALESCE(session_title, 'Individual Therapy Session'),
  session_type = COALESCE(session_type, 'individual'),
  created_at = COALESCE(created_at, NOW()),
  updated_at = NOW()
WHERE therapist_email = 'michaelasereoo@gmail.com';

-- Then insert new records for missing days
INSERT INTO therapist_availability (
  therapist_email,
  day_of_week,
  start_time,
  end_time,
  is_available,
  session_duration,
  max_sessions_per_day,
  session_title,
  session_type
) VALUES 
  ('michaelasereoo@gmail.com', 1, '09:00', '17:00', true, 60, 8, 'Individual Therapy Session', 'individual'),
  ('michaelasereoo@gmail.com', 2, '09:00', '17:00', true, 60, 8, 'Individual Therapy Session', 'individual'),
  ('michaelasereoo@gmail.com', 3, '09:00', '17:00', true, 60, 8, 'Individual Therapy Session', 'individual'),
  ('michaelasereoo@gmail.com', 4, '09:00', '17:00', true, 60, 8, 'Individual Therapy Session', 'individual'),
  ('michaelasereoo@gmail.com', 5, '09:00', '17:00', true, 60, 8, 'Individual Therapy Session', 'individual')
ON CONFLICT (therapist_email, day_of_week) 
DO UPDATE SET
  start_time = EXCLUDED.start_time,
  end_time = EXCLUDED.end_time,
  is_available = EXCLUDED.is_available,
  session_duration = EXCLUDED.session_duration,
  max_sessions_per_day = EXCLUDED.max_sessions_per_day,
  session_title = EXCLUDED.session_title,
  session_type = EXCLUDED.session_type,
  updated_at = NOW();

-- 11. Verify the table structure
SELECT 
  'Table structure after alterations:' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'therapist_availability'
ORDER BY ordinal_position;

-- 12. Show sample data
SELECT 
  'Sample data:' as info,
  therapist_email,
  day_of_week,
  start_time,
  end_time,
  is_available,
  session_duration,
  session_title,
  session_type
FROM therapist_availability 
WHERE therapist_email = 'michaelasereoo@gmail.com'
ORDER BY day_of_week;

-- 13. Final verification
SELECT 
  'Alteration Complete!' as status,
  COUNT(*) as total_records,
  COUNT(DISTINCT therapist_email) as unique_therapists
FROM therapist_availability;
