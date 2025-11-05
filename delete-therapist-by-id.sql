-- =============================================
-- DELETE THERAPIST BY ID: 81dd0648-a065-4f66-a6bd-2e4cf3321fd8
-- This script deletes this specific therapist entry and all related data
-- =============================================

-- Step 1: Check what we're about to delete
SELECT 
    '🔍 Checking therapist before deletion:' as check_type,
    u.id,
    u.email,
    u.full_name,
    u.user_type,
    u.is_active,
    u.is_verified,
    u.created_at,
    te.id as enrollment_id,
    te.status as enrollment_status,
    te.is_active as enrollment_active
FROM users u
LEFT JOIN therapist_enrollments te ON u.email = te.email
WHERE u.id = '81dd0648-a065-4f66-a6bd-2e4cf3321fd8';

-- Step 2: Delete all related data
DO $$
DECLARE
    v_therapist_id UUID := '81dd0648-a065-4f66-a6bd-2e4cf3321fd8';
    v_email TEXT;
    v_user_count INTEGER;
    v_enrollment_count INTEGER;
BEGIN
    -- Get therapist email
    SELECT email INTO v_email
    FROM users
    WHERE id = v_therapist_id AND user_type = 'therapist';
    
    IF v_email IS NULL THEN
        RAISE EXCEPTION 'Therapist with ID % not found', v_therapist_id;
    END IF;
    
    RAISE NOTICE '🔍 Deleting therapist: % (Email: %)', v_therapist_id, v_email;
    
    -- Count related records
    SELECT COUNT(*) INTO v_user_count FROM users WHERE id = v_therapist_id;
    SELECT COUNT(*) INTO v_enrollment_count FROM therapist_enrollments WHERE email = v_email;
    
    RAISE NOTICE '📊 Found % user account(s) and % enrollment(s) for this email', v_user_count, v_enrollment_count;
    
    -- 1. Delete sessions
    DELETE FROM sessions
    WHERE therapist_id = v_therapist_id;
    RAISE NOTICE '✅ Deleted sessions';
    
    -- 2. Delete availability
    DELETE FROM availability_weekly_schedules
    WHERE therapist_id = v_therapist_id;
    RAISE NOTICE '✅ Deleted availability';
    
    -- 3. Delete profiles
    DELETE FROM therapist_profiles
    WHERE user_id = v_therapist_id;
    RAISE NOTICE '✅ Deleted profiles';
    
    -- 4. Delete credits
    DELETE FROM user_credits
    WHERE user_id = v_therapist_id;
    RAISE NOTICE '✅ Deleted credits';
    
    -- 5. Delete from users table
    DELETE FROM users
    WHERE id = v_therapist_id;
    RAISE NOTICE '✅ Deleted user account';
    
    -- 6. Delete ALL enrollments for this email (handles duplicates)
    DELETE FROM therapist_enrollments
    WHERE email = v_email;
    RAISE NOTICE '✅ Deleted all enrollments for email: %', v_email;
    
    RAISE NOTICE '✅ Therapist deleted successfully';
    RAISE NOTICE '⚠️ IMPORTANT: You must also delete from Supabase Auth manually';
    RAISE NOTICE '   Go to Supabase Dashboard > Authentication > Users';
    RAISE NOTICE '   Search for: %', v_email;
    RAISE NOTICE '   Delete any user accounts found';
END $$;

-- Step 3: Verify deletion
SELECT 
    '✅ Verification - Check if therapist still exists:' as check_type,
    u.id as user_id,
    u.email,
    u.full_name,
    te.id as enrollment_id,
    te.status as enrollment_status
FROM users u
FULL OUTER JOIN therapist_enrollments te ON u.email = te.email
WHERE u.id = '81dd0648-a065-4f66-a6bd-2e4cf3321fd8'
   OR te.email = (SELECT email FROM users WHERE id = '81dd0648-a065-4f66-a6bd-2e4cf3321fd8' LIMIT 1);

-- If the query above returns no rows, the therapist has been deleted successfully

SELECT '🎉 Done! Therapist 81dd0648-a065-4f66-a6bd-2e4cf3321fd8 deleted successfully.' as result;
SELECT '⚠️ Remember to delete from Supabase Auth if needed!' as reminder;

