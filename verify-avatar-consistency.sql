-- ============================================
-- AVATAR CONSISTENCY VERIFICATION SCRIPT
-- ============================================
-- Purpose: Check if avatars are synced across all 3 tables
-- Run this after implementing Phase 1 avatar fix
-- ============================================

-- QUICK CHECK: Find all inconsistencies
-- ============================================
SELECT 
  u.email,
  u.user_type,
  u.is_verified,
  u.avatar_url as users_avatar,
  te.profile_image_url as enrollment_avatar,
  tp.profile_image_url as profile_avatar,
  CASE 
    WHEN u.avatar_url IS NULL AND te.profile_image_url IS NULL AND tp.profile_image_url IS NULL 
    THEN '⚪ NO AVATAR SET'
    WHEN u.avatar_url = te.profile_image_url 
      AND te.profile_image_url = tp.profile_image_url 
    THEN '✅ CONSISTENT'
    ELSE '❌ INCONSISTENT'
  END as status,
  CASE 
    WHEN u.avatar_url != te.profile_image_url THEN 'users ≠ enrollments'
    WHEN te.profile_image_url != tp.profile_image_url THEN 'enrollments ≠ profiles'
    WHEN u.avatar_url != tp.profile_image_url THEN 'users ≠ profiles'
    ELSE NULL
  END as issue_description
FROM users u
LEFT JOIN therapist_enrollments te ON u.email = te.email
LEFT JOIN therapist_profiles tp ON u.id = tp.user_id
WHERE u.user_type = 'therapist'
ORDER BY 
  CASE 
    WHEN u.avatar_url IS NULL AND te.profile_image_url IS NULL AND tp.profile_image_url IS NULL THEN 3
    WHEN u.avatar_url = te.profile_image_url AND te.profile_image_url = tp.profile_image_url THEN 2
    ELSE 1
  END,
  u.email;


-- SUMMARY: Count of consistencies vs inconsistencies
-- ============================================
SELECT 
  CASE 
    WHEN u.avatar_url IS NULL AND te.profile_image_url IS NULL AND tp.profile_image_url IS NULL 
    THEN 'No Avatar Set'
    WHEN u.avatar_url = te.profile_image_url 
      AND te.profile_image_url = tp.profile_image_url 
    THEN 'Consistent'
    ELSE 'Inconsistent'
  END as status,
  COUNT(*) as count
FROM users u
LEFT JOIN therapist_enrollments te ON u.email = te.email
LEFT JOIN therapist_profiles tp ON u.id = tp.user_id
WHERE u.user_type = 'therapist'
GROUP BY 
  CASE 
    WHEN u.avatar_url IS NULL AND te.profile_image_url IS NULL AND tp.profile_image_url IS NULL 
    THEN 'No Avatar Set'
    WHEN u.avatar_url = te.profile_image_url 
      AND te.profile_image_url = tp.profile_image_url 
    THEN 'Consistent'
    ELSE 'Inconsistent'
  END
ORDER BY count DESC;


-- DETAILED: Show exact mismatches
-- ============================================
SELECT 
  u.email,
  'users.avatar_url' as field,
  u.avatar_url as value
FROM users u
WHERE u.user_type = 'therapist'
AND u.avatar_url IS NOT NULL

UNION ALL

SELECT 
  te.email,
  'enrollments.profile_image_url' as field,
  te.profile_image_url as value
FROM therapist_enrollments te
WHERE te.profile_image_url IS NOT NULL

UNION ALL

SELECT 
  u.email,
  'profiles.profile_image_url' as field,
  tp.profile_image_url as value
FROM users u
JOIN therapist_profiles tp ON u.id = tp.user_id
WHERE u.user_type = 'therapist'
AND tp.profile_image_url IS NOT NULL

ORDER BY email, field;


-- CHECK SPECIFIC THERAPIST
-- ============================================
-- Replace 'YOUR_EMAIL_HERE' with actual email
SELECT 
  'users' as table_name,
  avatar_url as image_url
FROM users 
WHERE email = 'YOUR_EMAIL_HERE'
  AND user_type = 'therapist'

UNION ALL

SELECT 
  'therapist_enrollments' as table_name,
  profile_image_url as image_url
FROM therapist_enrollments
WHERE email = 'YOUR_EMAIL_HERE'

UNION ALL

