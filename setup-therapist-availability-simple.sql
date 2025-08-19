-- =====================================================
-- SIMPLE THERAPIST AVAILABILITY SETUP
-- =====================================================
-- Run this script in your Supabase SQL Editor

-- 1. Create the therapist availability table
CREATE TABLE IF NOT EXISTS therapist_availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  therapist_email TEXT NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  session_duration INTEGER DEFAULT 60,
  max_sessions_per_day INTEGER DEFAULT 8,
  session_title TEXT DEFAULT 'Individual Therapy Session',
  session_type TEXT DEFAULT 'individual' CHECK (session_type IN ('individual', 'group')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(therapist_email, day_of_week)
);

-- 2. Create indexes
CREATE INDEX IF NOT EXISTS idx_therapist_availability_email ON therapist_availability(therapist_email);
CREATE INDEX IF NOT EXISTS idx_therapist_availability_day ON therapist_availability(day_of_week);

-- 3. Enable RLS
ALTER TABLE therapist_availability ENABLE ROW LEVEL SECURITY;

-- 4. Create policies
DROP POLICY IF EXISTS "Therapists can manage their own availability" ON therapist_availability;
CREATE POLICY "Therapists can manage their own availability" ON therapist_availability
  FOR ALL USING (therapist_email = auth.email());

DROP POLICY IF EXISTS "Users can view therapist availability" ON therapist_availability;
CREATE POLICY "Users can view therapist availability" ON therapist_availability
  FOR SELECT USING (true);

-- 5. Insert sample data for existing therapist
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

-- 6. Verify setup
SELECT 'Setup Complete!' as status, COUNT(*) as total_records FROM therapist_availability;
