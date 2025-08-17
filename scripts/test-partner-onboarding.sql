-- Test Partner Onboarding Flow
-- This script tests if partner onboarding will work correctly

-- 1. Check if all required partner columns exist
SELECT 
    'PARTNER COLUMNS READY' as test_type,
    COUNT(*) as existing_columns,
    CASE 
        WHEN COUNT(*) >= 10 
        THEN '✅ All partner columns exist - Onboarding should work!' 
        ELSE '❌ Missing partner columns - Onboarding may fail' 
    END as status
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN (
    'company_name', 'organization_type', 'contact_person', 'phone', 
    'address', 'notify_purchases', 'notify_usage', 'api_key', 
    'partner_credits', 'partner_status'
);

-- 2. Test creating a partner user with all required data
DO $$
DECLARE
    test_user_id UUID;
    test_email VARCHAR(255) := 'test-partner@example.com';
BEGIN
    -- Clean up any existing test user
    DELETE FROM users WHERE email = test_email;
    
    -- Insert test partner user with all partner data
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
        'Test Address',
        true,
        true,
        0,
        'pending'
    ) RETURNING id INTO test_user_id;
    
    RAISE NOTICE '✅ Test partner user created successfully with ID: %', test_user_id;
    
    -- Verify the user was created with all partner data
    SELECT 
        'TEST PARTNER USER' as test_type,
        email,
        full_name,
        user_type,
        company_name,
        organization_type,
        contact_person,
        phone,
        partner_status,
        CASE 
            WHEN company_name IS NOT NULL 
            AND organization_type IS NOT NULL 
            AND contact_person IS NOT NULL 
            AND phone IS NOT NULL
            THEN '✅ All partner data saved correctly'
            ELSE '❌ Some partner data missing'
        END as data_status
    FROM users 
    WHERE id = test_user_id;
    
    -- Clean up test user
    DELETE FROM users WHERE id = test_user_id;
    RAISE NOTICE '🧹 Test user cleaned up';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error creating test partner user: %', SQLERRM;
        -- Clean up on error
        DELETE FROM users WHERE email = test_email;
END $$;

-- 3. Check if magic_links table supports partner auth_type
SELECT 
    'MAGIC LINKS PARTNER SUPPORT' as test_type,
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'magic_links' 
            AND column_name = 'auth_type'
        ) 
        THEN '✅ Magic links support auth_type for partner onboarding'
        ELSE '❌ Magic links missing auth_type column'
    END as status;

-- 4. Check if partner_auth table exists (if using separate auth tables)
SELECT 
    'PARTNER AUTH TABLE' as test_type,
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'partner_auth') 
        THEN '✅ Partner auth table exists'
        ELSE '⚠️ Partner auth table not found (using main users table)'
    END as status;

-- 5. Summary of partner onboarding readiness
SELECT 
    'PARTNER ONBOARDING READINESS' as test_type,
    CASE 
        WHEN (
            SELECT COUNT(*) FROM information_schema.columns 
            WHERE table_name = 'users' 
            AND column_name IN ('company_name', 'organization_type', 'contact_person', 'phone')
        ) >= 4
        AND EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'magic_links' 
            AND column_name = 'auth_type'
        )
        THEN '🎉 Partner onboarding should work perfectly!'
        ELSE '⚠️ Partner onboarding may have issues - check above results'
    END as overall_status;
