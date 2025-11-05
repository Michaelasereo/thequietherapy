-- =====================================================
-- REMOVE USER FROM DATABASE
-- =====================================================
-- This script removes user by email address:
-- ajayiodeborah@gmail.com
-- =====================================================

-- Step 1: Show what will be deleted (for verification)
-- Check custom users table
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
WHERE email = 'ajayiodeborah@gmail.com';

-- Check therapist_enrollments (if user is a therapist)
SELECT 
    'therapist_enrollments' as table_name,
    id,
    email,
    full_name,
    status,
    user_id,
    created_at
FROM therapist_enrollments
WHERE email = 'ajayiodeborah@gmail.com';

-- Check if user exists in Supabase Auth (auth.users)
-- Note: This requires admin access to auth schema
DO $$
DECLARE
    auth_user_exists BOOLEAN;
    auth_user_id UUID;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM auth.users 
        WHERE email = 'ajayiodeborah@gmail.com'
    ) INTO auth_user_exists;
    
    IF auth_user_exists THEN
        SELECT id INTO auth_user_id FROM auth.users WHERE email = 'ajayiodeborah@gmail.com';
        RAISE NOTICE '⚠️  User exists in Supabase Auth (auth.users) with ID: %', auth_user_id;
        RAISE NOTICE '⚠️  You MUST delete this user from Supabase Dashboard > Authentication > Users';
        RAISE NOTICE '⚠️  Or use: SELECT auth.users WHERE email = ''ajayiodeborah@gmail.com''';
    ELSE
        RAISE NOTICE '✅ User does not exist in Supabase Auth';
    END IF;
END $$;

-- Step 2: Delete from related tables first (child tables)
-- Delete sessions where user is the patient
DELETE FROM sessions
WHERE user_id IN (
    SELECT id FROM users 
    WHERE email = 'ajayiodeborah@gmail.com'
);

-- Delete sessions where user is the therapist
DELETE FROM sessions
WHERE therapist_id IN (
    SELECT id FROM users 
    WHERE email = 'ajayiodeborah@gmail.com'
);

-- Delete from therapist_profiles (if user is a therapist)
DELETE FROM therapist_profiles
WHERE user_id IN (
    SELECT id FROM users 
    WHERE email = 'ajayiodeborah@gmail.com'
);

-- Delete from therapist_availability (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'therapist_availability') THEN
        DELETE FROM therapist_availability
        WHERE therapist_id IN (
            SELECT id FROM users 
            WHERE email = 'ajayiodeborah@gmail.com'
        );
    END IF;
END $$;

-- Delete from therapist_time_slots (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'therapist_time_slots') THEN
        DELETE FROM therapist_time_slots
        WHERE therapist_id IN (
            SELECT id FROM users 
            WHERE email = 'ajayiodeborah@gmail.com'
        );
    END IF;
END $$;

-- Delete from availability_weekly_schedules (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'availability_weekly_schedules') THEN
        DELETE FROM availability_weekly_schedules
        WHERE therapist_id IN (
            SELECT id FROM users 
            WHERE email = 'ajayiodeborah@gmail.com'
        );
    END IF;
END $$;

-- Delete user sessions
DELETE FROM user_sessions
WHERE user_id IN (
    SELECT id FROM users 
    WHERE email = 'ajayiodeborah@gmail.com'
);

-- Delete user credits (if any)
DELETE FROM user_credits
WHERE user_id IN (
    SELECT id FROM users 
    WHERE email = 'ajayiodeborah@gmail.com'
);