SELECT 
  'therapist_profiles' as table_name,
  tp.profile_image_url as image_url
FROM therapist_profiles tp
JOIN users u ON tp.user_id = u.id
WHERE u.email = 'YOUR_EMAIL_HERE';


-- FIND ORPHANED RECORDS
-- ============================================
-- Therapist profiles without enrollments
SELECT 
  'Profile without enrollment' as issue,
  tp.id as profile_id,
  u.email,
  tp.profile_image_url
FROM therapist_profiles tp
JOIN users u ON tp.user_id = u.id
LEFT JOIN therapist_enrollments te ON te.email = u.email
WHERE te.id IS NULL
  AND u.user_type = 'therapist';

-- Enrollments without profiles
SELECT 
  'Enrollment without profile' as issue,
  te.id as enrollment_id,
  te.email,
  te.profile_image_url
FROM therapist_enrollments te
LEFT JOIN users u ON u.email = te.email AND u.user_type = 'therapist'
LEFT JOIN therapist_profiles tp ON tp.user_id = u.id
WHERE tp.id IS NULL;


-- FIX INCONSISTENCIES (Run with caution!)
-- ============================================
-- This uses therapist_enrollments as source of truth

-- Uncomment to execute fix:
/*
-- Fix users table
UPDATE users u
SET 
  avatar_url = te.profile_image_url,
  updated_at = NOW()
FROM therapist_enrollments te
WHERE u.email = te.email
  AND u.user_type = 'therapist'
  AND (u.avatar_url IS DISTINCT FROM te.profile_image_url);

-- Fix therapist_profiles table
UPDATE therapist_profiles tp
SET 
  profile_image_url = te.profile_image_url,
  updated_at = NOW()
FROM users u
JOIN therapist_enrollments te ON te.email = u.email
WHERE tp.user_id = u.id
  AND u.user_type = 'therapist'
  AND (tp.profile_image_url IS DISTINCT FROM te.profile_image_url);

-- Verify fix worked
SELECT 
  COUNT(*) as fixed_count
FROM users u
JOIN therapist_enrollments te ON u.email = te.email
JOIN therapist_profiles tp ON tp.user_id = u.id
WHERE u.user_type = 'therapist'
  AND u.avatar_url = te.profile_image_url
  AND te.profile_image_url = tp.profile_image_url;
*/


-- VERIFY DATABASE TRIGGER EXISTS
-- ============================================
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name LIKE '%avatar%'
   OR trigger_name LIKE '%profile_image%'
ORDER BY trigger_name;


-- CHECK TRIGGER FUNCTION
-- ============================================
SELECT 
  proname as function_name,
  pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname LIKE '%avatar%'
   OR proname LIKE '%profile_image%'
ORDER BY proname;


-- PERFORMANCE CHECK: Recently updated avatars
-- ============================================
SELECT 
  te.email,
  te.profile_image_url,
  te.updated_at as last_enrollment_update,
  u.updated_at as last_user_update,
  tp.updated_at as last_profile_update,
  CASE 
    WHEN ABS(EXTRACT(EPOCH FROM (te.updated_at - u.updated_at))) < 5 THEN '✅ Synced'
    ELSE '⚠️ Time diff: ' || ABS(EXTRACT(EPOCH FROM (te.updated_at - u.updated_at)))::TEXT || 's'
  END as sync_status
FROM therapist_enrollments te
JOIN users u ON u.email = te.email AND u.user_type = 'therapist'
LEFT JOIN therapist_profiles tp ON tp.user_id = u.id
WHERE te.profile_image_url IS NOT NULL
ORDER BY te.updated_at DESC
LIMIT 10;


-- EXPORT REPORT
-- ============================================
-- Generate CSV-friendly report
SELECT 
  u.email,
  u.full_name,
  CASE 
    WHEN u.avatar_url = te.profile_image_url 
      AND te.profile_image_url = tp.profile_image_url 
    THEN 'PASS'
    ELSE 'FAIL'
  END as test_result,
  u.avatar_url as users_avatar,
  te.profile_image_url as enrollment_avatar,
  tp.profile_image_url as profile_avatar,
  u.updated_at as last_updated
FROM users u
LEFT JOIN therapist_enrollments te ON u.email = te.email
LEFT JOIN therapist_profiles tp ON u.id = tp.user_id
WHERE u.user_type = 'therapist'
ORDER BY test_result, u.email;

