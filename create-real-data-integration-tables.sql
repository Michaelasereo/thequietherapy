-- Real Data Integration Tables for TRPI
-- This script creates all necessary tables for the real data integration system

-- 1. Therapist Profiles Table (extends users table)
CREATE TABLE IF NOT EXISTS therapist_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  specializations TEXT[] DEFAULT '{}',
  bio TEXT,
  experience_years INTEGER DEFAULT 0,
  education TEXT,
  languages TEXT[] DEFAULT '{"English"}',
  session_rate INTEGER DEFAULT 10000, -- Rate in kobo/cents
  availability_status TEXT DEFAULT 'offline' CHECK (availability_status IN ('available', 'busy', 'offline')),
  profile_image_url TEXT,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('verified', 'pending', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 2. Therapist Availability Table
CREATE TABLE IF NOT EXISTS therapist_availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  therapist_id UUID REFERENCES users(id) ON DELETE CASCADE,
  availability_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  session_type TEXT DEFAULT 'individual' CHECK (session_type IN ('individual', 'group')),
  session_duration INTEGER DEFAULT 60, -- Duration in minutes
  max_participants INTEGER DEFAULT 1,
  price INTEGER DEFAULT 10000, -- Price in kobo/cents
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(therapist_id, availability_date, start_time)
);

-- 3. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'session', 'payment', 'system')),
  read BOOLEAN DEFAULT false,
  action_url TEXT,
  action_text TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Uploaded Files Table
CREATE TABLE IF NOT EXISTS uploaded_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  size INTEGER NOT NULL,
  type TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('images', 'documents', 'csv', 'audio', 'video')),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  file_path TEXT NOT NULL,
  url TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Therapy Sessions Table (enhanced)
CREATE TABLE IF NOT EXISTS therapy_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES users(id) ON DELETE CASCADE,
  therapist_id UUID REFERENCES users(id) ON DELETE CASCADE,
  availability_slot_id UUID REFERENCES therapist_availability(id) ON DELETE SET NULL,
  session_date DATE NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
  session_type TEXT DEFAULT 'individual' CHECK (session_type IN ('individual', 'group')),
  session_link TEXT, -- Daily.co room URL
  session_notes TEXT,
  session_summary TEXT,
  amount_charged INTEGER, -- Amount in kobo/cents
  amount_earned INTEGER, -- Therapist earnings in kobo/cents
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Session Notes Table (for AI-generated SOAP notes)
CREATE TABLE IF NOT EXISTS session_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES therapy_sessions(id) ON DELETE CASCADE,
  therapist_id UUID REFERENCES users(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES users(id) ON DELETE CASCADE,
  subjective TEXT, -- Patient's reported experience
  objective TEXT, -- Therapist's observations
  assessment TEXT, -- Clinical assessment
  plan TEXT, -- Treatment plan
  audio_transcript TEXT, -- Full transcript from audio
  ai_generated BOOLEAN DEFAULT false,
  ai_model TEXT, -- Which AI model was used
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id)
);

-- 7. Payment Transactions Table (enhanced)
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reference TEXT UNIQUE NOT NULL,
  amount INTEGER NOT NULL, -- Amount in kobo/cents
  currency TEXT DEFAULT 'NGN',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'cancelled')),
  payment_method TEXT DEFAULT 'paystack',
  paystack_transaction_id TEXT,
  gateway_response JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_therapist_profiles_user_id ON therapist_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_therapist_profiles_verification ON therapist_profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_therapist_profiles_availability ON therapist_profiles(availability_status);

CREATE INDEX IF NOT EXISTS idx_therapist_availability_therapist ON therapist_availability(therapist_id);
CREATE INDEX IF NOT EXISTS idx_therapist_availability_date ON therapist_availability(availability_date);
CREATE INDEX IF NOT EXISTS idx_therapist_availability_available ON therapist_availability(is_available);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

