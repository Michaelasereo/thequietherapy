-- Add 10 credits to obgynect@gmail.com
-- This script will add 10 credits to the user's balance

-- Step 1: Check current user and credits status
SELECT 
    '🔍 Finding user...' as info,
    u.id,
    u.email,
    u.full_name,
    COALESCE(uc.credits_balance, 0) as current_credits,
    COALESCE(uc.credits_purchased, 0) as credits_purchased,
    COALESCE(uc.credits_used, 0) as credits_used
FROM users u
LEFT JOIN user_credits uc ON u.id = uc.user_id 
    AND uc.user_type = CASE 
        WHEN u.user_type = 'therapist' THEN 'therapist'
        WHEN u.user_type = 'partner' THEN 'partner'
        ELSE 'user'
    END
WHERE u.email = 'obgynect@gmail.com';

-- Step 2: Add 10 credits (insert or update)
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
    u.id,
    CASE 
        WHEN u.user_type = 'therapist' THEN 'therapist'
        WHEN u.user_type = 'partner' THEN 'partner'
        ELSE 'user'  -- Map 'individual' and 'admin' to 'user' for credits
    END as user_type,
    10,  -- Initial balance: 10 credits
    10,  -- Purchased: 10 credits
    0,   -- Used: 0 credits
    0,   -- Expired: 0 credits
    NOW(),
    NOW()
FROM users u
WHERE u.email = 'obgynect@gmail.com'
ON CONFLICT (user_id, user_type) 
DO UPDATE SET
    credits_balance = user_credits.credits_balance + 10,
    credits_purchased = user_credits.credits_purchased + 10,
    updated_at = NOW();

-- Step 3: Verify credits were added
SELECT 
    '✅ Credits added successfully!' as status,
    u.email,
    u.full_name,
    uc.credits_balance as new_balance,
    uc.credits_purchased as total_purchased,
    uc.credits_used as credits_used,
    (uc.credits_balance - uc.credits_used) as available_credits
FROM users u
LEFT JOIN user_credits uc ON u.id = uc.user_id 
    AND uc.user_type = CASE 
        WHEN u.user_type = 'therapist' THEN 'therapist'
        WHEN u.user_type = 'partner' THEN 'partner'
        ELSE 'user'
    END
WHERE u.email = 'obgynect@gmail.com';

