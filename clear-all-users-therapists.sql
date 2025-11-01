-- =============================================
-- CLEAR ALL USERS AND THERAPISTS
-- Start Fresh - Clean Database
-- =============================================
-- ⚠️  WARNING: This will DELETE ALL users, therapists, and related data
-- ⚠️  This action is IRREVERSIBLE
-- ⚠️  Make sure you have a backup if needed
-- =============================================

-- Step 1: Show what will be deleted (for verification)
SELECT '📊 PRE-DELETION SUMMARY:' as info;

-- Show counts for main tables (only queries tables that exist)
SELECT 
    'users' as table_name, 
    COUNT(*) as records,
    COUNT(*) FILTER (WHERE user_type = 'therapist') as therapists,
    COUNT(*) FILTER (WHERE user_type = 'individual') as users,
    COUNT(*) FILTER (WHERE user_type = 'admin') as admins
FROM users;

-- =============================================
-- STEP 2: Delete child tables first (respects foreign keys)
-- Only deletes from tables that exist
-- =============================================

DO $$
BEGIN
    -- Session-related data (must be deleted first)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'session_notes') THEN
        DELETE FROM session_notes;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'session_feedback') THEN
        DELETE FROM session_feedback;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sessions') THEN
        DELETE FROM sessions;
    END IF;
    
    -- Therapist-related data
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'therapist_availability') THEN
        DELETE FROM therapist_availability;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'therapist_time_slots') THEN
        DELETE FROM therapist_time_slots;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'availability_weekly_schedules') THEN
        DELETE FROM availability_weekly_schedules;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'therapist_profiles') THEN
        DELETE FROM therapist_profiles;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'therapist_enrollments') THEN
        DELETE FROM therapist_enrollments;
    END IF;
    
    -- Authentication and session management
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_sessions') THEN
        DELETE FROM user_sessions;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'magic_links') THEN
        DELETE FROM magic_links;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'verification_tokens') THEN
        DELETE FROM verification_tokens;
    END IF;
    
    -- Credits and purchases (if they exist)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_session_credits') THEN
        DELETE FROM user_session_credits;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_purchases') THEN
        DELETE FROM user_purchases;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'credit_transactions') THEN
        DELETE FROM credit_transactions;
    END IF;
    
    -- Partner-related (if exists)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'partner_members') THEN
        DELETE FROM partner_members;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'partner_credits') THEN
        DELETE FROM partner_credits;
    END IF;
END $$;

-- =============================================
-- STEP 3: Delete all users (parent table)
-- This will cascade to any remaining foreign key references
-- =============================================
DELETE FROM users;

-- =============================================
-- STEP 4: Verification - Confirm everything is cleared
-- =============================================
SELECT '✅ DELETION COMPLETE - Verification:' as status;

-- Check users table (always exists)
SELECT 
    'users' as table_name,
    COUNT(*) as remaining_records,
    CASE WHEN COUNT(*) = 0 THEN '✅ Cleared' ELSE '❌ Has ' || COUNT(*) || ' records' END as status
FROM users;

-- Check other tables if they exist (using DO block to avoid errors)
DO $$
DECLARE
    verify_result TEXT := '';
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

-- =============================================
-- IMPORTANT: Supabase Auth Users
-- =============================================
SELECT 
    '⚠️  MANUAL STEP REQUIRED:' as warning,
    'Go to Supabase Dashboard > Authentication > Users' as step_1,
    'Select all users and delete them manually' as step_2,
    'This will clear the auth.users table' as step_3;

-- =============================================
-- DONE!
-- =============================================
SELECT 
    '🎉 DATABASE CLEARED SUCCESSFULLY!' as status,
    '✅ All users deleted' as users,
    '✅ All therapists deleted' as therapists,
    '✅ All sessions deleted' as sessions,
    '✅ All enrollments deleted' as enrollments,
    '✅ Ready for fresh start!' as next_step;

