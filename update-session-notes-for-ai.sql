-- Update session_notes table to support AI-generated content
-- Add columns for AI-generated content and SOAP notes structure

-- Add AI-specific columns
ALTER TABLE session_notes ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT false;
ALTER TABLE session_notes ADD COLUMN IF NOT EXISTS transcript TEXT;
ALTER TABLE session_notes ADD COLUMN IF NOT EXISTS recording_id VARCHAR(255);
ALTER TABLE session_notes ADD COLUMN IF NOT EXISTS processing_time_ms INTEGER;

-- Add SOAP notes structure columns
ALTER TABLE session_notes ADD COLUMN IF NOT EXISTS soap_subjective TEXT;
ALTER TABLE session_notes ADD COLUMN IF NOT EXISTS soap_objective TEXT;
ALTER TABLE session_notes ADD COLUMN IF NOT EXISTS soap_assessment TEXT;
ALTER TABLE session_notes ADD COLUMN IF NOT EXISTS soap_plan TEXT;

-- Add therapeutic insights column
ALTER TABLE session_notes ADD COLUMN IF NOT EXISTS therapeutic_insights JSONB;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_session_notes_ai_generated ON session_notes(ai_generated);
CREATE INDEX IF NOT EXISTS idx_session_notes_recording_id ON session_notes(recording_id);

-- Create sessions processing errors table
CREATE TABLE IF NOT EXISTS session_processing_errors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL,
  recording_id VARCHAR(255),
  error_message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for processing errors
CREATE INDEX IF NOT EXISTS idx_processing_errors_session_id ON session_processing_errors(session_id);
CREATE INDEX IF NOT EXISTS idx_processing_errors_created_at ON session_processing_errors(created_at);

-- Add recording-related columns to sessions table
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS daily_room_recording_id VARCHAR(255);
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS daily_room_recording_url TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS recording_duration INTEGER;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS recording_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS recording_error TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS end_time TIMESTAMP WITH TIME ZONE;

-- Create indexes for session recording data
CREATE INDEX IF NOT EXISTS idx_sessions_recording_id ON sessions(daily_room_recording_id);
CREATE INDEX IF NOT EXISTS idx_sessions_recording_status ON sessions(recording_status);

-- Create a view for AI-enhanced session notes
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
JOIN users u ON sn.patient_id = u.id
JOIN users t ON sn.therapist_id = t.id;

-- Update existing policies to handle AI-generated notes
-- Therapists can view AI-generated notes for their sessions
-- CREATE POLICY "Therapists can view AI notes" ON session_notes
--   FOR SELECT USING (
--     therapist_id = auth.uid() AND ai_generated = true
--   );

-- Sample data for testing (commented out)
-- INSERT INTO session_notes (
--   session_id,
--   therapist_id,
--   patient_id,
--   notes,
--   mood_rating,
--   progress_notes,
--   homework_assigned,
--   next_session_focus,
--   ai_generated,
--   soap_subjective,
--   soap_objective,
--   soap_assessment,
--   soap_plan,
--   therapeutic_insights
-- ) VALUES (
--   'sample-session-id',
--   'sample-therapist-id',
--   'sample-patient-id',
--   'AI-generated session summary from transcription',
--   7,
--   'Patient shows continued progress with anxiety management techniques',
--   'Practice daily mindfulness exercises for 10 minutes',
--   'Explore deeper cognitive restructuring techniques',
--   true,
--   'Patient reported feeling less anxious this week, sleep quality improved',
--   'Patient appeared calm, engaged well in session, good eye contact',
--   'Steady progress with GAD symptoms, developing better coping strategies',
--   'Continue CBT techniques, introduce progressive muscle relaxation',
--   '{"breakthroughs": ["Better understanding of anxiety triggers"], "concerns": ["Still some avoidance behaviors"], "therapeutic_relationship": "Strong rapport maintained", "treatment_progress": "Significant improvement noted"}'::jsonb
-- );
