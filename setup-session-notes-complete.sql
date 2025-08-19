-- Complete setup for session_notes table with AI support
-- This script will drop and recreate the table with all necessary columns

-- Drop existing table and views if they exist
DROP VIEW IF EXISTS session_notes_with_details;
DROP VIEW IF EXISTS ai_session_notes_view;
DROP TABLE IF EXISTS session_notes CASCADE;

-- Create session_notes table with all required columns
CREATE TABLE session_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  therapist_id UUID NOT NULL,
  user_id UUID NOT NULL,
  notes TEXT,
  mood_rating INTEGER CHECK (mood_rating >= 1 AND mood_rating <= 10),
  progress_notes TEXT,
  homework_assigned TEXT,
  next_session_focus TEXT,
  
  -- AI-generated content fields
  ai_generated BOOLEAN DEFAULT false,
  transcript TEXT,
  recording_id VARCHAR(255),
  processing_time_ms INTEGER,
  
  -- SOAP notes structure
  soap_subjective TEXT,
  soap_objective TEXT,
  soap_assessment TEXT,
  soap_plan TEXT,
  
  -- Therapeutic insights
  therapeutic_insights JSONB,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_session_notes_session_id ON session_notes(session_id);
CREATE INDEX idx_session_notes_therapist_id ON session_notes(therapist_id);
CREATE INDEX idx_session_notes_user_id ON session_notes(user_id);
CREATE INDEX idx_session_notes_created_at ON session_notes(created_at);
CREATE INDEX idx_session_notes_ai_generated ON session_notes(ai_generated);
CREATE INDEX idx_session_notes_recording_id ON session_notes(recording_id);

-- Enable Row Level Security
ALTER TABLE session_notes ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Therapists can view and edit their own session notes
CREATE POLICY "Therapists can manage their session notes" ON session_notes
  FOR ALL USING (therapist_id = auth.uid());

-- Users can view their own session notes (read-only)
CREATE POLICY "Users can view their session notes" ON session_notes
  FOR SELECT USING (user_id = auth.uid());

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_session_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_session_notes_updated_at
  BEFORE UPDATE ON session_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_session_notes_updated_at();

-- Create session processing errors table
CREATE TABLE IF NOT EXISTS session_processing_errors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL,
  recording_id VARCHAR(255),
  error_message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for processing errors
CREATE INDEX idx_processing_errors_session_id ON session_processing_errors(session_id);
CREATE INDEX idx_processing_errors_created_at ON session_processing_errors(created_at);

-- Add recording-related columns to sessions table if they don't exist
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS daily_room_recording_id VARCHAR(255);
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS daily_room_recording_url TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS recording_duration INTEGER;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS recording_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS recording_error TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS end_time TIMESTAMP WITH TIME ZONE;

-- Create indexes for session recording data
CREATE INDEX IF NOT EXISTS idx_sessions_recording_id ON sessions(daily_room_recording_id);
CREATE INDEX IF NOT EXISTS idx_sessions_recording_status ON sessions(recording_status);

-- Create views
CREATE OR REPLACE VIEW session_notes_with_details AS
SELECT 
  sn.*,
  s.title as session_title,
  s.status as session_status,
  s.scheduled_date,
  s.scheduled_time,
  s.duration_minutes,
  u.full_name as patient_name,
  u.email as patient_email,
  t.full_name as therapist_name,
  t.email as therapist_email
FROM session_notes sn
JOIN sessions s ON sn.session_id = s.id
JOIN users u ON sn.user_id = u.id
JOIN users t ON sn.therapist_id = t.id;

CREATE OR REPLACE VIEW ai_session_notes_view AS
SELECT 
  sn.*,
  s.title as session_title,
  s.status as session_status,
  s.scheduled_date,
  s.scheduled_time,
  s.duration_minutes,
  s.recording_status,
  s.recording_duration,
  u.full_name as patient_name,
  u.email as patient_email,
  t.full_name as therapist_name,
  t.email as therapist_email,
  CASE 
    WHEN sn.ai_generated THEN 'AI Generated'
    ELSE 'Manual'
  END as notes_type
FROM session_notes sn
JOIN sessions s ON sn.session_id = s.id
JOIN users u ON sn.user_id = u.id
JOIN users t ON sn.therapist_id = t.id;

-- Insert sample data for testing
INSERT INTO session_notes (
  session_id,
  therapist_id,
  user_id,
  notes,
  mood_rating,
  progress_notes,
  homework_assigned,
  next_session_focus,
  ai_generated,
  soap_subjective,
  soap_objective,
  soap_assessment,
  soap_plan,
  therapeutic_insights
) VALUES (
  '119b0b06-ba0f-48f3-9f3f-66148300b1e8', -- Use the test session ID we created earlier
  '550e8400-e29b-41d4-a716-446655440001', -- Sample therapist ID
  '550e8400-e29b-41d4-a716-446655440001', -- Sample user ID
  'AI-generated session summary from transcription',
  7,
  'Patient shows continued progress with anxiety management techniques',
  'Practice daily mindfulness exercises for 10 minutes',
  'Explore deeper cognitive restructuring techniques',
  true,
  'Patient reported feeling less anxious this week, sleep quality improved',
  'Patient appeared calm, engaged well in session, good eye contact',
  'Steady progress with GAD symptoms, developing better coping strategies',
  'Continue CBT techniques, introduce progressive muscle relaxation',
  '{"breakthroughs": ["Better understanding of anxiety triggers"], "concerns": ["Still some avoidance behaviors"], "therapeutic_relationship": "Strong rapport maintained", "treatment_progress": "Significant improvement noted"}'::jsonb
);
