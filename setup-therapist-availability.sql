-- =====================================================
-- THERAPIST AVAILABILITY SYSTEM SETUP
-- =====================================================
-- This script sets up the complete therapist availability system
-- for the Trpi therapy platform booking flow

-- =====================================================
-- 1. CREATE THERAPIST AVAILABILITY TABLE
-- =====================================================

-- Drop existing table if it exists (for clean setup)
DROP TABLE IF EXISTS therapist_availability CASCADE;

-- Create the main therapist availability table
CREATE TABLE therapist_availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  therapist_email TEXT NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 1=Monday, etc.
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  session_duration INTEGER DEFAULT 60, -- in minutes
  max_sessions_per_day INTEGER DEFAULT 8,
  session_title TEXT DEFAULT 'Individual Therapy Session',
  session_type TEXT DEFAULT 'individual' CHECK (session_type IN ('individual', 'group')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique combination of therapist and day
  UNIQUE(therapist_email, day_of_week)
);

-- =====================================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Index for therapist email lookups (most common query)
CREATE INDEX idx_therapist_availability_email ON therapist_availability(therapist_email);

-- Index for day of week lookups
CREATE INDEX idx_therapist_availability_day ON therapist_availability(day_of_week);

-- Composite index for availability queries
CREATE INDEX idx_therapist_availability_lookup ON therapist_availability(therapist_email, day_of_week, is_available);

-- Index for time range queries
CREATE INDEX idx_therapist_availability_time ON therapist_availability(start_time, end_time);

-- =====================================================
-- 3. ENABLE ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE therapist_availability ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. CREATE SECURITY POLICIES
-- =====================================================

-- Policy for therapists to manage their own availability
CREATE POLICY "Therapists can manage their own availability" ON therapist_availability
  FOR ALL USING (therapist_email = auth.email());

-- Policy for users to view therapist availability (for booking)
CREATE POLICY "Users can view therapist availability" ON therapist_availability
  FOR SELECT USING (true);

-- Policy for admin access (if needed)
CREATE POLICY "Admin can manage all availability" ON therapist_availability
  FOR ALL USING (auth.email() IN (
    SELECT email FROM users WHERE user_type = 'admin'
  ));

-- =====================================================
-- 5. CREATE TRIGGER FOR UPDATED_AT
-- =====================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_therapist_availability_updated_at 
    BEFORE UPDATE ON therapist_availability 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 6. INSERT SAMPLE DATA (OPTIONAL)
-- =====================================================

-- Insert sample availability for the existing therapist
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

-- =====================================================
-- 7. CREATE HELPER FUNCTIONS
-- =====================================================

-- Function to get therapist availability for a specific day
CREATE OR REPLACE FUNCTION get_therapist_availability(
  p_therapist_email TEXT,
  p_day_of_week INTEGER
)
RETURNS TABLE (
  id UUID,
  therapist_email TEXT,
  day_of_week INTEGER,
  start_time TIME,
  end_time TIME,
  is_available BOOLEAN,
  session_duration INTEGER,
  max_sessions_per_day INTEGER,
  session_title TEXT,
  session_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ta.id,
    ta.therapist_email,
    ta.day_of_week,
    ta.start_time,
    ta.end_time,
    ta.is_available,
    ta.session_duration,
    ta.max_sessions_per_day,
    ta.session_title,
    ta.session_type
  FROM therapist_availability ta
  WHERE ta.therapist_email = p_therapist_email
    AND ta.day_of_week = p_day_of_week
    AND ta.is_available = true;
END;
$$ LANGUAGE plpgsql;

-- Function to get all available therapists for a specific day and time
CREATE OR REPLACE FUNCTION get_available_therapists(
  p_day_of_week INTEGER,
  p_start_time TIME,
  p_end_time TIME
)
RETURNS TABLE (
  therapist_email TEXT,
  start_time TIME,
  end_time TIME,
  session_duration INTEGER,
  session_title TEXT,
  session_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ta.therapist_email,
    ta.start_time,
    ta.end_time,
    ta.session_duration,
    ta.session_title,
    ta.session_type
  FROM therapist_availability ta
  WHERE ta.day_of_week = p_day_of_week
    AND ta.is_available = true
    AND ta.start_time <= p_start_time
    AND ta.end_time >= p_end_time;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 8. CREATE VIEWS FOR COMMON QUERIES
-- =====================================================

-- View for therapist availability summary
CREATE OR REPLACE VIEW therapist_availability_summary AS
SELECT 
  therapist_email,
  COUNT(*) as total_days,
  COUNT(CASE WHEN is_available THEN 1 END) as available_days,
  MIN(start_time) as earliest_start,
  MAX(end_time) as latest_end,
  AVG(session_duration) as avg_session_duration
FROM therapist_availability
GROUP BY therapist_email;

-- View for available time slots
CREATE OR REPLACE VIEW available_time_slots AS
SELECT 
  ta.therapist_email,
  ta.day_of_week,
  ta.start_time,
  ta.end_time,
  ta.session_duration,
  ta.session_title,
  ta.session_type,
  ta.max_sessions_per_day,
  -- Calculate available slots based on session duration
  FLOOR(EXTRACT(EPOCH FROM (ta.end_time - ta.start_time)) / 60 / ta.session_duration) as available_slots
FROM therapist_availability ta
WHERE ta.is_available = true;

-- =====================================================
-- 9. VERIFICATION QUERIES
-- =====================================================

-- Check if table was created successfully
SELECT 'Table created successfully' as status, COUNT(*) as total_records 
FROM therapist_availability;

-- Check sample data
SELECT 
  therapist_email,
  day_of_week,
  start_time,
  end_time,
  is_available,
  session_duration
FROM therapist_availability 
WHERE therapist_email = 'michaelasereoo@gmail.com'
ORDER BY day_of_week;

-- Check indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'therapist_availability';

-- =====================================================
-- 10. COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON TABLE therapist_availability IS 'Stores therapist availability schedules for booking system';
COMMENT ON COLUMN therapist_availability.therapist_email IS 'Email of the therapist (primary identifier)';
COMMENT ON COLUMN therapist_availability.day_of_week IS 'Day of week (0=Sunday, 1=Monday, ..., 6=Saturday)';
COMMENT ON COLUMN therapist_availability.start_time IS 'Start time of availability window';
COMMENT ON COLUMN therapist_availability.end_time IS 'End time of availability window';
COMMENT ON COLUMN therapist_availability.session_duration IS 'Duration of each session in minutes';
COMMENT ON COLUMN therapist_availability.max_sessions_per_day IS 'Maximum number of sessions per day';
COMMENT ON COLUMN therapist_availability.session_type IS 'Type of session (individual or group)';

-- =====================================================
-- SETUP COMPLETE
-- =====================================================

-- Display completion message
SELECT 
  'Therapist Availability System Setup Complete!' as message,
  NOW() as setup_time;