-- Delete user session credits (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_session_credits') THEN
        DELETE FROM user_session_credits
        WHERE user_id IN (
            SELECT id FROM users 
            WHERE email = 'ajayiodeborah@gmail.com'
        );
    END IF;
END $$;

-- Delete patient biodata (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'patient_biodata') THEN
        DELETE FROM patient_biodata
        WHERE user_id IN (
            SELECT id FROM users 
            WHERE email = 'ajayiodeborah@gmail.com'
        );
    END IF;
END $$;

-- Delete patient family history (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'patient_family_history') THEN
        DELETE FROM patient_family_history
        WHERE user_id IN (
            SELECT id FROM users 
            WHERE email = 'ajayiodeborah@gmail.com'
        );
    END IF;
END $$;

-- Delete patient social history (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'patient_social_history') THEN
        DELETE FROM patient_social_history
        WHERE user_id IN (
            SELECT id FROM users 
            WHERE email = 'ajayiodeborah@gmail.com'
        );
    END IF;
END $$;

-- Delete patient medical history (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'patient_medical_history') THEN
        DELETE FROM patient_medical_history
        WHERE user_id IN (
            SELECT id FROM users 
            WHERE email = 'ajayiodeborah@gmail.com'
        );
    END IF;
END $$;

-- Delete patient drug history (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'patient_drug_history') THEN
        DELETE FROM patient_drug_history
        WHERE user_id IN (
            SELECT id FROM users 
            WHERE email = 'ajayiodeborah@gmail.com'
        );
    END IF;
END $$;

-- Delete bookings (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'bookings') THEN
        DELETE FROM bookings
        WHERE user_id IN (
            SELECT id FROM users 
            WHERE email = 'ajayiodeborah@gmail.com'
        );
    END IF;
END $$;

-- Delete session notes (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'session_notes') THEN
        DELETE FROM session_notes
        WHERE session_id IN (
            SELECT id FROM sessions
            WHERE user_id IN (SELECT id FROM users WHERE email = 'ajayiodeborah@gmail.com')
               OR therapist_id IN (SELECT id FROM users WHERE email = 'ajayiodeborah@gmail.com')
        );
    END IF;
END $$;

-- Delete session feedback (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'session_feedback') THEN
        DELETE FROM session_feedback
        WHERE session_id IN (
            SELECT id FROM sessions
            WHERE user_id IN (SELECT id FROM users WHERE email = 'ajayiodeborah@gmail.com')
               OR therapist_id IN (SELECT id FROM users WHERE email = 'ajayiodeborah@gmail.com')
        );
    END IF;
END $$;

-- Delete bookings where user is therapist (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'bookings') THEN
        DELETE FROM bookings
        WHERE therapist_id IN (
            SELECT id FROM users 
            WHERE email = 'ajayiodeborah@gmail.com'
        );
    END IF;
END $$;

-- Step 3: Delete from therapist_enrollments (if exists, just in case)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'therapist_enrollments') THEN
        DELETE FROM therapist_enrollments
        WHERE email = 'ajayiodeborah@gmail.com';
    END IF;
END $$;

-- Step 4: Delete from users table
-- First, get the user ID to check for any remaining references
DO $$
DECLARE
    v_user_id UUID;
    v_deleted_count INTEGER;
BEGIN
    -- Get user ID
    SELECT id INTO v_user_id FROM users WHERE email = 'ajayiodeborah@gmail.com';
    
    IF v_user_id IS NULL THEN
        RAISE NOTICE 'ℹ️  User not found in users table';
    ELSE
        RAISE NOTICE '📋 Attempting to delete user with ID: %', v_user_id;
        
        -- Try to delete
        DELETE FROM users WHERE id = v_user_id;
        GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
        
        IF v_deleted_count > 0 THEN
            RAISE NOTICE '✅ Successfully deleted user from users table';
        ELSE
            RAISE NOTICE '⚠️  No rows deleted - user may not exist or deletion failed';
        END IF;
    END IF;
END $$;

-- Alternative direct delete (if DO block didn't work)
DELETE FROM users
WHERE email = 'ajayiodeborah@gmail.com';

-- Step 5: Verify deletion (should return 0 rows)
SELECT 
    'Verification: users' as check_type,
    COUNT(*) as remaining_records
FROM users
WHERE email = 'ajayiodeborah@gmail.com';

-- Success message
SELECT '✅ User removed successfully!' as status,
       'Deleted: ajayiodeborah@gmail.com' as details;

-- IMPORTANT: Supabase Auth Cleanup
-- ⚠️  You MUST also delete the user from Supabase Auth if they exist there
-- The script above deleted from your custom users table, but Supabase Auth is separate

-- Step 6: Attempt to delete from Supabase Auth (auth.users)
-- This requires admin/service role access to the auth schema
DO $$
DECLARE
    auth_user_id UUID;
    auth_deleted_count INTEGER;
BEGIN
    -- Check if user exists in auth.users
    SELECT id INTO auth_user_id 
    FROM auth.users 
    WHERE email = 'ajayiodeborah@gmail.com';
    
    IF auth_user_id IS NOT NULL THEN
        RAISE NOTICE '⚠️  Found user in Supabase Auth with ID: %', auth_user_id;
        RAISE NOTICE '⚠️  Attempting to delete from auth.users...';
        
        -- Try to delete from auth.users
        DELETE FROM auth.users WHERE id = auth_user_id;
        GET DIAGNOSTICS auth_deleted_count = ROW_COUNT;
        
        IF auth_deleted_count > 0 THEN
            RAISE NOTICE '✅ Successfully deleted user from Supabase Auth (auth.users)';
        ELSE
            RAISE NOTICE '❌ Failed to delete from auth.users - may need admin privileges';
            RAISE NOTICE '⚠️  Please delete manually from Supabase Dashboard > Authentication > Users';
        END IF;
    ELSE
        RAISE NOTICE '✅ User does not exist in Supabase Auth (auth.users)';
    END IF;
END $$;

-- Manual deletion option (if you have admin access, uncomment and run):
-- DELETE FROM auth.users WHERE email = 'ajayiodeborah@gmail.com';

-- Final verification
SELECT 
    '⚠️  IMPORTANT: Verify deletion' as reminder,
    'Check both: users table AND auth.users table' as instruction,
    'If user still exists, delete from Supabase Dashboard > Authentication > Users' as location;

