-- Approve Partner for Testing
-- This script manually approves a partner by changing their status from pending to active

-- 1. Show all pending partners
SELECT 
    'PENDING PARTNERS' as action_type,
    id,
    email,
    full_name,
    company_name,
    organization_type,
    contact_person,
    phone,
    created_at,
    partner_status
FROM users 
WHERE user_type = 'partner' AND partner_status = 'pending'
ORDER BY created_at DESC;

-- 2. Approve the most recent pending partner (for testing)
DO $$
DECLARE
    partner_to_approve RECORD;
    approved_count INTEGER;
BEGIN
    -- Get the most recent pending partner
    SELECT * INTO partner_to_approve
    FROM users 
    WHERE user_type = 'partner' AND partner_status = 'pending'
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF partner_to_approve.id IS NOT NULL THEN
        -- Approve the partner
        UPDATE users 
        SET 
            partner_status = 'active',
            updated_at = NOW()
        WHERE id = partner_to_approve.id;
        
        GET DIAGNOSTICS approved_count = ROW_COUNT;
        
        IF approved_count > 0 THEN
            RAISE NOTICE '✅ Successfully approved partner: % (%)', partner_to_approve.email, partner_to_approve.company_name;
            
            -- Show the approved partner
            SELECT 
                'APPROVED PARTNER' as action_type,
                email,
                full_name,
                company_name,
                organization_type,
                contact_person,
                phone,
                partner_status,
                '✅ Partner is now active and can access dashboard' as status
            FROM users 
            WHERE id = partner_to_approve.id;
        ELSE
            RAISE NOTICE '❌ Failed to approve partner: %', partner_to_approve.email;
        END IF;
    ELSE
        RAISE NOTICE '⚠️ No pending partners found to approve';
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error approving partner: %', SQLERRM;
END $$;

-- 3. Show all partners after approval
SELECT 
    'ALL PARTNERS AFTER APPROVAL' as action_type,
    email,
    full_name,
    company_name,
    partner_status,
    is_verified,
    is_active,
    created_at,
    CASE 
        WHEN partner_status = 'active' AND is_verified = true 
        THEN '✅ Fully approved and active'
        WHEN partner_status = 'pending' 
        THEN '⚠️ Awaiting approval'
        WHEN is_verified = false 
        THEN '⚠️ Email not verified'
        ELSE '❓ Other status'
    END as overall_status
FROM users 
WHERE user_type = 'partner'
ORDER BY created_at DESC;

-- 4. Summary
SELECT 
    'APPROVAL SUMMARY' as action_type,
    COUNT(*) as total_partners,
    COUNT(CASE WHEN partner_status = 'active' THEN 1 END) as active_partners,
    COUNT(CASE WHEN partner_status = 'pending' THEN 1 END) as pending_partners,
    COUNT(CASE WHEN is_verified = true THEN 1 END) as verified_partners,
    CASE 
        WHEN COUNT(CASE WHEN partner_status = 'active' THEN 1 END) > 0 
        THEN '🎉 Partners can now access the system!'
        ELSE '⚠️ No active partners yet'
    END as status
FROM users 
WHERE user_type = 'partner';
