-- =============================================
-- QUICK DIAGNOSTIC: Find the mismatch
-- =============================================

-- Show all sessions with their therapist info
SELECT 
  s.id,
  s.therapist_id,
  s.status,
  s.created_at,
  s.title,
  t.id as therapist_user_id,
  t.email as therapist_email,
  t.full_name as therapist_name,
  CASE 
    WHEN t.id IS NULL THEN '❌ ORPHANED (therapist not found)'
    WHEN t.user_type != 'therapist' THEN '❌ WRONG USER TYPE'
    ELSE '✅ OK'
  END as status_check
FROM sessions s
LEFT JOIN users t ON s.therapist_id = t.id
WHERE s.status IN ('scheduled', 'confirmed', 'pending_approval', 'in_progress')
ORDER BY s.created_at DESC;

-- Show all therapists and their session counts
SELECT 
  u.id,
  u.email,
  u.full_name,
  COUNT(s.id) as session_count,
  STRING_AGG(DISTINCT s.status, ', ') as session_statuses
FROM users u
LEFT JOIN sessions s ON u.id = s.therapist_id
WHERE u.user_type = 'therapist'
GROUP BY u.id, u.email, u.full_name
ORDER BY session_count DESC, u.created_at DESC;

