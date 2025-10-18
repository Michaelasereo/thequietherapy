-- SAFER: Clear Only Test Therapists
-- This only removes therapists from @thequietherapy.live domain
-- Useful if you have real therapists you want to keep

-- ============================================
-- OPTION 1: Clear specific email
-- ============================================
-- Replace 'test@thequietherapy.live' with your test email
DELETE FROM sessions 
WHERE therapist_id IN (
  SELECT id FROM users 
  WHERE user_type = 'therapist' 
  AND email = 'test@thequietherapy.live'
);

DELETE FROM therapist_enrollments 
WHERE email = 'test@thequietherapy.live';

DELETE FROM users 
WHERE user_type = 'therapist' 
AND email = 'test@thequietherapy.live';

-- ============================================
-- OPTION 2: Clear ALL test domain therapists
-- ============================================
-- Uncomment if you want to clear all @thequietherapy.live emails

-- DELETE FROM sessions 
-- WHERE therapist_id IN (
--   SELECT id FROM users 
--   WHERE user_type = 'therapist' 
--   AND email LIKE '%@thequietherapy.live'
-- );

-- DELETE FROM therapist_enrollments 
-- WHERE email LIKE '%@thequietherapy.live';

-- DELETE FROM users 
-- WHERE user_type = 'therapist' 
-- AND email LIKE '%@thequietherapy.live';

-- ============================================
-- VERIFY
-- ============================================
SELECT 
  'Test therapists remaining' as status,
  COUNT(*) as count
FROM users 
WHERE user_type = 'therapist' 
AND email LIKE '%@thequietherapy.live';

