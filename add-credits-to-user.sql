-- Add credits to ajayiodeborah@gmail.com
-- Step 1: Find the user ID

SELECT 
    '🔍 Finding user...' as info,
    id,
    email,
    full_name,
    credits as current_credits
FROM users 
WHERE email = 'ajayiodeborah@gmail.com';

-- Step 2: After running the query above and getting the user_id, add credits
-- Replace <USER_ID> with the actual user_id from Step 1

-- Option A: If using user_credits table (new system)
-- INSERT INTO user_credits (
--     user_id,
--     user_type,
--     credits_balance,
--     credits_purchased,
--     credits_used,
--     credits_expired,
--     created_at,
--     updated_at
-- )
-- VALUES (
--     '<USER_ID>',
--     'user',
--     10,  -- Add 10 credits
--     10,
--     0,
--     0,
--     NOW(),
--     NOW()
-- )
-- ON CONFLICT (user_id, user_type) 
-- DO UPDATE SET
--     credits_balance = user_credits.credits_balance + 10,
--     credits_purchased = user_credits.credits_purchased + 10,
--     updated_at = NOW();

-- Option B: If using old users.credits column
-- UPDATE users 
-- SET credits = credits + 10,
--     updated_at = NOW()
-- WHERE email = 'ajayiodeborah@gmail.com';

-- Step 3: Verify credits were added
-- SELECT 
--     '✅ Credits added!' as info,
--     id,
--     email,
--     credits
-- FROM users 
-- WHERE email = 'ajayiodeborah@gmail.com';

