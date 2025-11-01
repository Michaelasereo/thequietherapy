-- Debug script to check therapist sessions
-- Run this in Supabase SQL editor

-- 1. Get all sessions with their therapist_ids
SELECT 
  s.id as session_id,
  s.therapist_id,
  s.user_id,
  s.status,
  s.scheduled_date,
  s.scheduled_time,
  s.start_time,
  s.created_at,
  s.title,
  -- Get therapist info
  t.id as therapist_user_id,
  t.email as therapist_email,
  t.full_name as therapist_name,
  t.user_type as therapist_user_type,
  -- Get client info
  u.email as client_email,
  u.full_name as client_name
FROM sessions s
LEFT JOIN users t ON s.therapist_id = t.id
LEFT JOIN users u ON s.user_id = u.id
ORDER BY s.created_at DESC
LIMIT 20;

-- 2. Get the therapist ID that's logged in (replace with actual therapist email from logs)
-- SELECT id, email, full_name, user_type 
-- FROM users 
-- WHERE user_type = 'therapist' 
-- ORDER BY created_at DESC;

-- 3. Check if there are any sessions for a specific therapist (replace UUID)
-- SELECT COUNT(*), therapist_id 
-- FROM sessions 
-- WHERE therapist_id = 'REPLACE_WITH_THERAPIST_ID_HERE'
-- GROUP BY therapist_id;

