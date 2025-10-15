-- Clear specific therapist enrollment for fresh start
-- Replace the email with the actual email you want to clear

-- Set the email to clear (change this to your email)
\set target_email 'ceo@thequietherapy.live'

-- Preview what will be deleted
SELECT '📋 PREVIEW: Records to be deleted for: ' || :'target_email' as info;

-- Show therapist enrollment
SELECT 'therapist_enrollments' as table_name, * 
FROM therapist_enrollments 
WHERE email = :'target_email';

-- Show user record
SELECT 'users' as table_name, id, email, user_type, created_at 
FROM users 
WHERE email = :'target_email';

-- Show magic links
SELECT 'magic_links' as table_name, id, email, type, auth_type, created_at, used_at
FROM magic_links 
WHERE email = :'target_email';

SELECT '' as separator;
SELECT '⚠️  Proceeding with deletion...' as warning;
SELECT '' as separator;

-- Delete in correct order (child records first)

-- 1. Delete magic links
DELETE FROM magic_links 
WHERE email = :'target_email';

-- 2. Delete therapist enrollment
DELETE FROM therapist_enrollments 
WHERE email = :'target_email';

-- 3. Delete user record
DELETE FROM users 
WHERE email = :'target_email';

-- Verification
SELECT '✅ DELETION COMPLETE' as status;

SELECT 
    'therapist_enrollments' as table_name,
    COUNT(*) as remaining_records
FROM therapist_enrollments 
WHERE email = :'target_email'
UNION ALL
SELECT 
    'users' as table_name,
    COUNT(*) as remaining_records
FROM users 
WHERE email = :'target_email'
UNION ALL
SELECT 
    'magic_links' as table_name,
    COUNT(*) as remaining_records
FROM magic_links 
WHERE email = :'target_email';

-- Should all show 0

