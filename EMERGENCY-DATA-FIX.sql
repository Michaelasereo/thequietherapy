-- ============================================
-- EMERGENCY FIX: Sync is_active Between Tables
-- ============================================
-- Run this NOW to fix existing approved therapists
-- ============================================

-- Step 1: CHECK CURRENT INCONSISTENCIES
-- ============================================
SELECT 
  'BEFORE FIX - Checking for inconsistencies...' as step;

SELECT 
  u.email,
  u.full_name,
  u.is_verified as user_verified,
  u.is_active as user_active,
  e.status as enrollment_status,
  e.is_active as enrollment_active,
  CASE 
    WHEN u.is_active != e.is_active THEN '❌ MISMATCH - WILL FIX'
    ELSE '✅ OK'
  END as status_check
FROM users u
JOIN therapist_enrollments e ON u.email = e.email
WHERE u.user_type = 'therapist'
  AND e.status = 'approved'
ORDER BY e.updated_at DESC;

-- Step 2: FIX ALL APPROVED THERAPISTS
-- ============================================
SELECT 'FIXING DATA...' as step;

UPDATE therapist_enrollments 
SET 
  is_active = true,
  updated_at = NOW()
WHERE status = 'approved' 
  AND is_active = false;

SELECT 'Data fix complete. Rows affected: ' || (SELECT COUNT(*) 
  FROM therapist_enrollments 
  WHERE status = 'approved' 
  AND is_active = true) as result;

-- Step 3: VERIFY THE FIX
-- ============================================
SELECT 'AFTER FIX - Verifying consistency...' as step;

SELECT 
  u.email,
  u.full_name,
  u.is_verified as user_verified,
  u.is_active as user_active,
  e.status as enrollment_status,
  e.is_active as enrollment_active,
  CASE 
    WHEN u.is_active = e.is_active THEN '✅ SYNCED'
    ELSE '❌ STILL MISMATCHED'
  END as status_check
FROM users u
JOIN therapist_enrollments e ON u.email = e.email
WHERE u.user_type = 'therapist'
ORDER BY e.updated_at DESC;

-- Step 4: CHECK CEO ACCOUNT SPECIFICALLY
-- ============================================
SELECT 'CEO ACCOUNT STATUS...' as step;

SELECT 
  u.email,
  u.full_name,
  u.is_verified, 
  u.is_active as user_active,
  e.status,
  e.is_active as enrollment_active,
  e.approved_at,
  CASE 
    WHEN u.is_active = e.is_active AND e.is_active = true THEN '✅ READY FOR AVAILABILITY'
    ELSE '❌ STILL HAS ISSUES'
  END as availability_status
FROM users u
JOIN therapist_enrollments e ON u.email = e.email
WHERE u.email = 'ceo@thequietherapy.live';

-- ============================================
-- EMERGENCY FIX COMPLETE
-- ============================================
