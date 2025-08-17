-- Test script to verify separate authentication system setup
-- Run this to check if everything was created successfully

-- 1. Check if all tables exist
SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('individual_auth', 'therapist_auth', 'partner_auth') THEN 'Auth Tables'
        WHEN table_name IN ('individual_sessions', 'therapist_sessions', 'partner_sessions') THEN 'Session Tables'
        ELSE 'Other'
    END as table_type
FROM information_schema.tables 
WHERE table_name IN (
    'individual_auth', 'therapist_auth', 'partner_auth',
    'individual_sessions', 'therapist_sessions', 'partner_sessions'
)
AND table_schema = 'public'
ORDER BY table_type, table_name;

-- 2. Check if all functions exist
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name IN (
    'get_available_auth_types',
    'add_auth_type', 
    'validate_auth_session'
)
AND routine_schema = 'public'
ORDER BY routine_name;

-- 3. Check if all indexes exist
SELECT 
    indexname,
    tablename
FROM pg_indexes 
WHERE indexname IN (
    'idx_individual_auth_email', 'idx_individual_auth_user_id',
    'idx_therapist_auth_email', 'idx_therapist_auth_user_id', 
    'idx_partner_auth_email', 'idx_partner_auth_user_id',
    'idx_individual_sessions_token', 'idx_individual_sessions_user_id', 'idx_individual_sessions_expires',
    'idx_therapist_sessions_token', 'idx_therapist_sessions_user_id', 'idx_therapist_sessions_expires',
    'idx_partner_sessions_token', 'idx_partner_sessions_user_id', 'idx_partner_sessions_expires'
)
ORDER BY tablename, indexname;

-- 4. Check if views exist
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name IN (
    'individual_users_view',
    'therapist_users_view'
)
AND table_schema = 'public'
ORDER BY table_name;

-- 5. Test the get_available_auth_types function (if you have test data)
-- This will show what auth types are available for a specific email
-- Replace 'test@example.com' with an email that exists in your system
SELECT * FROM get_available_auth_types('test@example.com');

-- 6. Check table structure for individual_auth
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'individual_auth' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 7. Check table structure for therapist_auth
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'therapist_auth' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 8. Check table structure for partner_auth
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'partner_auth' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 9. Check if magic_links table has the auth_type column
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'magic_links' 
AND column_name = 'auth_type'
AND table_schema = 'public';

-- 10. Summary report
SELECT 
    'Tables Created' as check_type,
    COUNT(*) as count,
    STRING_AGG(table_name, ', ') as items
FROM information_schema.tables 
WHERE table_name IN (
    'individual_auth', 'therapist_auth', 'partner_auth',
    'individual_sessions', 'therapist_sessions', 'partner_sessions'
)
AND table_schema = 'public'

UNION ALL

SELECT 
    'Functions Created' as check_type,
    COUNT(*) as count,
    STRING_AGG(routine_name, ', ') as items
FROM information_schema.routines 
WHERE routine_name IN (
    'get_available_auth_types',
    'add_auth_type', 
    'validate_auth_session'
)
AND routine_schema = 'public'

UNION ALL

SELECT 
    'Views Created' as check_type,
    COUNT(*) as count,
    STRING_AGG(table_name, ', ') as items
FROM information_schema.tables 
WHERE table_name IN (
    'individual_users_view',
    'therapist_users_view'
)
AND table_schema = 'public';
