-- =====================================================
-- CLEAR ALL THERAPISTS - SQL SCRIPT
-- =====================================================
-- ⚠️  WARNING: This will DELETE ALL therapist data
-- Run this in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- PREVIEW: See what will be deleted
-- =====================================================
SELECT '📊 Preview: Therapists to be deleted' as info;

SELECT 
    id,
    email,
    full_name,
    user_type,
    created_at
FROM users
WHERE user_type = 'therapist'
ORDER BY created_at DESC;

SELECT 
    COUNT(*) as total_therapists_to_delete
FROM users
WHERE user_type = 'therapist';

-- =====================================================
-- DELETION STARTS HERE
-- =====================================================
-- Deletes in proper order (child tables first)

-- 1. Delete session notes (child of sessions, if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'session_notes') THEN
        DELETE FROM session_notes
        WHERE session_id IN (
            SELECT id FROM sessions 
            WHERE therapist_id IN (
                SELECT id FROM users WHERE user_type = 'therapist'
            )
        );
    END IF;
END $$;

-- 2. Delete session feedback (child of sessions, if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'session_feedback') THEN
        DELETE FROM session_feedback
        WHERE session_id IN (
            SELECT id FROM sessions 
            WHERE therapist_id IN (
                SELECT id FROM users WHERE user_type = 'therapist'
            )
        );
    END IF;
END $$;

-- 3. Delete sessions where therapist was involved (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sessions') THEN
        DELETE FROM sessions 
        WHERE therapist_id IN (
            SELECT id FROM users WHERE user_type = 'therapist'
        );
    END IF;
END $$;

-- 4. Delete therapist availability (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'therapist_availability') THEN
        DELETE FROM therapist_availability
        WHERE therapist_id IN (
            SELECT id FROM users WHERE user_type = 'therapist'
        );
    END IF;
END $$;

-- 5. Delete therapist time slots (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'therapist_time_slots') THEN
        DELETE FROM therapist_time_slots
        WHERE therapist_id IN (
            SELECT id FROM users WHERE user_type = 'therapist'
        );
    END IF;
END $$;

-- 6. Delete therapist profiles (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'therapist_profiles') THEN
        DELETE FROM therapist_profiles
        WHERE user_id IN (
            SELECT id FROM users WHERE user_type = 'therapist'
        );
    END IF;
END $$;

-- 7. Delete therapist enrollments (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'therapist_enrollments') THEN
        DELETE FROM therapist_enrollments;
    END IF;
END $$;

-- 8. Delete therapist user accounts
DELETE FROM users 
WHERE user_type = 'therapist';

-- =====================================================
-- VERIFICATION: Check that everything is cleared
-- =====================================================
SELECT '✅ Deletion Complete! Verification:' as status;

-- Check remaining therapists (should be 0)
SELECT 
    'therapist_users' as table_name,
    COUNT(*) as remaining_count,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ All cleared'
        ELSE '❌ ' || COUNT(*)::text || ' remain'
    END as status
FROM users 
WHERE user_type = 'therapist';

-- Check remaining enrollments (should be 0, if table exists)
SELECT 
    'therapist_enrollments' as table_name,
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'therapist_enrollments') 
        THEN (SELECT COUNT(*)::text FROM therapist_enrollments)
        ELSE 'N/A (table does not exist)'
    END as remaining_count,
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'therapist_enrollments') 
        THEN CASE 
            WHEN (SELECT COUNT(*) FROM therapist_enrollments) = 0 THEN '✅ All cleared'
            ELSE '❌ ' || (SELECT COUNT(*)::text FROM therapist_enrollments) || ' remain'
        END
        ELSE 'N/A'
    END as status;

-- Check remaining profiles (should be 0, if table exists)
SELECT 
    'therapist_profiles' as table_name,
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'therapist_profiles') 
        THEN (SELECT COUNT(*)::text FROM therapist_profiles)
        ELSE 'N/A (table does not exist)'
    END as remaining_count,
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'therapist_profiles') 
        THEN CASE 
            WHEN (SELECT COUNT(*) FROM therapist_profiles) = 0 THEN '✅ All cleared'
            ELSE '❌ ' || (SELECT COUNT(*)::text FROM therapist_profiles) || ' remain'
        END
        ELSE 'N/A'
    END as status;

-- Show remaining users by type
SELECT 
    '📊 Remaining users by type:' as info;

SELECT 
    user_type,
    COUNT(*) as count
FROM users
GROUP BY user_type
ORDER BY user_type;

-- =====================================================
-- DONE!
-- =====================================================
SELECT '✅ All therapists cleared successfully!' as result;
