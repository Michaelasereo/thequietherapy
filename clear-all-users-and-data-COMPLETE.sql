-- ⚠️  COMPLETE DATABASE WIPE - START FRESH
-- ⚠️  THIS WILL DELETE ALL USERS, THERAPISTS, SESSIONS, CREDITS, PAYMENTS
-- ⚠️  THIS ACTION IS IRREVERSIBLE - USE WITH EXTREME CAUTION
-- ⚠️  RECOMMENDED: Create a database backup before running this script

-- =====================================================
-- SAFETY CHECK - Preview what will be deleted
-- =====================================================
SELECT '⚠️  WARNING: This will delete ALL data!' as warning;

SELECT 
    'users' as table_name, COUNT(*) as records_to_delete FROM users
UNION ALL
SELECT 'therapist_profiles', COUNT(*) FROM therapist_profiles
UNION ALL
SELECT 'therapist_enrollments', COUNT(*) FROM therapist_enrollments
UNION ALL
SELECT 'sessions', COUNT(*) FROM sessions
UNION ALL
SELECT 'user_session_credits', COUNT(*) FROM user_session_credits
UNION ALL
SELECT 'user_purchases', COUNT(*) FROM user_purchases
UNION ALL
SELECT 'partner_credits', COUNT(*) FROM partner_credits
UNION ALL
SELECT 'payments', COUNT(*) FROM payments
UNION ALL
SELECT 'magic_links', COUNT(*) FROM magic_links
ORDER BY records_to_delete DESC;

-- Uncomment the line below ONLY when you're absolutely sure
-- Comment it back after reviewing the preview above
-- DO NOT RUN THIS LIGHTLY!

-- \set PROCEED true

-- =====================================================
-- PAUSE: Review the numbers above before proceeding
-- =====================================================
-- If you're sure you want to proceed:
-- 1. Uncomment the line: -- \set PROCEED true (line 28)
-- 2. Run the entire script
-- =====================================================

-- Safety gate - stops execution if PROCEED is not set
DO $$
BEGIN
    -- This will prevent accidental execution
    IF current_setting('my.proceed', true) != 'yes' THEN
        RAISE EXCEPTION 'SAFETY CHECK: Set my.proceed = yes to proceed with deletion';
    END IF;
END $$;

-- If you reach here, you've bypassed the safety check
-- Proceeding with deletion...

-- =====================================================
-- STEP 1: Disable constraints temporarily
-- =====================================================
SET session_replication_role = replica;

-- =====================================================
-- STEP 2: Delete Supabase Auth users first
-- =====================================================
-- Note: This requires admin privileges
-- You may need to delete these manually from Supabase Dashboard > Authentication

-- =====================================================
-- STEP 3: Delete all related data (child tables first)
-- =====================================================

-- Session and Booking Related
DELETE FROM session_notes;
DELETE FROM session_feedback;
DELETE FROM sessions;

-- Therapist Related
DELETE FROM therapist_availability;
DELETE FROM therapist_time_slots;
DELETE FROM therapist_profiles;
DELETE FROM therapist_enrollments;

-- Credits and Payments (New System)
DELETE FROM user_session_credits;
DELETE FROM user_purchases;
DELETE FROM partner_credits;
DELETE FROM pending_payments;
DELETE FROM payments;
DELETE FROM refunds;
DELETE FROM refund_history;
DELETE FROM credit_transactions;

-- Old Credit System (if exists)
DELETE FROM user_credits;
DELETE FROM user_packages;
DELETE FROM credits;

-- Partner System
DELETE FROM partner_members;
DELETE FROM csv_uploads;
DELETE FROM partner_organizations;

-- CMS and Content
DELETE FROM content;
DELETE FROM cms_content;
DELETE FROM cms_categories;

-- Donations
DELETE FROM donations;

-- Authentication
DELETE FROM magic_links;
DELETE FROM user_sessions;
DELETE FROM verification_tokens;

-- Audit and Logs
DELETE FROM audit_logs;
DELETE FROM admin_logs;
DELETE FROM rate_limits;

-- =====================================================
-- STEP 4: Delete all users (parent table)
-- =====================================================
DELETE FROM users;

-- =====================================================
-- STEP 5: Re-enable constraints
-- =====================================================
SET session_replication_role = DEFAULT;

