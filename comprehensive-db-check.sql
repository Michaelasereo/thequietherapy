-- =============================================
-- COMPREHENSIVE DATABASE CHECK BEFORE LAUNCH
-- Run this to find ALL issues at once
-- =============================================

-- 1. Check function exists and signature matches
\echo '1️⃣  FUNCTION CHECK'
SELECT 
    proname as function_name,
    pg_get_function_arguments(oid) as arguments,
    pg_get_function_result(oid) as return_type
FROM pg_proc
WHERE proname = 'create_session_with_credit_deduction';

-- 2. Check sessions table schema (all columns and types)
\echo ''
\echo '2️⃣  SESSIONS TABLE SCHEMA'
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'sessions'
ORDER BY ordinal_position;

-- 3. Check foreign keys
\echo ''
\echo '3️⃣  FOREIGN KEY CONSTRAINTS'
SELECT 
    conname as constraint_name,
    conrelid::regclass as table_name,
    confrelid::regclass as references_table,
    a.attname as column_name,
    af.attname as referenced_column
FROM pg_constraint c
JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
JOIN pg_attribute af ON af.attrelid = c.confrelid AND af.attnum = ANY(c.confkey)
WHERE conrelid = 'sessions'::regclass
AND contype = 'f';

-- 4. Check exclusion constraint
\echo ''
\echo '4️⃣  EXCLUSION CONSTRAINT'
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'sessions'::regclass
AND contype = 'x';

-- 5. Check for orphaned sessions
\echo ''
\echo '5️⃣  ORPHANED SESSIONS CHECK'
SELECT 
    COUNT(*) as orphaned_sessions,
    COUNT(DISTINCT therapist_id) as orphaned_therapists
FROM sessions s
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = s.therapist_id)
OR NOT EXISTS (SELECT 1 FROM users u WHERE u.id = s.user_id);

-- 6. Check user credits
\echo ''
\echo '6️⃣  USER CREDITS CHECK'
SELECT 
    u.id,
    u.email,
    COALESCE(uc.credits_balance, 0) as credits_balance,
    uc.id as credit_record_id
FROM users u
LEFT JOIN LATERAL (
    SELECT * FROM user_credits 
    WHERE user_id = u.id 
    AND user_type IN ('user', 'individual')
    ORDER BY created_at DESC
    LIMIT 1
) uc ON true
WHERE u.id = '5ee47a33-6e45-4fe6-a84e-ffe102c40e67';

-- 7. Check therapist status
\echo ''
\echo '7️⃣  THERAPIST STATUS CHECK'
SELECT 
    u.id,
    u.email,
    u.user_type,
    u.is_verified,
    u.is_active,
    tp.verification_status,
    tp.is_verified as profile_verified
FROM users u
LEFT JOIN therapist_profiles tp ON tp.user_id = u.id
WHERE u.id = '1229dfcb-db86-43d0-ad3b-988fcef6c2e1';

-- 8. Test function call with type checking
\echo ''
\echo '8️⃣  FUNCTION CALL TEST'
DO $$
DECLARE
    v_result RECORD;
    v_error_text TEXT;
BEGIN
    BEGIN
        SELECT * INTO v_result
        FROM create_session_with_credit_deduction(
            '5ee47a33-6e45-4fe6-a84e-ffe102c40e67'::UUID,
            '1229dfcb-db86-43d0-ad3b-988fcef6c2e1'::UUID,
            (CURRENT_DATE + 1)::DATE,
            '16:00'::TIME,
            60,
            'video'::VARCHAR,
            'Diagnostic test'::TEXT,
            'Test'::TEXT
        ) LIMIT 1;
        
        RAISE NOTICE '✅ Function call successful!';
        RAISE NOTICE 'Session ID: %', v_result.id;
        
    EXCEPTION WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS v_error_text = MESSAGE_TEXT;
        RAISE WARNING '❌ Function call failed!';
        RAISE WARNING 'Error: %', v_error_text;
        RAISE WARNING 'SQLSTATE: %', SQLSTATE;
        RAISE WARNING 'SQLERRM: %', SQLERRM;
    END;
END $$;

-- 9. Check column type mismatches
\echo ''
\echo '9️⃣  COLUMN TYPE CHECK'
SELECT 
    'title' as column_name,
    (SELECT data_type FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'title') as table_type,
    'VARCHAR(255)' as expected_type,
    CASE WHEN (SELECT data_type FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'title') != 'character varying' THEN 'MISMATCH' ELSE 'OK' END as status
UNION ALL
SELECT 
    'created_at',
    (SELECT data_type FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'created_at'),
    'TIMESTAMP WITH TIME ZONE',
    CASE WHEN (SELECT data_type FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'created_at') != 'timestamp with time zone' THEN 'MISMATCH' ELSE 'OK' END;

\echo ''
\echo '✅ Comprehensive check complete!'

