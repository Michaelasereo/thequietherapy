-- Check Users Table Structure for Partner Onboarding
-- This script analyzes the users table to ensure it has all necessary columns for partner functionality

-- 1. Check if users table exists and get its structure
SELECT 
    'USERS TABLE EXISTS' as check_type,
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') 
        THEN '✅ Users table exists' 
        ELSE '❌ Users table does not exist' 
    END as status;

-- 2. Get current table structure
SELECT 
    'CURRENT COLUMNS' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE 
        WHEN column_name IN ('id', 'email', 'full_name', 'user_type', 'partner_id', 'created_at', 'updated_at', 'is_verified', 'is_active', 'credits', 'package_type', 'last_login_at', 'avatar_url') 
        THEN '✅ Core column'
        WHEN column_name LIKE '%partner%' OR column_name LIKE '%company%' OR column_name LIKE '%organization%'
        THEN '🔍 Partner-related column'
        ELSE '📝 Additional column'
    END as column_category
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- 3. Check for partner-specific columns that should exist
SELECT 
    'PARTNER COLUMNS CHECK' as check_type,
    'company_name' as expected_column,
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'company_name') 
        THEN '✅ Exists' 
        ELSE '❌ Missing - Needed for partner company name' 
    END as status
UNION ALL
SELECT 
    'PARTNER COLUMNS CHECK' as check_type,
    'organization_type' as expected_column,
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'organization_type') 
        THEN '✅ Exists' 
        ELSE '❌ Missing - Needed for partner organization type' 
    END as status
UNION ALL
SELECT 
    'PARTNER COLUMNS CHECK' as check_type,
    'contact_person' as expected_column,
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'contact_person') 
        THEN '✅ Exists' 
        ELSE '❌ Missing - Needed for partner contact person' 
    END as status
UNION ALL
SELECT 
    'PARTNER COLUMNS CHECK' as check_type,
    'phone' as expected_column,
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'phone') 
        THEN '✅ Exists' 
        ELSE '❌ Missing - Needed for partner phone number' 
    END as status
UNION ALL
SELECT 
    'PARTNER COLUMNS CHECK' as check_type,
    'address' as expected_column,
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'address') 
        THEN '✅ Exists' 
        ELSE '❌ Missing - Needed for partner address' 
    END as status
UNION ALL
SELECT 
    'PARTNER COLUMNS CHECK' as check_type,
    'notify_purchases' as expected_column,
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'notify_purchases') 
        THEN '✅ Exists' 
        ELSE '❌ Missing - Needed for partner purchase notifications' 
    END as status
UNION ALL
SELECT 
    'PARTNER COLUMNS CHECK' as check_type,
    'notify_usage' as expected_column,
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'notify_usage') 
        THEN '✅ Exists' 
        ELSE '❌ Missing - Needed for partner usage notifications' 
    END as status
UNION ALL
SELECT 
    'PARTNER COLUMNS CHECK' as check_type,
    'api_key' as expected_column,
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'api_key') 
        THEN '✅ Exists' 
        ELSE '❌ Missing - Needed for partner API integration' 
    END as status;

-- 4. Check user_type constraints using a different approach
SELECT 
    'USER TYPE CHECK' as check_type,
    'partner_in_user_type' as check_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM users 
            WHERE user_type = 'partner' 
            LIMIT 1
        ) 
        THEN '✅ Partner type is valid in user_type' 
        ELSE '⚠️ No partner users found - check if partner type is allowed' 
    END as status;

-- 5. Check for partner users in the system
SELECT 
    'PARTNER USERS COUNT' as check_type,
    COUNT(*) as partner_count,
    CASE 
        WHEN COUNT(*) > 0 
        THEN '✅ Partner users exist in system' 
        ELSE '⚠️ No partner users found' 
    END as status
FROM users 
WHERE user_type = 'partner';

-- 6. Check partner_id foreign key
SELECT 
    'PARTNER_ID FK CHECK' as check_type,
    'partner_id_reference' as check_name,
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
            WHERE tc.table_name = 'users' 
            AND kcu.column_name = 'partner_id'
            AND tc.constraint_type = 'FOREIGN KEY'
        ) 
        THEN '✅ partner_id has foreign key constraint' 
        ELSE '❌ partner_id missing foreign key constraint' 
    END as status;

-- 7. Check if partner_id column exists
SELECT 
    'PARTNER_ID COLUMN CHECK' as check_type,
    'partner_id_exists' as check_name,
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'partner_id') 
        THEN '✅ partner_id column exists' 
        ELSE '❌ partner_id column missing' 
    END as status;

-- 8. Summary of missing partner columns
SELECT 
    'MISSING PARTNER COLUMNS' as check_type,
    string_agg(column_name, ', ') as missing_columns,
    CASE 
        WHEN COUNT(*) = 0 
        THEN '✅ All partner columns exist' 
        ELSE '❌ Missing ' || COUNT(*) || ' partner column(s)' 
    END as status
FROM (
    SELECT 'company_name' as column_name
    UNION ALL SELECT 'organization_type'
    UNION ALL SELECT 'contact_person'
    UNION ALL SELECT 'phone'
    UNION ALL SELECT 'address'
    UNION ALL SELECT 'notify_purchases'
    UNION ALL SELECT 'notify_usage'
    UNION ALL SELECT 'api_key'
) expected_columns
WHERE NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = expected_columns.column_name
);
