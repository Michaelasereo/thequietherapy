-- Setup Temporary Partner Approval System
-- This script sets up the system where partners get temporary access immediately

-- 1. Add temporary_approval column to track temporary vs final approval
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'temporary_approval') THEN
        ALTER TABLE users ADD COLUMN temporary_approval BOOLEAN DEFAULT false;
        RAISE NOTICE '✅ Added temporary_approval column';
    ELSE
        RAISE NOTICE '⚠️ temporary_approval column already exists';
    END IF;
END $$;

-- 2. Add approval_date column to track when partner was approved
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'approval_date') THEN
        ALTER TABLE users ADD COLUMN approval_date TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE '✅ Added approval_date column';
    ELSE
        RAISE NOTICE '⚠️ approval_date column already exists';
    END IF;
END $$;

-- 3. Update existing partners to have temporary approval
UPDATE users 
SET 
    temporary_approval = true,
    partner_status = 'temporary',
    approval_date = NOW()
WHERE user_type = 'partner' AND partner_status = 'pending';

-- 4. Show current partner status
SELECT 
    'CURRENT PARTNER STATUS' as check_type,
    email,
    full_name,
    company_name,
    partner_status,
    temporary_approval,
    is_verified,
    approval_date,
    CASE 
        WHEN temporary_approval = true AND partner_status = 'temporary' 
        THEN '✅ Temporarily approved - can access dashboard with limited features'
        WHEN partner_status = 'active' 
        THEN '🎉 Fully approved - full dashboard access'
        WHEN partner_status = 'pending' 
        THEN '⚠️ Pending - no access yet'
        ELSE '❓ Unknown status'
    END as access_level
FROM users 
WHERE user_type = 'partner'
ORDER BY created_at DESC;

-- 5. Create function to grant temporary approval
CREATE OR REPLACE FUNCTION grant_temporary_partner_approval(partner_email TEXT)
RETURNS TEXT AS $$
DECLARE
    partner_id UUID;
    update_count INTEGER;
BEGIN
    -- Find the partner
    SELECT id INTO partner_id
    FROM users 
    WHERE email = partner_email AND user_type = 'partner';
    
    IF partner_id IS NULL THEN
        RETURN '❌ Partner not found: ' || partner_email;
    END IF;
    
    -- Grant temporary approval
    UPDATE users 
    SET 
        temporary_approval = true,
        partner_status = 'temporary',
        approval_date = NOW(),
        updated_at = NOW()
    WHERE id = partner_id;
    
    GET DIAGNOSTICS update_count = ROW_COUNT;
    
    IF update_count > 0 THEN
        RETURN '✅ Temporary approval granted to: ' || partner_email;
    ELSE
        RETURN '❌ Failed to grant temporary approval to: ' || partner_email;
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN '❌ Error granting temporary approval: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- 6. Create function to grant final approval
CREATE OR REPLACE FUNCTION grant_final_partner_approval(partner_email TEXT)
RETURNS TEXT AS $$
DECLARE
    partner_id UUID;
    update_count INTEGER;
BEGIN
    -- Find the partner
    SELECT id INTO partner_id
    FROM users 
    WHERE email = partner_email AND user_type = 'partner';
    
    IF partner_id IS NULL THEN
        RETURN '❌ Partner not found: ' || partner_email;
    END IF;
    
    -- Grant final approval
    UPDATE users 
    SET 
        partner_status = 'active',
        approval_date = NOW(),
        updated_at = NOW()
    WHERE id = partner_id;
    
    GET DIAGNOSTICS update_count = ROW_COUNT;
    
    IF update_count > 0 THEN
        RETURN '🎉 Final approval granted to: ' || partner_email;
    ELSE
        RETURN '❌ Failed to grant final approval to: ' || partner_email;
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN '❌ Error granting final approval: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- 7. Test the temporary approval system
DO $$
DECLARE
    test_email VARCHAR(255) := 'test-temp-approval@example.com';
    result TEXT;
BEGIN
    -- Clean up any existing test partner
    DELETE FROM users WHERE email = test_email;
    
    -- Create a test partner
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
        'Test Temp Approval',
        'partner',
        true,
        true,
        'pending',
        'Test Company',
        'Corporate HR',
        'Test Contact',
        '+234123456789'
    );
    
    RAISE NOTICE '✅ Test partner created';
    
    -- Test temporary approval
    SELECT grant_temporary_partner_approval(test_email) INTO result;
    RAISE NOTICE '%', result;
    
    -- Test final approval
    SELECT grant_final_partner_approval(test_email) INTO result;
    RAISE NOTICE '%', result;
    
    -- Show final status
    SELECT 
        'TEST PARTNER FINAL STATUS' as test_type,
        email,
        partner_status,
        temporary_approval,
        approval_date,
        CASE 
            WHEN partner_status = 'active' 
            THEN '🎉 Fully approved with full access'
            WHEN partner_status = 'temporary' 
            THEN '✅ Temporarily approved with limited access'
            ELSE '❌ Not approved'
        END as access_level
    FROM users 
    WHERE email = test_email;
    
    -- Clean up
    DELETE FROM users WHERE email = test_email;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error in test: %', SQLERRM;
        DELETE FROM users WHERE email = test_email;
END $$;

-- 8. Summary
SELECT 
    'TEMPORARY APPROVAL SYSTEM' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'temporary_approval'
        )
        AND EXISTS (
            SELECT FROM information_schema.routines 
            WHERE routine_name = 'grant_temporary_partner_approval'
        )
        AND EXISTS (
            SELECT FROM information_schema.routines 
            WHERE routine_name = 'grant_final_partner_approval'
        )
        THEN '🎉 Temporary approval system is ready!'
        ELSE '⚠️ Some components may be missing'
    END as overall_status;
