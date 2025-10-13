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

-- 1. Delete therapist availability and time slots
DELETE FROM therapist_time_slots
WHERE therapist_id IN (
    SELECT id FROM users WHERE user_type = 'therapist'
);

DELETE FROM therapist_availability
WHERE therapist_id IN (
    SELECT id FROM users WHERE user_type = 'therapist'
);

-- 2. Delete therapist profiles
DELETE FROM therapist_profiles
WHERE user_id IN (
    SELECT id FROM users WHERE user_type = 'therapist'
);

-- 3. Delete therapist enrollments
DELETE FROM therapist_enrollments
WHERE user_id IN (
    SELECT id FROM users WHERE user_type = 'therapist'
);

-- 4. Delete sessions where therapist was involved
DELETE FROM session_notes
WHERE session_id IN (
    SELECT id FROM sessions 
    WHERE therapist_id IN (SELECT id FROM users WHERE user_type = 'therapist')
);

DELETE FROM session_feedback
WHERE session_id IN (
    SELECT id FROM sessions 
    WHERE therapist_id IN (SELECT id FROM users WHERE user_type = 'therapist')
);

DELETE FROM sessions
WHERE therapist_id IN (
    SELECT id FROM users WHERE user_type = 'therapist'
);

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

-- Check related tables
SELECT 'therapist_profiles' as table_name, COUNT(*) as remaining
FROM therapist_profiles
UNION ALL
SELECT 'therapist_availability', COUNT(*) FROM therapist_availability
UNION ALL
SELECT 'therapist_enrollments', COUNT(*) FROM therapist_enrollments
UNION ALL
SELECT 'therapist_time_slots', COUNT(*) FROM therapist_time_slots;

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

