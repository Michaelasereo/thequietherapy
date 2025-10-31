-- =====================================================
-- CLEAR ALL USERS AND THERAPISTS - COMPLETE SQL SCRIPT
-- =====================================================
-- ⚠️  WARNING: This will DELETE ALL users, therapists, and related data
-- ⚠️  This action is IRREVERSIBLE
-- ⚠️  Make sure you have a backup if needed
-- ⚠️  This only clears the DATABASE tables
-- ⚠️  You MUST also run the Node.js script to clear Supabase Auth users
-- =====================================================

-- =====================================================
-- STEP 1: PREVIEW - See what will be deleted
-- =====================================================
SELECT '📊 PRE-DELETION SUMMARY:' as info;

-- Show user counts by type
SELECT 
    user_type,
    COUNT(*) as count
FROM users
GROUP BY user_type
ORDER BY user_type;

-- Show total count
SELECT 
    COUNT(*) as total_users_to_delete
FROM users;

-- =====================================================
-- STEP 2: DELETE CHILD TABLES FIRST (respects foreign keys)
-- Only deletes from tables that exist
-- =====================================================

-- Delete in proper order to respect foreign key constraints

-- 1. Session-related data (must be deleted first)
DO $$
BEGIN
    -- Session notes (if exists)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'session_notes') THEN
        DELETE FROM session_notes;
        RAISE NOTICE '✅ Deleted session_notes';
    END IF;
    
    -- Session feedback (if exists)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'session_feedback') THEN
        DELETE FROM session_feedback;
        RAISE NOTICE '✅ Deleted session_feedback';
    END IF;
    
    -- Sessions (if exists)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sessions') THEN
        DELETE FROM sessions;
        RAISE NOTICE '✅ Deleted sessions';
    END IF;
    
    -- 2. Therapist-related data
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'therapist_availability') THEN
        DELETE FROM therapist_availability;
        RAISE NOTICE '✅ Deleted therapist_availability';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'therapist_time_slots') THEN
        DELETE FROM therapist_time_slots;
        RAISE NOTICE '✅ Deleted therapist_time_slots';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'availability_weekly_schedules') THEN
        DELETE FROM availability_weekly_schedules;
        RAISE NOTICE '✅ Deleted availability_weekly_schedules';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'therapist_profiles') THEN
        DELETE FROM therapist_profiles;
        RAISE NOTICE '✅ Deleted therapist_profiles';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'therapist_enrollments') THEN
        DELETE FROM therapist_enrollments;
        RAISE NOTICE '✅ Deleted therapist_enrollments';
    END IF;
    
    -- 3. Authentication and session management
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_sessions') THEN
        DELETE FROM user_sessions;
        RAISE NOTICE '✅ Deleted user_sessions';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'magic_links') THEN
        DELETE FROM magic_links;
        RAISE NOTICE '✅ Deleted magic_links';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'verification_tokens') THEN
        DELETE FROM verification_tokens;
        RAISE NOTICE '✅ Deleted verification_tokens';
    END IF;
    
    -- 4. Credits and purchases
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_session_credits') THEN
        DELETE FROM user_session_credits;
        RAISE NOTICE '✅ Deleted user_session_credits';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_purchases') THEN
        DELETE FROM user_purchases;
        RAISE NOTICE '✅ Deleted user_purchases';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'credit_transactions') THEN
        DELETE FROM credit_transactions;
        RAISE NOTICE '✅ Deleted credit_transactions';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_credits') THEN
        DELETE FROM user_credits;
        RAISE NOTICE '✅ Deleted user_credits';
    END IF;
    
    -- 5. Partner-related (if exists)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'partner_members') THEN
        DELETE FROM partner_members;
        RAISE NOTICE '✅ Deleted partner_members';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'partner_credits') THEN
        DELETE FROM partner_credits;
        RAISE NOTICE '✅ Deleted partner_credits';
    END IF;
    
    -- 6. Payments (if exists)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payments') THEN
        DELETE FROM payments WHERE user_id IS NOT NULL;
        RAISE NOTICE '✅ Deleted user payments';
    END IF;
END $$;

-- =====================================================
-- STEP 3: DELETE ALL USERS (parent table)
-- This will cascade to any remaining foreign key references
-- =====================================================
DELETE FROM users;

-- =====================================================
-- STEP 4: VERIFICATION - Confirm everything is cleared
-- =====================================================
SELECT '✅ DELETION COMPLETE - Verification:' as status;

-- Check users table (should be 0)
SELECT 
    'users' as table_name,
    COUNT(*) as remaining_records,
    CASE WHEN COUNT(*) = 0 THEN '✅ Cleared' ELSE '❌ Has ' || COUNT(*) || ' records' END as status
FROM users;

-- Verify other tables
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    -- Check therapist_enrollments
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'therapist_enrollments') THEN
        SELECT COUNT(*) INTO table_count FROM therapist_enrollments;
        RAISE NOTICE 'therapist_enrollments: % records - %', 
            table_count,
            CASE WHEN table_count = 0 THEN '✅ Cleared' ELSE '❌ Has records' END;
    END IF;
    
    -- Check therapist_profiles
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'therapist_profiles') THEN
        SELECT COUNT(*) INTO table_count FROM therapist_profiles;
        RAISE NOTICE 'therapist_profiles: % records - %', 
            table_count,
            CASE WHEN table_count = 0 THEN '✅ Cleared' ELSE '❌ Has records' END;
    END IF;
    
    -- Check sessions
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sessions') THEN
        SELECT COUNT(*) INTO table_count FROM sessions;
        RAISE NOTICE 'sessions: % records - %', 
            table_count,
            CASE WHEN table_count = 0 THEN '✅ Cleared' ELSE '❌ Has records' END;
    END IF;
    
    -- Check user_sessions
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_sessions') THEN
        SELECT COUNT(*) INTO table_count FROM user_sessions;
        RAISE NOTICE 'user_sessions: % records - %', 
            table_count,
            CASE WHEN table_count = 0 THEN '✅ Cleared' ELSE '❌ Has records' END;
    END IF;
    
    -- Check magic_links
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'magic_links') THEN
        SELECT COUNT(*) INTO table_count FROM magic_links;
        RAISE NOTICE 'magic_links: % records - %', 
            table_count,
            CASE WHEN table_count = 0 THEN '✅ Cleared' ELSE '❌ Has records' END;
    END IF;
END $$;

-- =====================================================
-- IMPORTANT: Supabase Auth Users
-- =====================================================
SELECT 
    '⚠️  CRITICAL NEXT STEP:' as warning,
    '⚠️  You MUST also clear Supabase Auth users!' as step_1,
    '⚠️  Run: node scripts/clear-all-auth-users.js' as step_2,
    '⚠️  OR delete manually in Supabase Dashboard' as step_3;

-- =====================================================
-- DONE!
-- =====================================================
SELECT 
    '🎉 DATABASE CLEARED SUCCESSFULLY!' as status,
    '✅ All users deleted from database' as users,
    '✅ All therapists deleted from database' as therapists,
    '✅ All sessions deleted' as sessions,
    '✅ All enrollments deleted' as enrollments,
    '⚠️  Remember to clear Supabase Auth users!' as next_step;

