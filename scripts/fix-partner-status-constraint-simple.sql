-- Fix Partner Status Constraint to Include 'temporary'
-- Copy and paste this entire script into your Supabase SQL editor

-- 1. Drop the existing constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_partner_status_check;

-- 2. Add the new constraint with 'temporary' included
ALTER TABLE users ADD CONSTRAINT users_partner_status_check 
CHECK (partner_status IN ('active', 'suspended', 'pending', 'temporary'));

-- 3. Update existing test partner to temporary status
UPDATE users 
SET 
    partner_status = 'temporary',
    temporary_approval = true,
    approval_date = NOW()
WHERE email = 'testpartner@example.com' AND user_type = 'partner';

-- 4. Show current partner statuses
SELECT 
    'CURRENT PARTNER STATUSES' as check_type,
    partner_status,
    COUNT(*) as count
FROM users 
WHERE user_type = 'partner'
GROUP BY partner_status

ORDER BY partner_status;

-- 5. Verify the constraint was updated
SELECT 
    'CONSTRAINT STATUS' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.check_constraints 
            WHERE constraint_name = 'users_partner_status_check'
            AND check_clause LIKE '%temporary%'
        )
        THEN '✅ Constraint updated successfully - temporary status now allowed'
        ELSE '❌ Constraint update failed'
    END as status;
