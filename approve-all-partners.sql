-- Approve All Currently Registered Partners
-- This script approves all partners that are currently registered in the system

-- 1. First, let's see what partners exist and their current status
SELECT 
    'CURRENT PARTNERS STATUS' as check_type,
    id,
    email,
    full_name,
    company_name,
    organization_type,
    partner_status,
    is_verified,
    is_active,
    created_at,
    CASE 
        WHEN partner_status = 'pending' THEN '⚠️ Pending approval'
        WHEN partner_status = 'under_review' THEN '🔍 Under review'
        WHEN partner_status = 'active' THEN '✅ Already approved'
        WHEN partner_status = 'inactive' THEN '❌ Inactive'
        WHEN partner_status = 'suspended' THEN '⏸️ Suspended'
        WHEN partner_status = 'rejected' THEN '❌ Rejected'
        ELSE '❓ Unknown status'
    END as status_description
FROM users 
WHERE user_type = 'partner'
ORDER BY created_at DESC;

-- 2. Count partners by status
SELECT 
    'PARTNER STATUS SUMMARY' as check_type,
    partner_status,
    COUNT(*) as count,
    CASE 
        WHEN partner_status = 'pending' THEN '⚠️ Needs approval'
        WHEN partner_status = 'under_review' THEN '🔍 Under review'
        WHEN partner_status = 'active' THEN '✅ Approved'
        WHEN partner_status = 'inactive' THEN '❌ Inactive'
        WHEN partner_status = 'suspended' THEN '⏸️ Suspended'
        WHEN partner_status = 'rejected' THEN '❌ Rejected'
        ELSE '❓ Unknown'
    END as status_description
FROM users 
WHERE user_type = 'partner'
GROUP BY partner_status
ORDER BY count DESC;

-- 3. Approve all partners that are not already active
UPDATE users 
SET 
    partner_status = 'active',
    is_verified = true,
    is_active = true,
    approval_date = NOW(),
    updated_at = NOW()
WHERE user_type = 'partner' 
  AND partner_status IN ('pending', 'under_review', 'inactive');

-- 4. Show the results after approval
SELECT 
    'APPROVAL RESULTS' as check_type,
    COUNT(*) as total_partners,
    COUNT(CASE WHEN partner_status = 'active' THEN 1 END) as active_partners,
    COUNT(CASE WHEN partner_status = 'pending' THEN 1 END) as pending_partners,
    COUNT(CASE WHEN partner_status = 'under_review' THEN 1 END) as under_review_partners,
    COUNT(CASE WHEN partner_status = 'inactive' THEN 1 END) as inactive_partners,
    COUNT(CASE WHEN partner_status = 'suspended' THEN 1 END) as suspended_partners,
    COUNT(CASE WHEN partner_status = 'rejected' THEN 1 END) as rejected_partners
FROM users 
WHERE user_type = 'partner';

-- 5. Show final status of all partners
SELECT 
    'FINAL PARTNER STATUS' as check_type,
    email,
    full_name,
    company_name,
    partner_status,
    is_verified,
    is_active,
    approval_date,
    CASE 
        WHEN partner_status = 'active' AND is_verified = true AND is_active = true 
        THEN '✅ Fully approved and active'
        WHEN partner_status = 'suspended' 
        THEN '⏸️ Suspended (not approved)'
        WHEN partner_status = 'rejected' 
        THEN '❌ Rejected (not approved)'
        ELSE '❓ Other status'
    END as final_status
FROM users 
WHERE user_type = 'partner'
ORDER BY created_at DESC;

-- 6. Summary message
DO $$
DECLARE
    total_partners INTEGER;
    active_partners INTEGER;
    approved_count INTEGER;
BEGIN
    -- Count total partners
    SELECT COUNT(*) INTO total_partners FROM users WHERE user_type = 'partner';
    
    -- Count active partners
    SELECT COUNT(*) INTO active_partners 
    FROM users 
    WHERE user_type = 'partner' AND partner_status = 'active' AND is_verified = true AND is_active = true;
    
    -- Count how many were just approved
    SELECT COUNT(*) INTO approved_count 
    FROM users 
    WHERE user_type = 'partner' 
      AND partner_status = 'active' 
      AND approval_date >= NOW() - INTERVAL '1 minute';
    
    RAISE NOTICE '📊 PARTNER APPROVAL SUMMARY:';
    RAISE NOTICE '   Total partners: %', total_partners;
    RAISE NOTICE '   Active partners: %', active_partners;
    RAISE NOTICE '   Just approved: %', approved_count;
    
    IF active_partners = total_partners THEN
        RAISE NOTICE '✅ All partners are now approved and active!';
    ELSE
        RAISE NOTICE '⚠️ Some partners remain unapproved (suspended/rejected status)';
    END IF;
END $$;
