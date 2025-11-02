-- Add 10 credits to ajayiodeborah@gmail.com

-- Step 1: Check current user and credits
SELECT 
    id as user_id,
    email,
    full_name,
    credits as current_credits
FROM users 
WHERE email = 'ajayiodeborah@gmail.com';

-- Step 2: Add credits to users table (OLD system)
UPDATE users 
SET credits = credits + 10,
    updated_at = NOW()
WHERE email = 'ajayiodeborah@gmail.com';

-- Step 3: Verify credits were added
SELECT 
    'Credits added!' as status,
    email,
    credits as new_credits
FROM users 
WHERE email = 'ajayiodeborah@gmail.com';

