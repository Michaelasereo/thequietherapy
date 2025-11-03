-- =============================================
-- ADD 10 CREDITS TO USER: obgynect@gmail.com
-- Creates a new credit record (doesn't update existing)
-- =============================================

-- Step 1: Find and verify the user
SELECT 
    '🔍 Finding user...' as step,
    id as user_id,
    email,
    full_name,
    user_type
FROM users 
WHERE email = 'obgynect@gmail.com';

-- Step 2: Check if expires_at column exists
DO $$
DECLARE
    expires_at_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'user_credits' 
        AND column_name = 'expires_at'
    ) INTO expires_at_exists;
    
    IF expires_at_exists THEN
        RAISE NOTICE '✅ expires_at column exists';
    ELSE
        RAISE NOTICE 'ℹ️ expires_at column does not exist - using basic schema';
    END IF;
END $$;

-- Step 3: Check existing credits (without expires_at if it doesn't exist)
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
    SELECT id FROM users WHERE email = 'obgynect@gmail.com'
)
ORDER BY uc.created_at DESC;

-- Step 4: Add 10 new credits (creates a new record)
-- Use dynamic SQL to handle optional expires_at column
DO $$
DECLARE
    v_user_id UUID;
    v_user_type TEXT;
    expires_at_exists BOOLEAN;
BEGIN
    -- Get user info
    SELECT id, 
           CASE 
               WHEN user_type = 'therapist' THEN 'therapist'
               WHEN user_type = 'partner' THEN 'partner'
               WHEN user_type = 'individual' THEN 'individual'
               ELSE 'user'
           END
    INTO v_user_id, v_user_type
    FROM users 
    WHERE email = 'obgynect@gmail.com';
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User obgynect@gmail.com not found';
    END IF;
    
    -- Check if expires_at column exists
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'user_credits' 
        AND column_name = 'expires_at'
    ) INTO expires_at_exists;
    
    -- Insert credits (conditionally include expires_at)
    IF expires_at_exists THEN
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
        ) VALUES (
            v_user_id,
            v_user_type,
            10,  -- credits_balance
            10,  -- credits_purchased
            0,   -- credits_used
            0,   -- credits_expired
            NULL, -- expires_at: no expiration
            NOW(),
            NOW()
        );
    ELSE
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
            v_user_type,
            10,  -- credits_balance
            10,  -- credits_purchased
            0,   -- credits_used
            0,   -- credits_expired
            NOW(),
            NOW()
        );
    END IF;
    
    RAISE NOTICE '✅ 10 credits added successfully';
END $$;

-- Step 5: Verify credits were added
SELECT 
    '✅ Credits after adding:' as info,
    uc.id,
    uc.user_id,
    uc.user_type,
    uc.credits_balance,
    uc.credits_purchased,
    uc.credits_used,
    uc.created_at
FROM user_credits uc
WHERE uc.user_id = (
    SELECT id FROM users WHERE email = 'obgynect@gmail.com'
)
ORDER BY uc.created_at DESC
LIMIT 5;

-- Step 6: Calculate total credits (sum of all records)
-- Handle expires_at column conditionally
DO $$
DECLARE
    expires_at_exists BOOLEAN;
    total_balance INTEGER;
    total_purchased INTEGER;
    total_used INTEGER;
    record_count INTEGER;
BEGIN
    -- Check if expires_at column exists
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'user_credits' 
        AND column_name = 'expires_at'
    ) INTO expires_at_exists;
    
    IF expires_at_exists THEN
        -- Calculate with expires_at filtering
        SELECT 
            COALESCE(SUM(CASE 
                WHEN uc.expires_at IS NULL OR uc.expires_at > NOW() 
                THEN uc.credits_balance 
                ELSE 0 
            END), 0),
            COALESCE(SUM(uc.credits_purchased), 0),
            COALESCE(SUM(uc.credits_used), 0),
            COUNT(uc.id)
        INTO total_balance, total_purchased, total_used, record_count
        FROM users u
        LEFT JOIN user_credits uc ON u.id = uc.user_id
        WHERE u.email = 'obgynect@gmail.com';
    ELSE
        -- Calculate without expires_at (all credits are active)
        SELECT 
            COALESCE(SUM(uc.credits_balance), 0),
            COALESCE(SUM(uc.credits_purchased), 0),
            COALESCE(SUM(uc.credits_used), 0),
            COUNT(uc.id)
        INTO total_balance, total_purchased, total_used, record_count
        FROM users u
        LEFT JOIN user_credits uc ON u.id = uc.user_id
        WHERE u.email = 'obgynect@gmail.com';
    END IF;
    
    -- Display summary
    RAISE NOTICE '📊 Total credits summary:';
    RAISE NOTICE '   Total Balance: %', total_balance;
    RAISE NOTICE '   Total Purchased: %', total_purchased;
    RAISE NOTICE '   Total Used: %', total_used;
    RAISE NOTICE '   Credit Records: %', record_count;
END $$;

-- Final summary query (works regardless of expires_at column)
SELECT 
    '📊 Final credits summary:' as info,
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

SELECT '🎉 Done! 10 credits added successfully.' as result;

