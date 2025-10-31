-- Add 5 credits to themichaelsjournal@gmail.com
-- User ID: 25d2c8ca-fd67-45d4-9da5-1c2b0ee38906

-- First, check current credits in user_credits table
SELECT 
    '📊 Current credits:' as info,
    user_id,
    user_type,
    credits_balance,
    credits_purchased,
    credits_used
FROM user_credits 
WHERE user_id = '25d2c8ca-fd67-45d4-9da5-1c2b0ee38906';

-- Add 5 credits to user_credits table (using 'user' as user_type)
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
VALUES (
    '25d2c8ca-fd67-45d4-9da5-1c2b0ee38906',
    'user',  -- Changed from 'individual' to 'user'
    5,
    5,
    0,
    0,
    NOW(),
    NOW()
)
ON CONFLICT (user_id, user_type) 
DO UPDATE SET
    credits_balance = user_credits.credits_balance + 5,
    credits_purchased = user_credits.credits_purchased + 5,
    updated_at = NOW();

-- Verify the credits were added
SELECT 
    '✅ Updated credits:' as info,
    user_id,
    user_type,
    credits_balance,
    credits_purchased,
    credits_used,
    updated_at
FROM user_credits 
WHERE user_id = '25d2c8ca-fd67-45d4-9da5-1c2b0ee38906';

SELECT '🎉 Successfully added 5 credits to user_credits table!' as result;
