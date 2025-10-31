-- Reset credits to 10 for specific user
-- This script deletes all sessions and sets credits to 10 for the user with email 'obgynect@gmail.com'

-- First, delete all sessions for this user
DELETE FROM sessions 
WHERE user_id = (SELECT id FROM users WHERE email = 'obgynect@gmail.com');

-- Delete existing credits
DELETE FROM user_credits 
WHERE user_id = (SELECT id FROM users WHERE email = 'obgynect@gmail.com');

-- Insert new credits record with 10 credits
-- Note: user_credits.user_type must be 'user', 'therapist', or 'partner'
-- While users.user_type is 'individual', 'therapist', 'admin', or 'partner'
INSERT INTO user_credits (
    user_id,
    user_type,
    credits_balance,
    credits_purchased,
    credits_used,
    credits_expired,
    created_at,
    updated_at
)
SELECT 
    id,
    CASE 
        WHEN user_type = 'therapist' THEN 'therapist'
        WHEN user_type = 'partner' THEN 'partner'
        ELSE 'user'  -- Map 'individual' and 'admin' to 'user' for credits
    END as user_type,
    10,
    10,
    0,
    0,
    NOW(),
    NOW()
FROM users 
WHERE email = 'obgynect@gmail.com';

-- Show confirmation
SELECT 
    'User credits reset successfully!' as status,
    u.email,
    u.full_name,
    uc.credits_balance,
    uc.credits_used
FROM users u
LEFT JOIN user_credits uc ON u.id = uc.user_id
WHERE u.email = 'obgynect@gmail.com';

