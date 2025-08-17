-- Fix Partner Status Constraint to Include 'temporary'
-- This script updates the partner_status check constraint to allow 'temporary' status

-- 1. Drop the existing constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_partner_status_check;

-- 2. Add the new constraint with 'temporary' included
ALTER TABLE users ADD CONSTRAINT users_partner_status_check 
CHECK (partner_status IN ('active', 'suspended', 'pending', 'temporary'));

-- 3. Verify the constraint was updated
SELECT 
    'PARTNER STATUS CONSTRAINT UPDATED' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.check_constraints 
            WHERE constraint_name = 'users_partner_status_check'
            AND check_clause LIKE '%temporary%'
        )
        THEN '✅ Constraint updated successfully - temporary status now allowed'
        ELSE '❌ Constraint update failed'
    END as status;

-- 4. Show current partner statuses
SELECT 
    'CURRENT PARTNER STATUSES' as check_type,
    partner_status,
    COUNT(*) as count
FROM users 
WHERE user_type = 'partner'
GROUP BY partner_status
ORDER BY partner_status;
