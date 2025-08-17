-- Test Partner Verification Flow
-- This script tests if partner verification will work correctly

-- 1. Check if magic_links table supports partner auth_type
SELECT 
    'MAGIC LINKS PARTNER SUPPORT' as test_type,
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'magic_links' 
            AND column_name = 'auth_type'
        ) 
        THEN '✅ Magic links support auth_type for partner verification'
        ELSE '❌ Magic links missing auth_type column'
    END as status;

-- 2. Check if there are any partner magic links
SELECT 
    'PARTNER MAGIC LINKS' as test_type,
    COUNT(*) as partner_links,
    CASE 
        WHEN COUNT(*) > 0 
        THEN '✅ Partner magic links exist'
        ELSE '⚠️ No partner magic links found'
    END as status
FROM magic_links 
WHERE auth_type = 'partner';

-- 3. Check partner users in the system
SELECT 
    'PARTNER USERS' as test_type,
    COUNT(*) as partner_users,
    CASE 
        WHEN COUNT(*) > 0 
        THEN '✅ Partner users exist in system'
        ELSE '⚠️ No partner users found'
    END as status
FROM users 
WHERE user_type = 'partner';

-- 4. Check partner users verification status
SELECT 
    'PARTNER VERIFICATION STATUS' as test_type,
    is_verified,
    COUNT(*) as count,
    CASE 
        WHEN is_verified = true 
        THEN '✅ Verified partners'
        ELSE '⚠️ Unverified partners'
    END as status
FROM users 
WHERE user_type = 'partner'
GROUP BY is_verified;

-- 5. Test creating a partner magic link
DO $$
DECLARE
    test_email VARCHAR(255) := 'test-partner-verify@example.com';
    test_token VARCHAR(255) := 'test-token-' || gen_random_uuid();
    magic_link_id UUID;
BEGIN
    -- Clean up any existing test data
    DELETE FROM magic_links WHERE email = test_email;
    DELETE FROM users WHERE email = test_email;
    
    -- Create a test partner user
    INSERT INTO users (
        email,
        full_name,
        user_type,
        is_verified,
        is_active,
        company_name,
        organization_type,
        contact_person,
        phone
    ) VALUES (
        test_email,
        'Test Partner',
        'partner',
        false,
        true,
        'Test Company',
        'Corporate HR',
        'Test Contact',
        '+234123456789'
    );
    
    -- Create a test magic link for partner
    INSERT INTO magic_links (
        email,
        token,
        type,
        auth_type,
        expires_at,
        metadata
    ) VALUES (
        test_email,
        test_token,
        'signup',
        'partner',
        (NOW() + INTERVAL '24 hours'),
        '{"user_type": "partner", "organization_name": "Test Company"}'
    ) RETURNING id INTO magic_link_id;
    
    RAISE NOTICE '✅ Test partner magic link created with ID: %', magic_link_id;
    
    -- Verify the magic link exists
    IF EXISTS (SELECT FROM magic_links WHERE id = magic_link_id AND auth_type = 'partner') THEN
        RAISE NOTICE '✅ Magic link verification test passed';
    ELSE
        RAISE NOTICE '❌ Magic link verification test failed';
    END IF;
    
    -- Clean up
    DELETE FROM magic_links WHERE id = magic_link_id;
    DELETE FROM users WHERE email = test_email;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error in partner verification test: %', SQLERRM;
        -- Clean up on error
        DELETE FROM magic_links WHERE email = test_email;
        DELETE FROM users WHERE email = test_email;
END $$;

-- 6. Summary of partner verification readiness
SELECT 
    'PARTNER VERIFICATION READINESS' as test_type,
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'magic_links' 
            AND column_name = 'auth_type'
        )
        AND EXISTS (
            SELECT FROM users WHERE user_type = 'partner'
        )
        THEN '🎉 Partner verification should work correctly!'
        ELSE '⚠️ Partner verification may have issues - check above results'
    END as overall_status;
