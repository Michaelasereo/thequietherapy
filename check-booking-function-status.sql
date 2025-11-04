-- =============================================
-- CHECK CURRENT BOOKING FUNCTION STATUS
-- =============================================
-- This will show what the current booking function looks like in the database

SELECT 
    proname as function_name,
    pg_get_functiondef(oid) as function_definition
FROM pg_proc 
WHERE proname = 'create_session_with_credit_deduction';

-- Also check if it's checking for 'individual' or 'user'
SELECT 
    'Checking for user_type references...' as check_type,
    CASE 
        WHEN pg_get_functiondef(oid) LIKE '%user_type IN%individual%' THEN '⚠️ OLD VERSION - Checks for individual'
        WHEN pg_get_functiondef(oid) LIKE '%user_type = ''user''%' THEN '✅ NEW VERSION - Only checks user'
        ELSE '❓ UNKNOWN VERSION'
    END as version_status
FROM pg_proc 
WHERE proname = 'create_session_with_credit_deduction';

