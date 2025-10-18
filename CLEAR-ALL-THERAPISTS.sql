-- ⚠️  DANGER ZONE: Clear All Therapist Data
-- Run this in Supabase SQL Editor to reset therapist data for testing

-- This script will:
-- 1. Delete all therapist enrollments
-- 2. Delete all therapist user accounts
-- 3. Clear all therapist sessions
-- 4. Clean up profile images from storage (manual step)

-- ============================================
-- STEP 1: Delete all therapist sessions
-- ============================================
DELETE FROM sessions 
WHERE therapist_id IN (
  SELECT id FROM users WHERE user_type = 'therapist'
);

-- ============================================
-- STEP 2: Delete all therapist enrollments
-- ============================================
DELETE FROM therapist_enrollments;

-- ============================================
-- STEP 3: Delete all therapist user accounts
-- ============================================
DELETE FROM users 
WHERE user_type = 'therapist';

-- ============================================
-- STEP 4: Delete all therapist profiles (if table exists)
-- ============================================
DELETE FROM therapist_profiles;

-- ============================================
-- VERIFICATION: Check that everything is cleared
-- ============================================
SELECT 'Remaining therapist users:' as check_type, COUNT(*) as count
FROM users 
WHERE user_type = 'therapist'

UNION ALL

SELECT 'Remaining enrollments:' as check_type, COUNT(*) as count
FROM therapist_enrollments

UNION ALL

SELECT 'Remaining therapist sessions:' as check_type, COUNT(*) as count
FROM sessions 
WHERE therapist_id IN (
  SELECT id FROM users WHERE user_type = 'therapist'
);

-- ============================================
-- MANUAL CLEANUP NEEDED:
-- ============================================
-- Delete profile images from Supabase Storage:
-- 1. Go to Supabase Dashboard
-- 2. Storage > profile-images bucket
-- 3. Delete therapist-profiles/ folder
-- 4. Or keep for reference (won't affect functionality)

-- ============================================
-- DONE! You can now test enrollment again
-- ============================================

