-- Check Partner Approval Status
-- This script helps understand the partner approval process and why partners might be failing

-- 1. Check current partner users and their status
SELECT 
    'PARTNER USERS STATUS' as check_type,
    email,
    full_name,
    user_type,
    is_verified,
    is_active,
    partner_status,
    created_at,
    CASE 
        WHEN partner_status = 'pending' THEN '⚠️ Awaiting admin approval'
        WHEN partner_status = 'active' THEN '✅ Approved and active'
        WHEN partner_status = 'suspended' THEN '❌ Suspended'
        ELSE '❓ Unknown status'
    END as status_description
FROM users 
WHERE user_type = 'partner'
ORDER BY created_at DESC;

-- 2. Check if there are any pending partners
SELECT 
    'PENDING PARTNERS' as check_type,
    COUNT(*) as pending_count,
    CASE 
        WHEN COUNT(*) > 0 
        THEN '⚠️ ' || COUNT(*) || ' partners awaiting approval'
        ELSE '✅ No pending partners'
    END as status
FROM users 
WHERE user_type = 'partner' AND partner_status = 'pending';

-- 3. Check if there are any active partners
SELECT 
    'ACTIVE PARTNERS' as check_type,
    COUNT(*) as active_count,
    CASE 
        WHEN COUNT(*) > 0 
        THEN '✅ ' || COUNT(*) || ' active partners'
        ELSE '⚠️ No active partners'
    END as status
FROM users 
WHERE user_type = 'partner' AND partner_status = 'active';

-- 4. Check partner_status column constraints
SELECT 
    'PARTNER STATUS CONSTRAINT' as check_type,
    'status_values' as check_name,
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.check_constraints 
            WHERE constraint_name LIKE '%partner_status%'
        ) 
        THEN '✅ partner_status constraint exists'
        ELSE '⚠️ No partner_status constraint found'
    END as status;

-- 5. Test updating a partner status to active
DO $$
DECLARE
    test_partner_id UUID;
    test_email VARCHAR(255) := 'test-partner-approval@example.com';
BEGIN
    -- Clean up any existing test partner
    DELETE FROM users WHERE email = test_email;
    
    -- Create a test partner with pending status
    INSERT INTO users (
        email,
        full_name,
        user_type,
        is_verified,
        is_active,
        partner_status,
        company_name,
        organization_type,
        contact_person,
        phone
    ) VALUES (
        test_email,
        'Test Partner Approval',
        'partner',
        true,
        true,
        'pending',
        'Test Company',
        'Corporate HR',
        'Test Contact',
        '+234123456789'
    ) RETURNING id INTO test_partner_id;
    
    RAISE NOTICE '✅ Test partner created with pending status: %', test_partner_id;
    
    -- Try to update to active status
    UPDATE users 
    SET partner_status = 'active', updated_at = NOW()
    WHERE id = test_partner_id;
    
    IF FOUND THEN
        RAISE NOTICE '✅ Successfully updated partner status to active';
    ELSE
        RAISE NOTICE '❌ Failed to update partner status';
    END IF;
    
    -- Verify the update
    SELECT 
        'TEST PARTNER UPDATE' as test_type,
        email,
        partner_status,
        CASE 
            WHEN partner_status = 'active' 
            THEN '✅ Successfully approved'
            ELSE '❌ Still pending'
        END as approval_status
    FROM users 
    WHERE id = test_partner_id;
    
    -- Clean up
    DELETE FROM users WHERE id = test_partner_id;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error in partner approval test: %', SQLERRM;
        -- Clean up on error
        DELETE FROM users WHERE email = test_email;
END $$;

-- 6. Summary of partner approval system
SELECT 
    'PARTNER APPROVAL SYSTEM' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT FROM users WHERE user_type = 'partner' AND partner_status = 'pending'
        )
        AND EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'partner_status'
        )
        THEN '🎯 Partner approval system is working - partners need admin approval'
        ELSE '⚠️ Partner approval system may have issues'
    END as overall_status;