CREATE INDEX IF NOT EXISTS idx_uploaded_files_user_id ON uploaded_files(user_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_category ON uploaded_files(category);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_uploaded_at ON uploaded_files(uploaded_at);

CREATE INDEX IF NOT EXISTS idx_therapy_sessions_patient ON therapy_sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_therapy_sessions_therapist ON therapy_sessions(therapist_id);
CREATE INDEX IF NOT EXISTS idx_therapy_sessions_date ON therapy_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_therapy_sessions_status ON therapy_sessions(status);

CREATE INDEX IF NOT EXISTS idx_session_notes_session ON session_notes(session_id);
CREATE INDEX IF NOT EXISTS idx_session_notes_therapist ON session_notes(therapist_id);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_user ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_reference ON payment_transactions(reference);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);

-- Enable Row Level Security (RLS)
ALTER TABLE therapist_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapist_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploaded_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapy_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for therapist_profiles
CREATE POLICY "Therapist profiles are viewable by everyone" ON therapist_profiles
  FOR SELECT USING (verification_status = 'verified');

CREATE POLICY "Therapists can update own profile" ON therapist_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Therapists can insert own profile" ON therapist_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for therapist_availability
CREATE POLICY "Availability is viewable by everyone" ON therapist_availability
  FOR SELECT USING (is_available = true);

CREATE POLICY "Therapists can manage own availability" ON therapist_availability
  FOR ALL USING (auth.uid() = therapist_id);

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for uploaded_files
CREATE POLICY "Users can view own files" ON uploaded_files
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can upload files" ON uploaded_files
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own files" ON uploaded_files
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for therapy_sessions
CREATE POLICY "Users can view own sessions" ON therapy_sessions
  FOR SELECT USING (auth.uid() = patient_id OR auth.uid() = therapist_id);

CREATE POLICY "Patients can book sessions" ON therapy_sessions
  FOR INSERT WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Therapists can update sessions" ON therapy_sessions
  FOR UPDATE USING (auth.uid() = therapist_id);

-- RLS Policies for session_notes
CREATE POLICY "Session notes viewable by participants" ON session_notes
  FOR SELECT USING (auth.uid() = patient_id OR auth.uid() = therapist_id);

CREATE POLICY "Therapists can create session notes" ON session_notes
  FOR INSERT WITH CHECK (auth.uid() = therapist_id);

CREATE POLICY "Therapists can update own session notes" ON session_notes
  FOR UPDATE USING (auth.uid() = therapist_id);

-- RLS Policies for payment_transactions
CREATE POLICY "Users can view own transactions" ON payment_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create transactions" ON payment_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Insert some sample data for testing
INSERT INTO therapist_profiles (user_id, specializations, bio, experience_years, education, languages, session_rate, verification_status, availability_status)
VALUES 
  (
    (SELECT id FROM users WHERE email = 'therapist@example.com' LIMIT 1),
    '{"anxiety", "depression", "trauma"}',
    'Experienced therapist specializing in anxiety and depression treatment with over 8 years of clinical practice.',
    8,
    'PhD in Clinical Psychology, University of Lagos',
    '{"English", "Yoruba"}',
    15000,
    'verified',
    'available'
  )
ON CONFLICT (user_id) DO NOTHING;

-- Insert sample availability (next 7 days, 9 AM to 5 PM)
INSERT INTO therapist_availability (therapist_id, availability_date, start_time, end_time, session_type, session_duration, price)
SELECT 
  (SELECT id FROM users WHERE email = 'therapist@example.com' LIMIT 1),
  (CURRENT_DATE + interval '1 day' * generate_series(0, 6))::date,
  (generate_series(9, 16) || ':00:00')::time,
  (generate_series(10, 17) || ':00:00')::time,
  'individual',
  60,
  15000
FROM generate_series(0, 6) days, generate_series(9, 16) hours
ON CONFLICT (therapist_id, availability_date, start_time) DO NOTHING;

-- Insert sample notifications
INSERT INTO notifications (user_id, title, message, type, action_url, action_text)
SELECT 
  id,
  'Welcome to TRPI',
  'Welcome to the TRPI platform! Complete your profile to get started.',
  'info',
  '/dashboard/profile',
  'Complete Profile'
FROM users 
WHERE user_type IN ('individual', 'therapist')
ON CONFLICT DO NOTHING;

COMMIT;
