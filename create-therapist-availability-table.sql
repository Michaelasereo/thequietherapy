-- Create therapist availability table
CREATE TABLE IF NOT EXISTS therapist_availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  therapist_email TEXT NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 1=Monday, etc.
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  session_duration INTEGER DEFAULT 60, -- in minutes
  max_sessions_per_day INTEGER DEFAULT 8,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique combination of therapist and day
  UNIQUE(therapist_email, day_of_week)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_therapist_availability_email ON therapist_availability(therapist_email);
CREATE INDEX IF NOT EXISTS idx_therapist_availability_day ON therapist_availability(day_of_week);

-- Enable RLS
ALTER TABLE therapist_availability ENABLE ROW LEVEL SECURITY;

-- Policy for therapist availability (therapists can only see their own availability)
CREATE POLICY "Therapists can manage their own availability" ON therapist_availability
  FOR ALL USING (therapist_email = auth.email());

-- Policy for users to view therapist availability (for booking)
CREATE POLICY "Users can view therapist availability" ON therapist_availability
  FOR SELECT USING (true);
