-- =============================================
-- ADD 10 CREDITS TO USER: opeyemimichaelasere@gmail.com
-- This script adds credits using UPSERT pattern
-- =============================================

-- Step 1: Find the user
SELECT 
    '🔍 Finding user...' as step,
    id as user_id,
    email,
    full_name,
    user_type
FROM users 
WHERE email = 'opeyemimichaelasere@gmail.com';

-- Step 2: Check current credits
SELECT 
    '📊 Current credits before adding:' as info,
    uc.user_id,
    uc.user_type,
    uc.credits_balance,
    uc.credits_purchased,
    uc.credits_used,
    uc.created_at
FROM user_credits uc
WHERE uc.user_id = (
    SELECT id FROM users WHERE email = 'opeyemimichaelasere@gmail.com'
)
ORDER BY uc.created_at DESC;

-- Step 3: Consolidate all credits into ONE record and add 10 credits
DO $$
DECLARE
    v_user_id UUID;
    v_user_type TEXT;
    v_existing_balance INTEGER;
    v_total_balance INTEGER;
    v_total_purchased INTEGER;
    v_total_used INTEGER;
BEGIN
    -- Get user info and map 'individual' to 'user' for user_credits table
    SELECT id, 
           CASE 
               WHEN user_type = 'individual' THEN 'user'
               WHEN user_type IN ('therapist', 'partner') THEN user_type
               ELSE 'user'
           END
    INTO v_user_id, v_user_type
    FROM users 
    WHERE email = 'opeyemimichaelasere@gmail.com';
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User opeyemimichaelasere@gmail.com not found';
    END IF;
    
    -- Calculate total credits from ALL existing records (both 'individual' and 'user')
    SELECT 
        COALESCE(SUM(credits_balance), 0),
        COALESCE(SUM(credits_purchased), 0),
        COALESCE(SUM(credits_used), 0)
    INTO v_total_balance, v_total_purchased, v_total_used
    FROM user_credits
    WHERE user_id = v_user_id 
      AND user_type IN ('user', 'individual');  -- Sum all records
    
    -- Delete ALL old records (both 'individual' and 'user') to prevent duplicates
    DELETE FROM user_credits
    WHERE user_id = v_user_id 
      AND user_type IN ('user', 'individual');
    
    -- Insert ONE consolidated record with all credits + 10 new credits
    INSERT INTO user_credits (
        user_id,
        user_type,
        credits_balance,
        credits_purchased,
        credits_used,
        credits_expired,
        created_at,
        updated_at
    ) VALUES (
        v_user_id,
        v_user_type,  -- Always use 'user' (not 'individual')
        v_total_balance + 10,  -- All existing credits + 10 new
        v_total_purchased + 10,  -- All existing purchased + 10 new
        v_total_used,  -- Keep existing used credits
        0,  -- credits_expired
        NOW(),
        NOW()
    );
    
    RAISE NOTICE '✅ Consolidated all credits into one record and added 10 credits';
    RAISE NOTICE '   Previous total: %, New total: %', v_total_balance, v_total_balance + 10;
END $$;

-- Step 4: Verify credits after adding
SELECT 
    '✅ Credits after adding:' as info,
    uc.user_id,
    uc.user_type,
    uc.credits_balance,
    uc.credits_purchased,
    uc.credits_used,
    uc.updated_at
FROM user_credits uc
WHERE uc.user_id = (
    SELECT id FROM users WHERE email = 'opeyemimichaelasere@gmail.com'
)
ORDER BY uc.updated_at DESC
LIMIT 1;

-- Step 5: Final summary (shows sum of all records to match API behavior)
SELECT 
    '📊 Final credits summary (sum of all records):' as info,
    u.email,
    u.full_name,
    COALESCE(SUM(uc.credits_balance), 0) as total_balance,
    COALESCE(SUM(uc.credits_purchased), 0) as total_purchased,
    COALESCE(SUM(uc.credits_used), 0) as total_used,
    COUNT(uc.id) as record_count
FROM users u
LEFT JOIN user_credits uc ON u.id = uc.user_id
WHERE u.email = 'opeyemimichaelasere@gmail.com'
GROUP BY u.id, u.email, u.full_name;

SELECT '🎉 Done! 10 credits added successfully to opeyemimichaelasere@gmail.com' as result;

