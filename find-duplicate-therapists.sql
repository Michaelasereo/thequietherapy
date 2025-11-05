-- =============================================
-- FIND DUPLICATE THERAPIST ENTRIES
-- This script finds therapists with duplicate entries
-- =============================================

-- Step 1: Find therapists with duplicate emails in users table
SELECT 
    '🔍 Duplicate Therapists in Users Table:' as check_type,
    email,
    COUNT(*) as duplicate_count,
    STRING_AGG(id::text, ', ') as therapist_ids,
    STRING_AGG(full_name, ' | ') as names,
    STRING_AGG(is_active::text, ', ') as active_status,
    STRING_AGG(is_verified::text, ', ') as verified_status,
    STRING_AGG(created_at::text, ' | ') as created_dates
FROM users
WHERE user_type = 'therapist'
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- Step 2: Find therapists with duplicate emails in therapist_enrollments table
SELECT 
    '📋 Duplicate Therapists in Enrollments Table:' as check_type,
    email,
    COUNT(*) as duplicate_count,
    STRING_AGG(id::text, ', ') as enrollment_ids,
    STRING_AGG(full_name, ' | ') as names,
    STRING_AGG(status, ', ') as statuses,
    STRING_AGG(is_active::text, ', ') as active_status,
    STRING_AGG(created_at::text, ' | ') as created_dates
FROM therapist_enrollments
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- Step 3: Find therapists that exist in both users and enrollments with different statuses
SELECT 
    '🔗 Therapists in Both Tables (May Need Cleanup):' as check_type,
    COALESCE(u.email, te.email) as email,
    u.id as user_id,
    u.full_name as user_name,
    u.is_active as user_active,
    u.is_verified as user_verified,
    u.created_at as user_created,
    te.id as enrollment_id,
    te.full_name as enrollment_name,
    te.status as enrollment_status,
    te.is_active as enrollment_active,
    te.created_at as enrollment_created,
    CASE 
        WHEN u.id IS NULL THEN 'Only in Enrollments'
        WHEN te.id IS NULL THEN 'Only in Users'
        WHEN u.is_active = true AND u.is_verified = true AND te.status = 'approved' AND te.is_active = true THEN '✅ Active Both'
        ELSE '⚠️ Needs Review'
    END as status
FROM users u
FULL OUTER JOIN therapist_enrollments te ON u.email = te.email
WHERE (u.user_type = 'therapist' OR te.id IS NOT NULL)
ORDER BY COALESCE(u.created_at, te.created_at) DESC;

-- Step 4: Find specific therapist by email (replace with the actual email)
-- SELECT 
--     '🔍 Specific Therapist Details:' as check_type,
--     u.id as user_id,
--     u.email,
--     u.full_name as user_name,
--     u.user_type,
--     u.is_active as user_active,
--     u.is_verified as user_verified,
--     u.created_at as user_created,
--     te.id as enrollment_id,
--     te.status as enrollment_status,
--     te.is_active as enrollment_active,
--     te.created_at as enrollment_created
-- FROM users u
-- LEFT JOIN therapist_enrollments te ON u.email = te.email
-- WHERE u.email = 'therapist-email@example.com'
--    OR te.email = 'therapist-email@example.com';

-- Step 5: Delete duplicate therapist (replace with actual email)
-- ⚠️ WARNING: This will delete ALL entries for this therapist email
-- Run this AFTER reviewing the results above
-- 
-- DO $$
-- DECLARE
--     v_email TEXT := 'therapist-email@example.com';
--     v_user_ids UUID[];
--     v_enrollment_ids UUID[];
--     v_auth_user_ids UUID[];
-- BEGIN
--     -- Get all user IDs for this email
--     SELECT ARRAY_AGG(id) INTO v_user_ids
--     FROM users
--     WHERE email = v_email AND user_type = 'therapist';
--     
--     -- Get all enrollment IDs for this email
--     SELECT ARRAY_AGG(id) INTO v_enrollment_ids
--     FROM therapist_enrollments
--     WHERE email = v_email;
--     
--     RAISE NOTICE '🔍 Found % user accounts and % enrollments for email: %', 
--         COALESCE(array_length(v_user_ids, 1), 0),
--         COALESCE(array_length(v_enrollment_ids, 1), 0),
--         v_email;
--     
--     -- Delete from Supabase Auth (if user accounts exist)
--     IF v_user_ids IS NOT NULL AND array_length(v_user_ids, 1) > 0 THEN
--         -- Note: Supabase Auth deletion needs to be done via API, not SQL
--         RAISE NOTICE '⚠️ Need to delete from Supabase Auth via API for email: %', v_email;
--     END IF;
--     
--     -- Delete sessions
--     DELETE FROM sessions
--     WHERE therapist_id = ANY(v_user_ids);
--     RAISE NOTICE '✅ Deleted sessions';
--     
--     -- Delete availability
--     DELETE FROM availability_weekly_schedules
--     WHERE therapist_id = ANY(v_user_ids);
--     RAISE NOTICE '✅ Deleted availability';
--     
--     -- Delete profiles
--     DELETE FROM therapist_profiles
--     WHERE user_id = ANY(v_user_ids);
--     RAISE NOTICE '✅ Deleted profiles';
--     
--     -- Delete credits
--     DELETE FROM user_credits
--     WHERE user_id = ANY(v_user_ids);
--     RAISE NOTICE '✅ Deleted credits';
--     
--     -- Delete from users table
--     DELETE FROM users
--     WHERE id = ANY(v_user_ids);
--     RAISE NOTICE '✅ Deleted user accounts';
--     
--     -- Delete enrollments
--     DELETE FROM therapist_enrollments
--     WHERE id = ANY(v_enrollment_ids);
--     RAISE NOTICE '✅ Deleted enrollments';
--     
--     RAISE NOTICE '✅ All duplicate entries deleted for email: %', v_email;
-- END $$;

