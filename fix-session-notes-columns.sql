-- Fix session_notes table column names if needed
-- This script will rename columns to be consistent

-- Check if patient_id column exists and rename it to user_id
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'session_notes' 
        AND column_name = 'patient_id'
    ) THEN
        ALTER TABLE session_notes RENAME COLUMN patient_id TO user_id;
        RAISE NOTICE 'Renamed patient_id to user_id';
    END IF;
END $$;

-- Drop and recreate the view with correct column names
DROP VIEW IF EXISTS session_notes_with_details;
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

-- Drop and recreate the AI view with correct column names
DROP VIEW IF EXISTS ai_session_notes_view;
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

-- Update policies to use correct column name
DROP POLICY IF EXISTS "Users can view their session notes" ON session_notes;
CREATE POLICY "Users can view their session notes" ON session_notes
  FOR SELECT USING (user_id = auth.uid());

-- Update indexes to use correct column name
DROP INDEX IF EXISTS idx_session_notes_patient_id;
CREATE INDEX IF NOT EXISTS idx_session_notes_user_id ON session_notes(user_id);
