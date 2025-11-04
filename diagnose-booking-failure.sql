-- =============================================
-- DIAGNOSE BOOKING FAILURE
-- Run this to check what might be causing booking to fail
-- =============================================

-- Step 1: Check if booking function exists
SELECT 
    '🔍 Checking booking function...' as step,
    proname as function_name,
    prosrc as function_source
FROM pg_proc 
WHERE proname = 'create_session_with_credit_deduction';

-- Step 2: Check user credits for test user (obgynect@gmail.com)
SELECT 
    '📊 Checking user credits...' as step,
    u.email,
    u.id as user_id,
    uc.id as credit_id,
    uc.user_type,
    uc.credits_balance,
    uc.credits_purchased,
    uc.credits_used,
    uc.created_at
FROM users u
LEFT JOIN user_credits uc ON u.id = uc.user_id
WHERE u.email = 'obgynect@gmail.com'
ORDER BY uc.created_at DESC;

-- Step 3: Check if therapist enrollment exists and is approved
SELECT 
    '👨‍⚕️ Checking therapist enrollments...' as step,
    te.email,
    te.status,
    te.is_active,
    te.is_verified,
    u.id as user_id,
    u.user_type,
    u.is_active as user_is_active,
    u.is_verified as user_is_verified
FROM therapist_enrollments te
JOIN users u ON te.email = u.email
WHERE u.user_type = 'therapist'
  AND u.is_active = true
LIMIT 5;

-- Step 4: Test credit check query (what the booking function uses)
SELECT 
    '🧪 Testing credit check query...' as step,
    uc.credits_balance,
    uc.credits_used,
    uc.user_type
FROM user_credits uc
WHERE uc.user_id = (SELECT id FROM users WHERE email = 'obgynect@gmail.com')
  AND uc.user_type IN ('user', 'individual')
ORDER BY uc.created_at DESC
LIMIT 1;

-- Step 5: Check for any booking conflicts (sessions table)
SELECT 
    '📅 Checking existing sessions...' as step,
    COUNT(*) as total_sessions,
    COUNT(CASE WHEN status = 'scheduled' THEN 1 END) as scheduled_sessions,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_sessions,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_sessions
FROM sessions
WHERE user_id = (SELECT id FROM users WHERE email = 'obgynect@gmail.com');

-- Step 6: Check sessions table structure
SELECT 
    '🗂️ Checking sessions table columns...' as step,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'sessions'
ORDER BY ordinal_position;

-- Step 7: Check user_credits table structure  
SELECT 
    '💰 Checking user_credits table columns...' as step,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'user_credits'
ORDER BY ordinal_position;

-- Step 8: Check for any constraints that might be blocking
SELECT 
    '🔒 Checking constraints...' as step,
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'sessions'::regclass
  OR conrelid = 'user_credits'::regclass;

SELECT '✅ Diagnosis complete! Review the results above.' as result;

