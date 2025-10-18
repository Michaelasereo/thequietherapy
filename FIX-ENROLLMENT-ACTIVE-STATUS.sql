-- ============================================
-- FIX: Sync is_active status between users and therapist_enrollments tables
-- ============================================
-- Issue: Approval API was updating users.is_active but NOT therapist_enrollments.is_active
-- This script fixes existing data inconsistencies
-- ============================================

-- Step 1: Check current inconsistencies
-- ============================================
SELECT 
  u.email,
  u.full_name,
  u.is_verified AS user_verified,
  u.is_active AS user_active,
  te.status AS enrollment_status,
  te.is_active AS enrollment_active,
  CASE 
    WHEN u.is_active != te.is_active THEN '❌ MISMATCH'
    ELSE '✅ OK'
  END AS status_check
FROM users u
INNER JOIN therapist_enrollments te ON u.email = te.email
WHERE u.user_type = 'therapist'
ORDER BY te.updated_at DESC;

-- Step 2: Fix the inconsistencies
-- ============================================
-- Update all approved therapists to have consistent is_active status
UPDATE therapist_enrollments te
SET 
  is_active = u.is_active,
  updated_at = NOW()
FROM users u
WHERE te.email = u.email
  AND u.user_type = 'therapist'
  AND te.status = 'approved'
  AND te.is_active != u.is_active;

-- Step 3: Verify the fix
-- ============================================
SELECT 
  u.email,
  u.full_name,
  u.is_verified AS user_verified,
  u.is_active AS user_active,
  te.status AS enrollment_status,
  te.is_active AS enrollment_active,
  CASE 
    WHEN u.is_active = te.is_active THEN '✅ SYNCED'
    ELSE '❌ STILL MISMATCHED'
  END AS status_check
FROM users u
INNER JOIN therapist_enrollments te ON u.email = te.email
WHERE u.user_type = 'therapist'
ORDER BY te.updated_at DESC;

-- Step 4 (OPTIONAL): Add trigger to prevent future inconsistencies
-- ============================================
-- This will automatically sync is_active status when users table is updated
/*
CREATE OR REPLACE FUNCTION sync_therapist_active_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Only sync for therapist accounts
  IF NEW.user_type = 'therapist' THEN
    UPDATE therapist_enrollments 
    SET 
      is_active = NEW.is_active,
      updated_at = NOW()
    WHERE email = NEW.email;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS sync_user_to_enrollment_active ON users;

-- Create the trigger
CREATE TRIGGER sync_user_to_enrollment_active
AFTER UPDATE OF is_active ON users
FOR EACH ROW
WHEN (OLD.is_active IS DISTINCT FROM NEW.is_active)
EXECUTE FUNCTION sync_therapist_active_status();
*/

-- ============================================
-- QUICK FIX for CEO account (if needed)
-- ============================================
UPDATE therapist_enrollments 
SET 
  is_active = true,
  updated_at = NOW()
WHERE email = 'ceo@thequietherapy.live' 
  AND status = 'approved'
  AND is_active = false;

-- Verify CEO account
SELECT 
  u.email,
  u.is_verified,
  u.is_active AS user_active,
  te.status,
  te.is_active AS enrollment_active
FROM users u
LEFT JOIN therapist_enrollments te ON u.email = te.email
WHERE u.email = 'ceo@thequietherapy.live';

-- ============================================
-- END OF SCRIPT
-- ============================================
