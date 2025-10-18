-- ============================================
-- FIX CEO ACCOUNT: Set user_active = true
-- ============================================
-- The CEO account shows user_active: false but enrollment_active: true
-- This needs to be fixed for availability to work
-- ============================================

-- Fix the CEO account specifically
UPDATE users 
SET 
  is_active = true,
  updated_at = NOW()
WHERE email = 'ceo@thequietherapy.live' 
  AND user_type = 'therapist'
  AND is_active = false;

-- Verify the fix
SELECT 
  u.email,
  u.full_name,
  u.is_verified, 
  u.is_active as user_active,
  e.status,
  e.is_active as enrollment_active,
  CASE 
    WHEN u.is_active = true AND e.is_active = true THEN '✅ READY FOR AVAILABILITY'
    ELSE '❌ STILL HAS ISSUES'
  END as availability_status
FROM users u
JOIN therapist_enrollments e ON u.email = e.email
WHERE u.email = 'ceo@thequietherapy.live';

-- Check all approved therapists for consistency
SELECT 
  u.email,
  u.is_active as user_active,
  e.is_active as enrollment_active,
  CASE 
    WHEN u.is_active = e.is_active THEN '✅ SYNCED'
    ELSE '❌ MISMATCHED'
  END as status_check
FROM users u
JOIN therapist_enrollments e ON u.email = e.email
WHERE u.user_type = 'therapist' 
  AND e.status = 'approved'
ORDER BY u.email;
