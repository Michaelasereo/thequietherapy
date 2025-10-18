-- ⚠️  DANGER ZONE: Clear ALL Data for Fresh Start
-- Run this in Supabase SQL Editor to reset everything for testing
-- ============================================

-- This script will:
-- 1. Delete all sessions (therapist and client)
-- 2. Delete all therapist enrollments
-- 3. Delete all therapist user accounts
-- 4. Delete all client user accounts
-- 5. Clear all therapist profiles
-- 6. Reset any other related data

-- ============================================
-- STEP 1: Delete all sessions (both therapist and client)
-- ============================================
DELETE FROM sessions;

-- ============================================
-- STEP 2: Delete all therapist enrollments
-- ============================================
DELETE FROM therapist_enrollments;

-- ============================================
-- STEP 3: Delete all therapist profiles
-- ============================================
DELETE FROM therapist_profiles;

-- ============================================
-- STEP 4: Delete all user accounts (both therapist and client)
-- ============================================
DELETE FROM users;

-- ============================================
-- STEP 5: Clear any other related tables (if they exist)
-- ============================================
-- Delete from any other tables that might have user references
-- (Add more DELETE statements here if you have other related tables)

-- ============================================
-- VERIFICATION: Check that everything is cleared
-- ============================================
SELECT 'VERIFICATION RESULTS:' as info;

SELECT 'Remaining users:' as table_name, COUNT(*) as count
FROM users

UNION ALL

SELECT 'Remaining therapist enrollments:' as table_name, COUNT(*) as count
FROM therapist_enrollments

UNION ALL

SELECT 'Remaining therapist profiles:' as table_name, COUNT(*) as count
FROM therapist_profiles

UNION ALL

SELECT 'Remaining sessions:' as table_name, COUNT(*) as count
FROM sessions;

-- ============================================
-- MANUAL CLEANUP NEEDED:
-- ============================================
-- 1. Go to Supabase Dashboard > Storage
-- 2. Delete the entire 'profile-images' bucket or just the 'therapist-profiles' folder
-- 3. This will clear all uploaded profile images
-- 4. (Optional - you can keep them for reference)

-- ============================================
-- RESET SEQUENCES (Optional - for clean IDs)
-- ============================================
-- Uncomment these if you want to reset auto-increment IDs to start from 1
-- ALTER SEQUENCE users_id_seq RESTART WITH 1;
-- ALTER SEQUENCE therapist_enrollments_id_seq RESTART WITH 1;
-- ALTER SEQUENCE sessions_id_seq RESTART WITH 1;

-- ============================================
-- DONE! Database is now clean and ready for fresh testing
-- ============================================
-- You can now:
-- 1. Deploy your application
-- 2. Test fresh user signups
-- 3. Test therapist enrollment flow
-- 4. Test approval process
-- 5. Test all features from scratch

SELECT '🎉 DATABASE CLEARED SUCCESSFULLY!' as status;
SELECT 'Ready for fresh deployment and testing!' as next_steps;
