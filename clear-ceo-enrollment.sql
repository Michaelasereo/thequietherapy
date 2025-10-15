-- Clear CEO enrollment for fresh start
-- Run this in Supabase SQL Editor

-- Preview what will be deleted
SELECT '📋 PREVIEW: Records to be deleted' as info;

SELECT 'therapist_enrollments' as table_name, * 
FROM therapist_enrollments 
WHERE email = 'ceo@thequietherapy.live';

SELECT 'users' as table_name, id, email, user_type, created_at 
FROM users 
WHERE email = 'ceo@thequietherapy.live';

SELECT 'magic_links' as table_name, id, email, type, auth_type, created_at, used_at
FROM magic_links 
WHERE email = 'ceo@thequietherapy.live';

-- Delete everything
DELETE FROM magic_links WHERE email = 'ceo@thequietherapy.live';
DELETE FROM therapist_enrollments WHERE email = 'ceo@thequietherapy.live';
DELETE FROM users WHERE email = 'ceo@thequietherapy.live';

-- Verification (should all show 0)
SELECT '✅ DELETION COMPLETE - Verification:' as status;

SELECT 
    'therapist_enrollments' as table_name,
    COUNT(*) as remaining
FROM therapist_enrollments 
WHERE email = 'ceo@thequietherapy.live'
UNION ALL
SELECT 'users', COUNT(*) FROM users WHERE email = 'ceo@thequietherapy.live'
UNION ALL
SELECT 'magic_links', COUNT(*) FROM magic_links WHERE email = 'ceo@thequietherapy.live';

