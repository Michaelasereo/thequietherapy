-- VERIFICATION: Check if credit allocation fixes have been applied
-- Run this in Supabase SQL Editor to check status

SELECT '🔍 CHECKING CREDIT ALLOCATION FIX STATUS...' as info;

-- =====================================================
-- CHECK 1: Is auto-credit trigger disabled?
-- =====================================================
SELECT '📋 CHECK 1: Auto-Credit Trigger Status' as check_name;

SELECT 
    CASE 
        WHEN pg_get_functiondef(oid) LIKE '%RETURN NEW%' 
         AND pg_get_functiondef(oid) NOT LIKE '%grant_signup_credit%'
        THEN '✅ DISABLED - Trigger exists but does nothing'
        WHEN pg_get_functiondef(oid) LIKE '%grant_signup_credit%'
        THEN '❌ ACTIVE - Still granting automatic credits'
        ELSE '⚠️ UNKNOWN - Cannot determine status'
    END as trigger_status,
    pg_get_functiondef(oid) as function_code
FROM pg_proc 
WHERE proname = 'auto_grant_signup_credit';

-- If no results above, trigger doesn't exist
SELECT 
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'auto_grant_signup_credit')
        THEN '⚠️ WARNING: auto_grant_signup_credit function not found!'
        ELSE 'Function exists'
    END as function_check;

-- =====================================================
-- CHECK 2: Are there unused automatic free credits?
-- =====================================================
SELECT '📋 CHECK 2: Unused Automatic Free Credits for Regular Users' as check_name;

SELECT 
    COUNT(*) as unused_auto_credits,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ CLEANED - No automatic free credits found'
        WHEN COUNT(*) > 0 THEN '❌ NOT CLEANED - ' || COUNT(*) || ' automatic free credits still exist'
    END as cleanup_status
FROM user_session_credits usc
JOIN users u ON usc.user_id = u.id
LEFT JOIN user_purchases up ON usc.purchase_id = up.id
WHERE usc.is_free_credit = true
  AND usc.used_at IS NULL
  AND u.user_type = 'individual'
  AND u.partner_id IS NULL
  AND (up.package_type = 'signup_free' OR up.package_type IS NULL);

-- Show details if any exist
SELECT 
    u.email,
    u.full_name,
    u.created_at as user_created,
    usc.created_at as credit_created,
    usc.session_duration_minutes,
    up.package_type
FROM user_session_credits usc
JOIN users u ON usc.user_id = u.id
LEFT JOIN user_purchases up ON usc.purchase_id = up.id
WHERE usc.is_free_credit = true
  AND usc.used_at IS NULL
  AND u.user_type = 'individual'
  AND u.partner_id IS NULL
  AND (up.package_type = 'signup_free' OR up.package_type IS NULL)
LIMIT 10;

-- =====================================================
-- CHECK 3: Partner member credits status
-- =====================================================
SELECT '📋 CHECK 3: Partner Member Credits (Should be intact)' as check_name;

SELECT 
    COUNT(DISTINCT u.id) as partner_members,
    COUNT(*) as total_credits,
    COUNT(CASE WHEN pc.status = 'active' THEN 1 END) as active_credits,
    COUNT(CASE WHEN pc.status = 'used' THEN 1 END) as used_credits
FROM users u
LEFT JOIN partner_credits pc ON u.email = pc.employee_email
WHERE u.partner_id IS NOT NULL;

-- =====================================================
-- CHECK 4: Credit distribution by user type
-- =====================================================
SELECT '📋 CHECK 4: Current Credit Distribution' as check_name;

SELECT 
    u.user_type,
    CASE 
        WHEN u.partner_id IS NOT NULL THEN 'Partner Member'
        ELSE 'Regular User'
    END as category,
    COUNT(DISTINCT u.id) as users,
    COUNT(usc.id) as total_credits,
    COUNT(CASE WHEN usc.used_at IS NULL THEN 1 END) as unused,
    COUNT(CASE WHEN usc.used_at IS NOT NULL THEN 1 END) as used,
    COUNT(CASE WHEN usc.is_free_credit THEN 1 END) as free_credits
FROM users u
LEFT JOIN user_session_credits usc ON u.id = usc.user_id
GROUP BY u.user_type, 
    CASE 
        WHEN u.partner_id IS NOT NULL THEN 'Partner Member'
        ELSE 'Regular User'
    END
ORDER BY u.user_type;

-- =====================================================
-- CHECK 5: Partner credits table
-- =====================================================
SELECT '📋 CHECK 5: Partner Credits Table Status' as check_name;

SELECT 
    COUNT(*) as total_partner_credits,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
    COUNT(CASE WHEN status = 'used' THEN 1 END) as used,
    COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired,
    COUNT(DISTINCT partner_id) as unique_partners,
    COUNT(DISTINCT employee_email) as unique_employees
FROM partner_credits;

-- =====================================================
-- FINAL SUMMARY
-- =====================================================
SELECT '📊 FINAL SUMMARY' as summary;

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_proc 
            WHERE proname = 'auto_grant_signup_credit' 
            AND pg_get_functiondef(oid) NOT LIKE '%grant_signup_credit%'
        )
        AND NOT EXISTS (
            SELECT 1 
            FROM user_session_credits usc
            JOIN users u ON usc.user_id = u.id
            LEFT JOIN user_purchases up ON usc.purchase_id = up.id
            WHERE usc.is_free_credit = true
              AND usc.used_at IS NULL
              AND u.user_type = 'individual'
              AND u.partner_id IS NULL
              AND (up.package_type = 'signup_free' OR up.package_type IS NULL)
        )
        THEN '✅ BOTH SCRIPTS APPLIED SUCCESSFULLY'
        WHEN EXISTS (
            SELECT 1 FROM pg_proc 
            WHERE proname = 'auto_grant_signup_credit' 
            AND pg_get_functiondef(oid) NOT LIKE '%grant_signup_credit%'
        )
        THEN '⚠️ SCRIPT 1 APPLIED, SCRIPT 2 PENDING (cleanup needed)'
        ELSE '❌ SCRIPTS NOT APPLIED YET'
    END as overall_status;

-- =====================================================
-- NEXT STEPS
-- =====================================================
SELECT '📝 NEXT STEPS:' as action_required;

SELECT 
    CASE 
        WHEN NOT EXISTS (
            SELECT 1 FROM pg_proc 
            WHERE proname = 'auto_grant_signup_credit' 
            AND pg_get_functiondef(oid) NOT LIKE '%grant_signup_credit%'
        )
        THEN '1. ❌ Run fix-partner-member-credit-allocation.sql first'
        ELSE '1. ✅ Trigger fix already applied'
    END as step_1,
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM user_session_credits usc
            JOIN users u ON usc.user_id = u.id
            LEFT JOIN user_purchases up ON usc.purchase_id = up.id
            WHERE usc.is_free_credit = true
              AND usc.used_at IS NULL
              AND u.user_type = 'individual'
              AND u.partner_id IS NULL
              AND (up.package_type = 'signup_free' OR up.package_type IS NULL)
        )
        THEN '2. ❌ Run cleanup-automatic-free-credits.sql to remove existing credits'
        ELSE '2. ✅ Cleanup already done or no cleanup needed'
    END as step_2;

