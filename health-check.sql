-- =============================================
-- BOOKING SYSTEM HEALTH CHECKS
-- =============================================

-- Orphaned therapists (no user_id link)
SELECT COUNT(*) AS orphaned_therapists
FROM therapist_enrollments
WHERE user_id IS NULL;

-- Orphaned sessions (no therapist_id or user_id)
SELECT 
    (SELECT COUNT(*) FROM sessions WHERE therapist_id IS NULL) AS sessions_missing_therapist,
    (SELECT COUNT(*) FROM sessions WHERE user_id IS NULL) AS sessions_missing_user;

-- Existing overlaps among active sessions
SELECT COUNT(*) AS existing_overlaps
FROM sessions s1
JOIN sessions s2 
  ON s1.therapist_id = s2.therapist_id 
 AND s1.id != s2.id
 AND tstzrange(s1.start_time, s1.end_time) && tstzrange(s2.start_time, s2.end_time)
WHERE s1.status IN ('scheduled', 'confirmed', 'in_progress')
  AND s2.status IN ('scheduled', 'confirmed', 'in_progress');


