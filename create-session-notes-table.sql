-- Create session_notes table for storing therapist session notes
CREATE TABLE IF NOT EXISTS session_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  therapist_id UUID NOT NULL,
  user_id UUID NOT NULL,
  notes TEXT,
  mood_rating INTEGER CHECK (mood_rating >= 1 AND mood_rating <= 10),
  progress_notes TEXT,
  homework_assigned TEXT,
  next_session_focus TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_session_notes_session_id ON session_notes(session_id);
CREATE INDEX IF NOT EXISTS idx_session_notes_therapist_id ON session_notes(therapist_id);
CREATE INDEX IF NOT EXISTS idx_session_notes_user_id ON session_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_session_notes_created_at ON session_notes(created_at);

-- Enable Row Level Security
ALTER TABLE session_notes ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Therapists can view and edit their own session notes
CREATE POLICY "Therapists can manage their session notes" ON session_notes
  FOR ALL USING (therapist_id = auth.uid());

-- Users can view their own session notes (read-only)
CREATE POLICY "Users can view their session notes" ON session_notes
  FOR SELECT USING (user_id = auth.uid());

-- For now, we'll keep the policies simple without complex user type checks
-- Admins and service role can access all session notes  
-- CREATE POLICY "Admins can view all session notes" ON session_notes
--   FOR ALL USING (auth.role() = 'service_role');

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

-- Create a view for session notes with user and therapist information
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

-- Insert sample data (optional)
-- INSERT INTO session_notes (
--   session_id,
--   therapist_id,
--   user_id,
--   notes,
--   mood_rating,
--   progress_notes,
--   homework_assigned,
--   next_session_focus
-- ) VALUES (
--   'sample-session-id',
--   'sample-therapist-id',
--   'sample-user-id',
--   'Patient showed good engagement today. Discussed anxiety management techniques and coping strategies.',
--   7,
--   'Patient is making steady progress with anxiety management. Shows improved understanding of triggers.',
--   'Practice deep breathing exercises daily for 10 minutes. Keep a mood journal.',
--   'Continue working on anxiety triggers and develop more coping strategies.'
-- );
