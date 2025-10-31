-- =============================================
-- COMPREHENSIVE BOOKING SYSTEM DIAGNOSTIC
-- Run this to identify the exact failure point
-- =============================================

\echo '🔍 BOOKING SYSTEM DIAGNOSTIC'
\echo '=============================='
\echo ''

-- 1. Database Health Check
\echo '1️⃣  DATABASE HEALTH'
SELECT 
  NOW() as current_time,
  version() as postgres_version,
  (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') as active_connections,
  (SELECT count(*) FROM pg_stat_activity WHERE wait_event IS NOT NULL) as waiting_queries;

-- 2. Function Existence Check
\echo ''
\echo '2️⃣  FUNCTION ACCESSIBILITY'
SELECT 
  proname as function_name,
  proargnames as parameter_names,
  proargtypes::regtype[] as parameter_types,
  CASE WHEN prorettype::regtype = 'void' THEN 'void' ELSE prorettype::regtype::text END as return_type
FROM pg_proc 
WHERE proname = 'create_session_with_credit_deduction';

-- 3. Check for Blocked Queries/Locks
\echo ''
\echo '3️⃣  LOCK STATUS'
SELECT 
  blocked_pid,
  blocking_pid,
  age(clock_timestamp(), query_start) as waiting_age,
  substring(blocked_query, 1, 100) as blocked_query_snippet
FROM pg_catalog.pg_locks l
JOIN pg_catalog.pg_stat_activity a ON l.pid = a.pid
WHERE NOT granted
LIMIT 5;

-- 4. Data Integrity Checks
\echo ''
\echo '4️⃣  DATA INTEGRITY'
SELECT 
  (SELECT COUNT(*) FROM therapist_enrollments WHERE user_id IS NULL) as orphaned_therapists,
  (SELECT COUNT(*) FROM users u 
   LEFT JOIN user_credits uc ON u.id = uc.user_id 
   WHERE u.user_type IN ('user', 'individual') AND uc.id IS NULL) as users_without_credits,
  (SELECT COUNT(*) FROM sessions 
   WHERE start_time IS NULL OR end_time IS NULL) as invalid_times,
  (SELECT COUNT(*) FROM users WHERE id = '5803b951-f0b4-462c-b1d9-7bab27dfc5f7') as test_user_exists,
  (SELECT COUNT(*) FROM users WHERE id = '1229dfcb-db86-43d0-ad3b-988fcef6c2e1' AND user_type = 'therapist') as test_therapist_exists;

-- 5. Test User Credit Status
\echo ''
\echo '5️⃣  TEST USER CREDITS'
SELECT 
  u.id as user_id,
  u.email,
  u.user_type,
  u.is_verified,
  u.is_active,
  COALESCE(uc.credits_balance, 0) as current_balance,
  uc.credits_used,
  uc.id as credit_record_id
FROM users u
LEFT JOIN (
  SELECT DISTINCT ON (user_id) *
  FROM user_credits
  WHERE user_type IN ('user', 'individual')
  ORDER BY user_id, created_at DESC
) uc ON u.id = uc.user_id
WHERE u.id = '5803b951-f0b4-462c-b1d9-7bab27dfc5f7';

-- 6. Test Therapist Status
\echo ''
\echo '6️⃣  TEST THERAPIST STATUS'
SELECT 
  u.id as user_id,
  u.email,
  u.user_type,
  u.is_verified,
  u.is_active,
  te.user_id as enrollment_user_id,
  te.status as enrollment_status,
  tp.user_id as profile_user_id,
  tp.verification_status as profile_verification_status,
  tp.is_verified as profile_is_verified
FROM users u
LEFT JOIN therapist_enrollments te ON u.email = te.email OR u.id = te.user_id
LEFT JOIN therapist_profiles tp ON u.id = tp.user_id
WHERE u.id = '1229dfcb-db86-43d0-ad3b-988fcef6c2e1';

-- 7. Check Exclusion Constraint
\echo ''
\echo '7️⃣  EXCLUSION CONSTRAINT'
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conname = 'exclude_sessions_therapist_time_overlap'
  AND conrelid = 'sessions'::regclass;

-- 8. Recent Sessions for Test Therapist
\echo ''
\echo '8️⃣  RECENT SESSIONS (Test Therapist)'
SELECT 
  id,
  scheduled_date,
  scheduled_time,
  start_time,
  end_time,
  status,
  created_at
FROM sessions
WHERE therapist_id = '1229dfcb-db86-43d0-ad3b-988fcef6c2e1'
ORDER BY created_at DESC
LIMIT 5;

-- 9. Test Function Call (Dry Run - Will Fail but Shows Why)
\echo ''
\echo '9️⃣  FUNCTION DRY RUN TEST'
\echo 'Attempting to call function with test data...'
\echo '(This will likely fail, but will show the exact error)'
\echo ''

DO $$
DECLARE
  v_test_user_id UUID := '5803b951-f0b4-462c-b1d9-7bab27dfc5f7';
  v_test_therapist_id UUID := '1229dfcb-db86-43d0-ad3b-988fcef6c2e1';
  v_session_date DATE := CURRENT_DATE + 1;
  v_start_time TIME := '10:00';
  v_result RECORD;
BEGIN
  BEGIN
    SELECT * INTO v_result
    FROM create_session_with_credit_deduction(
      v_test_user_id,
      v_test_therapist_id,
      v_session_date,
      v_start_time,
      60,
      'video',
      'Diagnostic test booking'
    ) LIMIT 1;
    
    RAISE NOTICE '✅ Function call succeeded! Session ID: %', v_result.id;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING '❌ Function call failed!';
      RAISE WARNING 'Error: %', SQLERRM;
      RAISE WARNING 'SQL State: %', SQLSTATE;
      RAISE WARNING 'Error Detail: %', PG_EXCEPTION_DETAIL;
  END;
END $$;

\echo ''
\echo '✅ Diagnostic complete!'
\echo 'Check the output above to identify issues.'
\echo ''

