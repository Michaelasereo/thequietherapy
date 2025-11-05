-- =====================================================
-- REMOVE SPECIFIC THERAPISTS FROM DATABASE
-- =====================================================
-- This script removes therapists by email address:
-- 1. michael@opportunedesignco.com
-- 2. asereope@gmail.com
-- =====================================================

-- Step 1: Show what will be deleted (for verification)
SELECT 
    'therapist_enrollments' as table_name,
    id,
    email,
    full_name,
    status,
    user_id,
    created_at
FROM therapist_enrollments
WHERE email IN ('michael@opportunedesignco.com', 'asereope@gmail.com');

SELECT 
    'users' as table_name,
    id,
    email,
    full_name,
    user_type,
    is_active,
    is_verified,
    created_at
FROM users
WHERE email IN ('michael@opportunedesignco.com', 'asereope@gmail.com')
  AND user_type = 'therapist';

-- Step 2: Delete from related tables first (sessions, etc.)
-- Delete any sessions associated with these therapists
DELETE FROM sessions
WHERE therapist_id IN (
    SELECT id FROM users 
    WHERE email IN ('michael@opportunedesignco.com', 'asereope@gmail.com')
      AND user_type = 'therapist'
);

-- Delete from therapist_profiles
DELETE FROM therapist_profiles
WHERE user_id IN (
    SELECT id FROM users 
    WHERE email IN ('michael@opportunedesignco.com', 'asereope@gmail.com')
      AND user_type = 'therapist'
);

-- Delete user sessions
DELETE FROM user_sessions
WHERE user_id IN (
    SELECT id FROM users 
    WHERE email IN ('michael@opportunedesignco.com', 'asereope@gmail.com')
      AND user_type = 'therapist'
);

-- Delete user credits (if any)
DELETE FROM user_credits
WHERE user_id IN (
    SELECT id FROM users 
    WHERE email IN ('michael@opportunedesignco.com', 'asereope@gmail.com')
      AND user_type = 'therapist'
);

-- Step 3: Delete from therapist_enrollments
DELETE FROM therapist_enrollments
WHERE email IN ('michael@opportunedesignco.com', 'asereope@gmail.com');

-- Step 4: Delete from users table
DELETE FROM users
WHERE email IN ('michael@opportunedesignco.com', 'asereope@gmail.com')
  AND user_type = 'therapist';

-- Step 5: Verify deletion (should return 0 rows)
SELECT 
    'Verification: therapist_enrollments' as check_type,
    COUNT(*) as remaining_records
FROM therapist_enrollments
WHERE email IN ('michael@opportunedesignco.com', 'asereope@gmail.com');

SELECT 
    'Verification: users' as check_type,
    COUNT(*) as remaining_records
FROM users
WHERE email IN ('michael@opportunedesignco.com', 'asereope@gmail.com')
  AND user_type = 'therapist';

-- Success message
SELECT '✅ Therapists removed successfully!' as status,
       'Deleted: michael@opportunedesignco.com, asereope@gmail.com' as details;