-- =====================================================
-- STEP 6: Reset sequences (for auto-increment IDs)
-- =====================================================
-- This ensures new records start from 1 again
-- Uncomment if needed
/*
ALTER SEQUENCE IF EXISTS users_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS sessions_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS payments_id_seq RESTART WITH 1;
*/

-- =====================================================
-- STEP 7: Vacuum tables to reclaim space
-- =====================================================
VACUUM ANALYZE users;
VACUUM ANALYZE sessions;
VACUUM ANALYZE therapist_profiles;
VACUUM ANALYZE user_session_credits;

-- =====================================================
-- VERIFICATION: Check all tables are empty
-- =====================================================
SELECT '✅ DELETION COMPLETE - Verification Results:' as status;

SELECT 
    'users' as table_name, 
    COUNT(*) as remaining_records,
    CASE WHEN COUNT(*) = 0 THEN '✅ Cleared' ELSE '❌ Still has data' END as status
FROM users
UNION ALL
SELECT 'therapist_profiles', COUNT(*), 
    CASE WHEN COUNT(*) = 0 THEN '✅ Cleared' ELSE '❌ Still has data' END
FROM therapist_profiles
UNION ALL
SELECT 'therapist_enrollments', COUNT(*),
    CASE WHEN COUNT(*) = 0 THEN '✅ Cleared' ELSE '❌ Still has data' END
FROM therapist_enrollments
UNION ALL
SELECT 'sessions', COUNT(*),
    CASE WHEN COUNT(*) = 0 THEN '✅ Cleared' ELSE '❌ Still has data' END
FROM sessions
UNION ALL
SELECT 'user_session_credits', COUNT(*),
    CASE WHEN COUNT(*) = 0 THEN '✅ Cleared' ELSE '❌ Still has data' END
FROM user_session_credits
UNION ALL
SELECT 'user_purchases', COUNT(*),
    CASE WHEN COUNT(*) = 0 THEN '✅ Cleared' ELSE '❌ Still has data' END
FROM user_purchases
UNION ALL
SELECT 'partner_credits', COUNT(*),
    CASE WHEN COUNT(*) = 0 THEN '✅ Cleared' ELSE '❌ Still has data' END
FROM partner_credits
UNION ALL
SELECT 'payments', COUNT(*),
    CASE WHEN COUNT(*) = 0 THEN '✅ Cleared' ELSE '❌ Still has data' END
FROM payments
UNION ALL
SELECT 'magic_links', COUNT(*),
    CASE WHEN COUNT(*) = 0 THEN '✅ Cleared' ELSE '❌ Still has data' END
FROM magic_links
UNION ALL
SELECT 'partner_members', COUNT(*),
    CASE WHEN COUNT(*) = 0 THEN '✅ Cleared' ELSE '❌ Still has data' END
FROM partner_members
ORDER BY remaining_records DESC;

-- =====================================================
-- IMPORTANT NOTES
-- =====================================================
SELECT 
    '📋 POST-DELETION CHECKLIST:' as info,
    '1. Manually delete Supabase Auth users from Dashboard' as step_1,
    '2. Package definitions preserved (credit packages)' as step_2,
    '3. Database schema/structure preserved' as step_3,
    '4. Functions and triggers still active' as step_4,
    '5. Ready for new users to sign up' as step_5;

-- =====================================================
-- WHAT WAS PRESERVED
-- =====================================================
SELECT 
    '✅ PRESERVED (Not Deleted):' as info,
    'Database schema and table structure' as item_1,
    'Package definitions (credit packages)' as item_2,
    'Functions and triggers' as item_3,
    'Views and indexes' as item_4,
    'RLS policies' as item_5;

-- =====================================================
-- TO RUN THIS SCRIPT SAFELY
-- =====================================================
-- OPTION 1: Manual Safety (Recommended)
-- Replace line 53 with: SET my.proceed TO 'yes';
-- Then run the script

-- OPTION 2: Comment out the safety check (lines 48-56)
-- Only if you're absolutely certain

-- =====================================================
-- SUPABASE AUTH CLEANUP (Manual)
-- =====================================================
-- After running this script, go to:
-- Supabase Dashboard > Authentication > Users
-- Select all users and delete them manually
-- This ensures auth.users table is also cleared

