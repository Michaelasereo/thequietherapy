-- Debug Partner Account Creation
-- This script helps identify why partner account creation is failing

-- 1. Check if all partner columns exist
SELECT 
    'MISSING PARTNER COLUMNS' as debug_type,
    column_name,
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = expected_columns.column_name) 
        THEN '✅ Exists' 
        ELSE '❌ Missing' 
    END as status
FROM (
    SELECT 'company_name' as column_name
    UNION ALL SELECT 'organization_type'
    UNION ALL SELECT 'contact_person'
    UNION ALL SELECT 'phone'
    UNION ALL SELECT 'address'
    UNION ALL SELECT 'notify_purchases'
    UNION ALL SELECT 'notify_usage'
    UNION ALL SELECT 'partner_credits'
    UNION ALL SELECT 'partner_status'
) expected_columns
WHERE NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = expected_columns.column_name
);

-- 2. Check user_type constraint
SELECT 
    'USER TYPE CONSTRAINT' as debug_type,
    'partner_type_allowed' as check_name,
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.check_constraints 
            WHERE constraint_name LIKE '%user_type%'
        ) 
        THEN '✅ user_type constraint exists'
        ELSE '⚠️ No user_type constraint found'
    END as status;

-- 3. Check for existing users with same email
SELECT 
    'EXISTING USER CHECK' as debug_type,
    COUNT(*) as existing_users,
    CASE 
        WHEN COUNT(*) > 0 
        THEN '❌ Users with test email already exist'
        ELSE '✅ No existing users with test email'
    END as status
FROM users 
WHERE email = 'test-partner@example.com';

-- 4. Test the exact insert operation that's failing
DO $$
DECLARE
    test_user_id UUID;
    test_email VARCHAR(255) := 'test-partner@example.com';
    insert_error TEXT;
BEGIN
    -- Clean up any existing test user
    DELETE FROM users WHERE email = test_email;
    
    -- Try the exact insert operation from the action
    BEGIN
        INSERT INTO users (
            email, 
            full_name, 
            user_type, 
            is_verified, 
            is_active, 
            credits, 
            package_type,
            company_name,
            organization_type,
            contact_person,
            phone,
            address,
            notify_purchases,
            notify_usage,
            partner_credits,
            partner_status
        ) VALUES (
            test_email,
            'Test Partner Contact',
            'partner',
            false,
            true,
            0,
            'Partner',
            'Test Organization',
            'Corporate HR',
            'Test Partner Contact',
            '+234123456789',
            '',
            true,
            true,
            0,
            'pending'
        ) RETURNING id INTO test_user_id;
        
        RAISE NOTICE '✅ Test insert successful! User ID: %', test_user_id;
        
        -- Clean up
        DELETE FROM users WHERE id = test_user_id;
        
    EXCEPTION
        WHEN OTHERS THEN
            insert_error := SQLERRM;
            RAISE NOTICE '❌ Insert failed with error: %', insert_error;
            
            -- Try to identify the specific issue
            IF insert_error LIKE '%column%does not exist%' THEN
                RAISE NOTICE '🔍 Issue: Column does not exist - run add-partner-columns script';
            ELSIF insert_error LIKE '%constraint%' THEN
                RAISE NOTICE '🔍 Issue: Constraint violation - check user_type or unique constraints';
            ELSIF insert_error LIKE '%type%' THEN
                RAISE NOTICE '🔍 Issue: Data type mismatch - check column types';
            ELSE
                RAISE NOTICE '🔍 Issue: Unknown error - check logs for details';
            END IF;
    END;
    
END $$;

-- 5. Check table structure for any issues
SELECT 
    'TABLE STRUCTURE' as debug_type,
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE 
        WHEN column_name IN ('company_name', 'organization_type', 'contact_person', 'phone', 'address', 'notify_purchases', 'notify_usage', 'partner_credits', 'partner_status')
        THEN '🔍 Partner column'
        ELSE '📝 Other column'
    END as column_type
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('email', 'full_name', 'user_type', 'is_verified', 'is_active', 'credits', 'package_type', 'company_name', 'organization_type', 'contact_person', 'phone', 'address', 'notify_purchases', 'notify_usage', 'partner_credits', 'partner_status')
ORDER BY ordinal_position;

-- 6. Check for any triggers that might be interfering
SELECT 
    'TRIGGERS' as debug_type,
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users';
