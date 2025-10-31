-- =============================================
-- PRE-LAUNCH BOOKING VERIFICATION
-- Run this to verify everything is ready
-- =============================================

-- 1. Check sessions table has ALL required columns
SELECT 
    'SESSIONS COLUMNS CHECK' as check_name,
    column_name,
    CASE 
        WHEN column_name IN ('id', 'user_id', 'therapist_id', 'title', 'description', 
                              'scheduled_date', 'scheduled_time', 'start_time', 'end_time', 
                              'duration_minutes', 'session_type', 'status', 'created_at', 'updated_at')
        THEN '✅ REQUIRED'
        ELSE '⚠️  OPTIONAL'
    END as status
FROM information_schema.columns
WHERE table_name = 'sessions'
ORDER BY 
    CASE WHEN column_name IN ('id', 'user_id', 'therapist_id', 'title', 'description', 
                              'scheduled_date', 'scheduled_time', 'start_time', 'end_time', 
                              'duration_minutes', 'session_type', 'status', 'created_at', 'updated_at')
         THEN 0 ELSE 1 END,
    ordinal_position;

-- 2. Check if all required columns exist
SELECT 
    'MISSING COLUMNS CHECK' as check_name,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'title') THEN '❌ title MISSING'
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'description') THEN '❌ description MISSING'
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'scheduled_date') THEN '❌ scheduled_date MISSING'
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'scheduled_time') THEN '❌ scheduled_time MISSING'
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'start_time') THEN '❌ start_time MISSING'
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'end_time') THEN '❌ end_time MISSING'
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'duration_minutes') THEN '❌ duration_minutes MISSING'
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'session_type') THEN '❌ session_type MISSING'
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'status') THEN '❌ status MISSING'
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'created_at') THEN '❌ created_at MISSING'
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'updated_at') THEN '❌ updated_at MISSING'
        ELSE '✅ ALL REQUIRED COLUMNS EXIST'
    END as status;

-- 3. Check booking function exists
SELECT 
    'FUNCTION CHECK' as check_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'create_session_with_credit_deduction')
        THEN '✅ Booking function exists'
        ELSE '❌ Booking function MISSING - Run redeploy-booking-function.sql'
    END as status;

-- 4. Check conflict function exists
SELECT 
    'CONFLICT FUNCTION CHECK' as check_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'check_booking_conflict')
        THEN '✅ Conflict check function exists'
        ELSE '❌ Conflict check function MISSING'
    END as status;

-- 5. Check user_credits table exists and has required columns
SELECT 
    'USER_CREDITS CHECK' as check_name,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_credits')
        THEN '❌ user_credits table MISSING'
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_credits' AND column_name = 'credits_balance')
        THEN '❌ credits_balance column MISSING'
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_credits' AND column_name = 'credits_used')
        THEN '❌ credits_used column MISSING'
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_credits' AND column_name = 'user_type')
        THEN '❌ user_type column MISSING'
        ELSE '✅ user_credits table ready'
    END as status;

-- 6. Check foreign keys
SELECT 
    'FOREIGN KEYS CHECK' as check_name,
    conname as constraint_name,
    CASE 
        WHEN confrelid::regclass::text = 'users' THEN '✅ Valid FK to users'
        ELSE '⚠️  Other FK'
    END as status
FROM pg_constraint
WHERE conrelid = 'sessions'::regclass
AND contype = 'f'
ORDER BY conname;

-- 7. Final summary
SELECT 
    '📋 SUMMARY' as check_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'title')
         AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'description')
         AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'scheduled_date')
         AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'scheduled_time')
         AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'start_time')
         AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'end_time')
         AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'duration_minutes')
         AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'session_type')
         AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'status')
         AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'created_at')
         AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'updated_at')
         AND EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'create_session_with_credit_deduction')
         AND EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'check_booking_conflict')
         AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_credits')
        THEN '✅ READY FOR LAUNCH - All required components exist!'
        ELSE '❌ NOT READY - Missing components. Run complete-booking-setup.sql first.'
    END as status;

