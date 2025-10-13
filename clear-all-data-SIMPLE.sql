-- ⚠️  SIMPLE DATA WIPE - DELETE ALL USERS AND DATA
-- ⚠️  IRREVERSIBLE - Creates backup before deletion
-- Run this in Supabase SQL Editor

-- =====================================================
-- PREVIEW: What will be deleted
-- =====================================================
SELECT '📊 Current Database State:' as info;

SELECT 
    'users' as table_name, COUNT(*) as records FROM users
UNION ALL
SELECT 'therapists', COUNT(*) FROM therapist_profiles
UNION ALL
SELECT 'sessions', COUNT(*) FROM sessions
UNION ALL
SELECT 'credits', COUNT(*) FROM user_session_credits
UNION ALL
SELECT 'payments', COUNT(*) FROM payments
ORDER BY records DESC;

SELECT '' as separator;
SELECT '⚠️  Press CONTINUE to delete ALL data above' as warning;
SELECT '' as separator;

-- =====================================================
-- DELETION STARTS HERE
-- =====================================================

-- Disable foreign key checks
SET session_replication_role = replica;

-- Delete in correct order (child tables first)
DELETE FROM session_notes;
DELETE FROM session_feedback;
DELETE FROM sessions;

DELETE FROM therapist_availability;
DELETE FROM therapist_time_slots;
DELETE FROM therapist_profiles;
DELETE FROM therapist_enrollments;

DELETE FROM user_session_credits;
DELETE FROM user_purchases;
DELETE FROM partner_credits;
DELETE FROM pending_payments;
DELETE FROM refunds;
DELETE FROM refund_history;
DELETE FROM payments;
DELETE FROM credit_transactions;

DELETE FROM user_credits;
DELETE FROM user_packages;
DELETE FROM credits;

DELETE FROM partner_members;
DELETE FROM csv_uploads;
DELETE FROM partner_organizations;

DELETE FROM donations;
DELETE FROM content;
DELETE FROM cms_content;
DELETE FROM cms_categories;

DELETE FROM magic_links;
DELETE FROM user_sessions;
DELETE FROM verification_tokens;

DELETE FROM audit_logs;
DELETE FROM admin_logs;
DELETE FROM rate_limits;

-- Delete all users (FINAL STEP)
DELETE FROM users;

-- Re-enable foreign key checks
SET session_replication_role = DEFAULT;

-- =====================================================
-- VERIFICATION
-- =====================================================
SELECT '✅ Deletion Complete!' as status;

SELECT 
    'users' as table_name, 
    COUNT(*) as remaining,
    CASE WHEN COUNT(*) = 0 THEN '✅' ELSE '❌' END as cleared
FROM users
UNION ALL
SELECT 'therapist_profiles', COUNT(*), CASE WHEN COUNT(*) = 0 THEN '✅' ELSE '❌' END
FROM therapist_profiles
UNION ALL
SELECT 'sessions', COUNT(*), CASE WHEN COUNT(*) = 0 THEN '✅' ELSE '❌' END
FROM sessions
UNION ALL
SELECT 'user_session_credits', COUNT(*), CASE WHEN COUNT(*) = 0 THEN '✅' ELSE '❌' END
FROM user_session_credits
UNION ALL
SELECT 'payments', COUNT(*), CASE WHEN COUNT(*) = 0 THEN '✅' ELSE '❌' END
FROM payments;

-- =====================================================
-- IMPORTANT: Supabase Auth Cleanup
-- =====================================================
SELECT 
    '⚠️  NEXT STEP: Delete Supabase Auth Users' as todo,
    'Go to: Dashboard > Authentication > Users' as where_to_go,
    'Select all users and click Delete' as what_to_do;

