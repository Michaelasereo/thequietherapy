-- =============================================
-- ADD 10 CREDITS TO USER: obgynect@gmail.com
-- =============================================

-- Step 1: Find the user ID
SELECT 
    '🔍 Finding user...' as step,
    id as user_id,
    email,
    full_name,
    user_type
FROM users 
WHERE email = 'obgynect@gmail.com';

-- Step 2: Check existing credits
SELECT 
    '📊 Current credits status:' as info,
    uc.user_id,
    uc.user_type,
    uc.credits_balance,
    uc.credits_purchased,
    uc.credits_used,
    uc.expires_at,
    uc.status,
    uc.created_at
FROM user_credits uc
WHERE uc.user_id = (
    SELECT id FROM users WHERE email = 'obgynect@gmail.com'
)
ORDER BY uc.created_at DESC;

-- Step 3: Add 10 credits to the user
INSERT INTO user_credits (
    user_id,
    user_type,
    credits_balance,
    credits_purchased,
    credits_used,
    credits_expired,
    expires_at,
    created_at,
    updated_at
)
SELECT 
    u.id,
    COALESCE(u.user_type, 'user'),
    10, -- credits_balance
    10, -- credits_purchased
    0,  -- credits_used
    0,  -- credits_expired
    NULL, -- expires_at (no expiration)
    NOW(),
    NOW()
FROM users u
WHERE u.email = 'obgynect@gmail.com'
ON CONFLICT DO NOTHING;

-- Step 4: Verify credits were added
SELECT 
    '✅ Credits after adding:' as info,
    uc.user_id,
    uc.user_type,
    uc.credits_balance,
    uc.credits_purchased,
    uc.credits_used,
    uc.expires_at,
    uc.created_at
FROM user_credits uc
WHERE uc.user_id = (
    SELECT id FROM users WHERE email = 'obgynect@gmail.com'
)
ORDER BY uc.created_at DESC
LIMIT 5;

-- Step 5: Calculate total credits
SELECT 
    '📊 Total credits summary:' as info,
    u.email,
    u.full_name,
    COALESCE(SUM(uc.credits_balance), 0) as total_balance,
    COALESCE(SUM(uc.credits_purchased), 0) as total_purchased,
    COALESCE(SUM(uc.credits_used), 0) as total_used,
    COUNT(uc.id) as credit_records_count
FROM users u
LEFT JOIN user_credits uc ON u.id = uc.user_id
WHERE u.email = 'obgynect@gmail.com'
GROUP BY u.id, u.email, u.full_name;

SELECT '🎉 Done! Credits added successfully.' as result;

