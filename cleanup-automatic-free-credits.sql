-- CLEANUP AUTOMATIC FREE CREDITS FROM REGULAR USERS
-- Removes unused automatic free credits from non-partner individual users
-- Keeps partner member credits and already-used credits intact

-- =====================================================
-- 1. PREVIEW: What will be removed
-- =====================================================
SELECT 
    '📋 PREVIEW: Credits to be removed' as info;

-- Show unused automatic free credits for regular users (no partner_id)
SELECT 
    u.id as user_id,
    u.email,
    u.full_name,
    u.user_type,
    u.partner_id,
    usc.id as credit_id,
    usc.session_duration_minutes,
    usc.is_free_credit,
    usc.created_at,
    up.package_type
FROM user_session_credits usc
JOIN users u ON usc.user_id = u.id
LEFT JOIN user_purchases up ON usc.purchase_id = up.id
WHERE usc.is_free_credit = true
  AND usc.used_at IS NULL  -- Only unused credits
  AND u.user_type = 'individual'
  AND u.partner_id IS NULL  -- Exclude partner members
  AND (up.package_type = 'signup_free' OR up.package_type IS NULL);

-- Count total credits to be removed
SELECT 
    COUNT(*) as total_credits_to_remove,
    COUNT(DISTINCT usc.user_id) as affected_users
FROM user_session_credits usc
JOIN users u ON usc.user_id = u.id
LEFT JOIN user_purchases up ON usc.purchase_id = up.id
WHERE usc.is_free_credit = true
  AND usc.used_at IS NULL
  AND u.user_type = 'individual'
  AND u.partner_id IS NULL
  AND (up.package_type = 'signup_free' OR up.package_type IS NULL);

-- =====================================================
-- 2. BACKUP: Create backup table (optional but recommended)
-- =====================================================
-- Uncomment if you want to backup before deletion
/*
CREATE TABLE IF NOT EXISTS user_session_credits_backup AS
SELECT * FROM user_session_credits WHERE id IN (
    SELECT usc.id
    FROM user_session_credits usc
    JOIN users u ON usc.user_id = u.id
    LEFT JOIN user_purchases up ON usc.purchase_id = up.id
    WHERE usc.is_free_credit = true
      AND usc.used_at IS NULL
      AND u.user_type = 'individual'
      AND u.partner_id IS NULL
      AND (up.package_type = 'signup_free' OR up.package_type IS NULL)
);
*/

-- =====================================================
-- 3. DELETE: Remove unused automatic free credits
-- =====================================================
-- Delete from user_session_credits
DELETE FROM user_session_credits
WHERE id IN (
    SELECT usc.id
    FROM user_session_credits usc
    JOIN users u ON usc.user_id = u.id
    LEFT JOIN user_purchases up ON usc.purchase_id = up.id
    WHERE usc.is_free_credit = true
      AND usc.used_at IS NULL  -- Only unused
      AND u.user_type = 'individual'
      AND u.partner_id IS NULL  -- Keep partner member credits
      AND (up.package_type = 'signup_free' OR up.package_type IS NULL)
);

-- =====================================================
-- 4. CLEANUP: Remove signup_free purchase records
-- =====================================================
-- Remove orphaned purchase records for signup_free (if no credits remain)
DELETE FROM user_purchases
WHERE package_type = 'signup_free'
  AND user_id IN (
    SELECT u.id 
    FROM users u 
    WHERE u.user_type = 'individual' 
    AND u.partner_id IS NULL
  )
  AND id NOT IN (
    -- Keep purchase records that still have used credits (for audit)
    SELECT DISTINCT purchase_id 
    FROM user_session_credits 
    WHERE purchase_id IS NOT NULL 
    AND used_at IS NOT NULL
  );

-- =====================================================
-- 5. UPDATE: Reset user free_credits_granted_at flag
-- =====================================================
UPDATE users
SET free_credits_granted_at = NULL
WHERE user_type = 'individual'
  AND partner_id IS NULL
  AND free_credits_granted_at IS NOT NULL
  AND id NOT IN (
    -- Keep flag for users who actually used their free credit
    SELECT DISTINCT user_id 
    FROM user_session_credits 
    WHERE is_free_credit = true 
    AND used_at IS NOT NULL
  );

-- =====================================================
-- 6. VERIFY: Check cleanup results
-- =====================================================
SELECT 
    '✅ CLEANUP COMPLETE' as status;

-- Verify no unused automatic free credits remain for regular users
SELECT 
    'Remaining automatic free credits for regular users:' as check,
    COUNT(*) as count
FROM user_session_credits usc
JOIN users u ON usc.user_id = u.id
LEFT JOIN user_purchases up ON usc.purchase_id = up.id
WHERE usc.is_free_credit = true
  AND usc.used_at IS NULL
  AND u.user_type = 'individual'
  AND u.partner_id IS NULL
  AND (up.package_type = 'signup_free' OR up.package_type IS NULL);
-- Should return 0

-- Verify partner member credits are intact
SELECT 
    'Partner member credits (should be unchanged):' as check,
    COUNT(*) as count
FROM user_session_credits usc
JOIN users u ON usc.user_id = u.id
WHERE u.partner_id IS NOT NULL;

-- Show summary by user type
SELECT 
    '📊 SUMMARY BY USER TYPE' as info;

SELECT 
    u.user_type,
    CASE 
        WHEN u.partner_id IS NOT NULL THEN 'Partner Member'
        ELSE 'Regular User'
    END as category,
    COUNT(DISTINCT u.id) as total_users,
    COUNT(usc.id) as total_credits,
    COUNT(CASE WHEN usc.used_at IS NULL THEN 1 END) as unused_credits,
    COUNT(CASE WHEN usc.used_at IS NOT NULL THEN 1 END) as used_credits
FROM users u
LEFT JOIN user_session_credits usc ON u.id = usc.user_id
GROUP BY u.user_type, 
    CASE 
        WHEN u.partner_id IS NOT NULL THEN 'Partner Member'
        ELSE 'Regular User'
    END
ORDER BY u.user_type;

-- =====================================================
-- 7. WHAT WAS PRESERVED
-- =====================================================
SELECT 
    '✅ PRESERVED (Not Deleted):' as info,
    'Used free credits (for audit trail)' as item_1,
    'Partner member credits (all)' as item_2,
    'Partner credits table records' as item_3,
    'Paid/purchased credits' as item_4;

-- =====================================================
-- 8. ROLLBACK INSTRUCTIONS
-- =====================================================
-- If you created a backup table, you can restore with:
/*
INSERT INTO user_session_credits
SELECT * FROM user_session_credits_backup
WHERE id NOT IN (SELECT id FROM user_session_credits);
*/

