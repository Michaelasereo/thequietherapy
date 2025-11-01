-- =============================================
-- COMPREHENSIVE DEBUG QUERY FOR THERAPIST SESSIONS
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Check ALL sessions with their therapist info
SELECT 
  s.id as session_id,
  s.therapist_id as session_therapist_id,
  s.user_id as session_user_id,
  s.status,
  s.scheduled_date,
  s.scheduled_time,
  s.start_time,
  s.created_at as session_created_at,
  s.title,
  -- Therapist info from users table
  t.id as therapist_user_id,
  t.email as therapist_email,
  t.full_name as therapist_name,
  t.user_type as therapist_user_type,
  -- Client info
  u.email as client_email,
  u.full_name as client_name,
  -- Check if therapist_id matches
  CASE 
    WHEN s.therapist_id = t.id THEN '✅ MATCH'
    WHEN t.id IS NULL THEN '❌ THERAPIST NOT FOUND'
    ELSE '❌ MISMATCH'
  END as therapist_id_match
FROM sessions s
LEFT JOIN users t ON s.therapist_id = t.id
LEFT JOIN users u ON s.user_id = u.id
ORDER BY s.created_at DESC
LIMIT 20;

-- 2. Count sessions by therapist_id
SELECT 
  s.therapist_id,
  COUNT(*) as session_count,
  STRING_AGG(DISTINCT s.status, ', ') as statuses,
  MAX(s.created_at) as latest_session,
  -- Get therapist email if exists
  MAX(t.email) as therapist_email,
  MAX(t.full_name) as therapist_name
FROM sessions s
LEFT JOIN users t ON s.therapist_id = t.id
GROUP BY s.therapist_id
ORDER BY session_count DESC;

-- 3. Check for sessions without matching therapist in users table
SELECT 
  'ORPHANED SESSIONS' as issue_type,
  COUNT(*) as count,
  STRING_AGG(DISTINCT s.therapist_id::text, ', ') as orphaned_therapist_ids
FROM sessions s
WHERE NOT EXISTS (
  SELECT 1 FROM users u 
  WHERE u.id = s.therapist_id AND u.user_type = 'therapist'
);

-- 4. Get all therapist users with their session counts
SELECT 
  u.id as therapist_id,
  u.email as therapist_email,
  u.full_name as therapist_name,
  u.user_type,
  u.is_verified,
  COUNT(s.id) as total_sessions,
  COUNT(CASE WHEN s.status = 'scheduled' THEN 1 END) as scheduled_sessions,
  COUNT(CASE WHEN s.status = 'in_progress' THEN 1 END) as in_progress_sessions,
  COUNT(CASE WHEN s.status = 'completed' THEN 1 END) as completed_sessions
FROM users u
LEFT JOIN sessions s ON u.id = s.therapist_id
WHERE u.user_type = 'therapist'
GROUP BY u.id, u.email, u.full_name, u.user_type, u.is_verified
ORDER BY total_sessions DESC;

