-- CLEAR ALL THERAPISTS AND RELATED DATA
-- Keeps all other users (individual, partner, admin) intact
-- Run this in Supabase SQL Editor

-- =====================================================
-- PREVIEW: What will be deleted
-- =====================================================
SELECT '📊 Current Therapists to Delete:' as info;

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
    COUNT(*) as total_therapists,
    COUNT(CASE WHEN email LIKE '%test%' THEN 1 END) as test_therapists,
    COUNT(CASE WHEN email NOT LIKE '%test%' THEN 1 END) as real_therapists
FROM users
WHERE user_type = 'therapist';

SELECT '' as separator;
SELECT '⚠️  This will delete ALL therapist data above' as warning;
SELECT '' as separator;

-- =====================================================
-- DELETION STARTS HERE
-- =====================================================

-- Disable foreign key checks temporarily
SET session_replication_role = replica;

-- Get therapist IDs for reference
DO $$
DECLARE
    therapist_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO therapist_count FROM users WHERE user_type = 'therapist';
    RAISE NOTICE 'Deleting % therapist(s)...', therapist_count;
END $$;

-- Delete therapist-related data (child tables first)

-- 1. Delete therapist availability and time slots (if tables exist)
DO $$
BEGIN
    -- Delete from therapist_time_slots if it exists
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'therapist_time_slots') THEN
        DELETE FROM therapist_time_slots
        WHERE therapist_id IN (
            SELECT id FROM users WHERE user_type = 'therapist'
        );
        RAISE NOTICE 'Deleted therapist_time_slots records';
    END IF;
    
    -- Delete from therapist_availability
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'therapist_availability') THEN
        DELETE FROM therapist_availability
        WHERE therapist_id IN (
            SELECT id FROM users WHERE user_type = 'therapist'
        );
        RAISE NOTICE 'Deleted therapist_availability records';
    END IF;
END $$;

-- 2. Delete therapist profiles
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'therapist_profiles') THEN
        DELETE FROM therapist_profiles
        WHERE user_id IN (
            SELECT id FROM users WHERE user_type = 'therapist'
        );
        RAISE NOTICE 'Deleted therapist_profiles records';
    END IF;
END $$;

-- 3. Delete therapist enrollments
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'therapist_enrollments') THEN
        DELETE FROM therapist_enrollments
        WHERE user_id IN (
            SELECT id FROM users WHERE user_type = 'therapist'
        );
        RAISE NOTICE 'Deleted therapist_enrollments records';
    END IF;
END $$;

-- 4. Delete sessions where therapist was involved
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'session_notes') THEN
        DELETE FROM session_notes
        WHERE session_id IN (
            SELECT id FROM sessions 
            WHERE therapist_id IN (SELECT id FROM users WHERE user_type = 'therapist')
        );
        RAISE NOTICE 'Deleted session_notes records';
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'session_feedback') THEN
        DELETE FROM session_feedback
        WHERE session_id IN (
            SELECT id FROM sessions 
            WHERE therapist_id IN (SELECT id FROM users WHERE user_type = 'therapist')
        );
        RAISE NOTICE 'Deleted session_feedback records';
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'sessions') THEN
        DELETE FROM sessions
        WHERE therapist_id IN (
            SELECT id FROM users WHERE user_type = 'therapist'
        );
        RAISE NOTICE 'Deleted sessions records';
    END IF;
END $$;

-- 5. Delete therapist user accounts
DELETE FROM users
WHERE user_type = 'therapist';

-- Re-enable foreign key checks
SET session_replication_role = DEFAULT;

-- =====================================================
-- VERIFICATION
-- =====================================================
SELECT '✅ Therapist Deletion Complete!' as status;

-- Check therapists remaining (should be 0)
SELECT 
    'therapists' as table_name,
    COUNT(*) as remaining,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ All therapists cleared'
        ELSE '❌ ' || COUNT(*) || ' therapists remain'
    END as status
FROM users
WHERE user_type = 'therapist';

-- Check related tables (only if they exist)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'therapist_profiles') THEN
        RAISE NOTICE 'therapist_profiles: % remaining', (SELECT COUNT(*) FROM therapist_profiles);
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'therapist_availability') THEN
        RAISE NOTICE 'therapist_availability: % remaining', (SELECT COUNT(*) FROM therapist_availability);
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'therapist_enrollments') THEN
        RAISE NOTICE 'therapist_enrollments: % remaining', (SELECT COUNT(*) FROM therapist_enrollments);
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'therapist_time_slots') THEN
        RAISE NOTICE 'therapist_time_slots: % remaining', (SELECT COUNT(*) FROM therapist_time_slots);
    END IF;
END $$;

-- Show remaining users by type
SELECT 
    user_type,
    COUNT(*) as count
FROM users
GROUP BY user_type
ORDER BY user_type;

-- =====================================================
-- IMPORTANT NOTES
-- =====================================================
SELECT 
    '📋 POST-DELETION NOTES:' as info,
    'Other users (individual, partner, admin) preserved' as note_1,
    'Sessions with deleted therapists removed' as note_2,
    'Ready for new therapist signups' as note_3,
    'Remember to delete Supabase Auth users manually' as note_4;

-- =====================================================
-- NEXT STEP: Supabase Auth Cleanup
-- =====================================================
SELECT 
    '⚠️  MANUAL STEP REQUIRED:' as action,
    'Go to: Supabase Dashboard > Authentication > Users' as where_to_go,
    'Filter by email or search for therapist emails' as how_to_find,
    'Select therapist accounts and click Delete' as what_to_do;

