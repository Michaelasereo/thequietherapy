-- =============================================
-- DELETE THERAPIST BY EMAIL
-- This script deletes ALL entries for a therapist email
-- Use this when a therapist appears twice or has duplicate entries
-- =============================================

-- ⚠️ IMPORTANT: Replace 'therapist-email@example.com' with the actual email
-- ⚠️ This will delete ALL entries for this email (both in users and enrollments)

DO $$
DECLARE
    v_email TEXT := 'therapist-email@example.com';  -- ⚠️ REPLACE WITH ACTUAL EMAIL
    v_user_ids UUID[];
    v_enrollment_ids UUID[];
    v_user_count INTEGER;
    v_enrollment_count INTEGER;
BEGIN
    -- Get all user IDs for this email
    SELECT ARRAY_AGG(id), COUNT(*) INTO v_user_ids, v_user_count
    FROM users
    WHERE email = v_email AND user_type = 'therapist';
    
    -- Get all enrollment IDs for this email
    SELECT ARRAY_AGG(id), COUNT(*) INTO v_enrollment_ids, v_enrollment_count
    FROM therapist_enrollments
    WHERE email = v_email;
    
    RAISE NOTICE '🔍 Found % user account(s) and % enrollment(s) for email: %', 
        COALESCE(v_user_count, 0),
        COALESCE(v_enrollment_count, 0),
        v_email;
    
    IF v_user_count = 0 AND v_enrollment_count = 0 THEN
        RAISE EXCEPTION 'No therapist found with email: %', v_email;
    END IF;
    
    -- Delete sessions (if user accounts exist)
    IF v_user_ids IS NOT NULL AND array_length(v_user_ids, 1) > 0 THEN
        DELETE FROM sessions
        WHERE therapist_id = ANY(v_user_ids);
        RAISE NOTICE '✅ Deleted sessions';
    END IF;
    
    -- Delete availability (if user accounts exist)
    IF v_user_ids IS NOT NULL AND array_length(v_user_ids, 1) > 0 THEN
        DELETE FROM availability_weekly_schedules
        WHERE therapist_id = ANY(v_user_ids);
        RAISE NOTICE '✅ Deleted availability';
    END IF;
    
    -- Delete profiles (if user accounts exist)
    IF v_user_ids IS NOT NULL AND array_length(v_user_ids, 1) > 0 THEN
        DELETE FROM therapist_profiles
        WHERE user_id = ANY(v_user_ids);
        RAISE NOTICE '✅ Deleted profiles';
    END IF;
    
    -- Delete credits (if user accounts exist)
    IF v_user_ids IS NOT NULL AND array_length(v_user_ids, 1) > 0 THEN
        DELETE FROM user_credits
        WHERE user_id = ANY(v_user_ids);
        RAISE NOTICE '✅ Deleted credits';
    END IF;
    
    -- Delete from users table (if user accounts exist)
    IF v_user_ids IS NOT NULL AND array_length(v_user_ids, 1) > 0 THEN
        DELETE FROM users
        WHERE id = ANY(v_user_ids);
        RAISE NOTICE '✅ Deleted user account(s)';
    END IF;
    
    -- Delete enrollments (always delete if exists)
    IF v_enrollment_ids IS NOT NULL AND array_length(v_enrollment_ids, 1) > 0 THEN
        DELETE FROM therapist_enrollments
        WHERE id = ANY(v_enrollment_ids);
        RAISE NOTICE '✅ Deleted enrollment(s)';
    END IF;
    
    RAISE NOTICE '✅ All entries deleted for email: %', v_email;
    RAISE NOTICE '⚠️ IMPORTANT: You must also delete from Supabase Auth manually or via API';
    RAISE NOTICE '   Go to Supabase Dashboard > Authentication > Users';
    RAISE NOTICE '   Search for: %', v_email;
    RAISE NOTICE '   Delete any user accounts found';
END $$;

-- Step 2: Verify deletion
SELECT 
    '✅ Verification - Check if therapist still exists:' as check_type,
    u.id as user_id,
    u.email,
    u.full_name,
    te.id as enrollment_id,
    te.status as enrollment_status
FROM users u
FULL OUTER JOIN therapist_enrollments te ON u.email = te.email
WHERE u.email = 'therapist-email@example.com'  -- ⚠️ REPLACE WITH ACTUAL EMAIL
   OR te.email = 'therapist-email@example.com';  -- ⚠️ REPLACE WITH ACTUAL EMAIL

-- If the query above returns no rows, the therapist has been deleted successfully

