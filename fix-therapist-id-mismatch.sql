-- =============================================
-- FIX THERAPIST ID MISMATCH
-- =============================================
-- This script will help identify and fix the mismatch

-- Step 1: Show the mismatch - sessions vs logged-in therapist
-- Replace 'YOUR_THERAPIST_EMAIL' with the actual therapist email
WITH therapist_info AS (
  SELECT id, email, full_name, user_type
  FROM users
  WHERE user_type = 'therapist'
  -- Uncomment and replace with actual email:
  -- WHERE email = 'your-therapist@email.com'
)
SELECT 
  'CURRENT SITUATION' as info,
  s.id as session_id,
  s.therapist_id as session_therapist_id,
  s.status,
  s.created_at as session_created_at,
  s.title,
  -- The therapist in sessions table
  t_sessions.id as sessions_therapist_user_id,
  t_sessions.email as sessions_therapist_email,
  -- The logged-in therapist (update email in therapist_info CTE)
  ti.id as logged_in_therapist_id,
  ti.email as logged_in_therapist_email,
  -- Check if they match
  CASE 
    WHEN s.therapist_id = ti.id THEN '✅ MATCH'
    ELSE '❌ MISMATCH - NEEDS FIX'
  END as match_status
FROM sessions s
LEFT JOIN users t_sessions ON s.therapist_id = t_sessions.id
LEFT JOIN therapist_info ti ON TRUE  -- Change this to WHERE email = 'your-email' after updating CTE
WHERE s.status IN ('scheduled', 'confirmed', 'pending_approval')
ORDER BY s.created_at DESC;

-- Step 2: Get all therapist IDs to choose the correct one
SELECT 
  'ALL THERAPISTS' as info,
  id,
  email,
  full_name,
  user_type,
  is_verified,
  created_at
FROM users
WHERE user_type = 'therapist'
ORDER BY created_at DESC;

-- Step 3: UPDATE SESSIONS to correct therapist_id
-- ⚠️ ONLY RUN THIS AFTER VERIFYING THE CORRECT therapist_id
-- Replace 'CORRECT_THERAPIST_ID' with the actual therapist UUID
-- Replace 'OLD_THERAPIST_ID' with the therapist_id currently in sessions table
/*
UPDATE sessions
SET therapist_id = 'CORRECT_THERAPIST_ID'::uuid
WHERE therapist_id = 'OLD_THERAPIST_ID'::uuid
AND status IN ('scheduled', 'confirmed', 'pending_approval');

-- Verify the update
SELECT 
  COUNT(*) as updated_sessions,
  therapist_id,
  status
FROM sessions
WHERE therapist_id = 'CORRECT_THERAPIST_ID'::uuid
GROUP BY therapist_id, status;
*/

