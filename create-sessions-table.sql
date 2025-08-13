-- Create sessions table for therapy bookings
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  therapist_id UUID REFERENCES therapists(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  daily_room_name VARCHAR(255),
  daily_room_url VARCHAR(500),
  daily_room_created_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_therapist_id ON sessions(therapist_id);
CREATE INDEX IF NOT EXISTS idx_sessions_scheduled_date ON sessions(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);

-- Create therapists table if it doesn't exist
CREATE TABLE IF NOT EXISTS therapists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  specialization VARCHAR(255),
  bio TEXT,
  hourly_rate DECIMAL(10,2),
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create therapist availability table
CREATE TABLE IF NOT EXISTS therapist_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id UUID REFERENCES therapists(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 1=Monday, etc.
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for availability queries
CREATE INDEX IF NOT EXISTS idx_therapist_availability_therapist_id ON therapist_availability(therapist_id);
CREATE INDEX IF NOT EXISTS idx_therapist_availability_day_time ON therapist_availability(day_of_week, start_time, end_time);

-- Enable Row Level Security
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapists ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapist_availability ENABLE ROW LEVEL SECURITY;

-- Create policies for sessions
CREATE POLICY "Users can view their own sessions" ON sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sessions" ON sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" ON sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policies for therapists
CREATE POLICY "Therapists can view their own profile" ON therapists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Therapists can update their own profile" ON therapists
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policies for availability
CREATE POLICY "Therapists can manage their availability" ON therapist_availability
  FOR ALL USING (auth.uid() = (SELECT user_id FROM therapists WHERE id = therapist_id));

-- Insert some sample therapists
INSERT INTO therapists (id, user_id, full_name, email, specialization, bio, hourly_rate, is_verified) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Dr. Emily White', 'emily.white@trpi.com', 'Cognitive Behavioral Therapy', 'Experienced therapist specializing in anxiety and depression treatment.', 120.00, true),
  ('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'Mr. John Davis', 'john.davis@trpi.com', 'Trauma Therapy', 'Specialist in trauma processing and PTSD treatment.', 150.00, true),
  ('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 'Dr. Sarah Johnson', 'sarah.johnson@trpi.com', 'Family Therapy', 'Expert in family dynamics and relationship counseling.', 130.00, true);

-- Insert sample availability for therapists
INSERT INTO therapist_availability (therapist_id, day_of_week, start_time, end_time) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 1, '09:00:00', '17:00:00'), -- Monday
  ('550e8400-e29b-41d4-a716-446655440001', 2, '09:00:00', '17:00:00'), -- Tuesday
  ('550e8400-e29b-41d4-a716-446655440001', 3, '09:00:00', '17:00:00'), -- Wednesday
  ('550e8400-e29b-41d4-a716-446655440001', 4, '09:00:00', '17:00:00'), -- Thursday
  ('550e8400-e29b-41d4-a716-446655440001', 5, '09:00:00', '17:00:00'), -- Friday
  ('550e8400-e29b-41d4-a716-446655440002', 1, '10:00:00', '18:00:00'), -- Monday
  ('550e8400-e29b-41d4-a716-446655440002', 2, '10:00:00', '18:00:00'), -- Tuesday
  ('550e8400-e29b-41d4-a716-446655440002', 3, '10:00:00', '18:00:00'), -- Wednesday
  ('550e8400-e29b-41d4-a716-446655440002', 4, '10:00:00', '18:00:00'), -- Thursday
  ('550e8400-e29b-41d4-a716-446655440002', 5, '10:00:00', '18:00:00'), -- Friday
  ('550e8400-e29b-41d4-a716-446655440003', 1, '08:00:00', '16:00:00'), -- Monday
  ('550e8400-e29b-41d4-a716-446655440003', 2, '08:00:00', '16:00:00'), -- Tuesday
  ('550e8400-e29b-41d4-a716-446655440003', 3, '08:00:00', '16:00:00'), -- Wednesday
  ('550e8400-e29b-41d4-a716-446655440003', 4, '08:00:00', '16:00:00'), -- Thursday
  ('550e8400-e29b-41d4-a716-446655440003', 5, '08:00:00', '16:00:00'); -- Friday
