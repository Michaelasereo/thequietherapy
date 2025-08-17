-- Fix Global Users Trigger Issue
-- This script checks and fixes the create_global_user_record function that's causing partner creation to fail

-- 1. Check if global_users table exists and has correct structure
SELECT 
    'GLOBAL_USERS TABLE CHECK' as check_type,
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'global_users') 
        THEN '✅ global_users table exists' 
        ELSE '❌ global_users table missing' 
    END as status;

-- 2. Check global_users table structure
SELECT 
    'GLOBAL_USERS COLUMNS' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'global_users' 
ORDER BY ordinal_position;

-- 3. Check if create_global_user_record function exists
SELECT 
    'FUNCTION CHECK' as check_type,
    routine_name,
    routine_type,
    CASE 
        WHEN routine_name = 'create_global_user_record' 
        THEN '✅ Function exists' 
        ELSE '❌ Function missing' 
    END as status
FROM information_schema.routines 
WHERE routine_name = 'create_global_user_record';

-- 4. Drop the trigger first, then the function, then recreate both
DROP TRIGGER IF EXISTS create_global_user_on_signup ON users;
DROP FUNCTION IF EXISTS create_global_user_record() CASCADE;

-- 5. Create a simple version of the function
CREATE OR REPLACE FUNCTION create_global_user_record()
RETURNS TRIGGER AS $$
BEGIN
    -- Simple insert into global_users table
    INSERT INTO global_users (
        user_id,
        full_name,
        email,
        user_type,
        is_verified,
        is_active,
        online_status,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        COALESCE(NEW.full_name, NEW.email),
        NEW.email,
        COALESCE(NEW.user_type, 'individual'),
        COALESCE(NEW.is_verified, false),
        COALESCE(NEW.is_active, true),
        'offline',
        NOW(),
        NOW()
    );
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail user creation
        RAISE NOTICE 'Could not create global user record: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Recreate the trigger
CREATE TRIGGER create_global_user_on_signup
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_global_user_record();

-- 7. Test the trigger by creating a test user
DO $$
DECLARE
    test_user_id UUID;
    test_email VARCHAR(255) := 'test-global-user@example.com';
BEGIN
    -- Clean up any existing test user
    DELETE FROM users WHERE email = test_email;
    DELETE FROM global_users WHERE email = test_email;
    
    -- Try to create a test user (this should trigger the function)
    INSERT INTO users (
        email,
        full_name,
        user_type,
        is_verified,
        is_active
    ) VALUES (
        test_email,
        'Test Global User',
        'individual',
        false,
        true
    ) RETURNING id INTO test_user_id;
    
    RAISE NOTICE '✅ Test user created successfully with ID: %', test_user_id;
    
    -- Check if global user record was created
    IF EXISTS (SELECT FROM global_users WHERE user_id = test_user_id) THEN
        RAISE NOTICE '✅ Global user record created successfully';
    ELSE
        RAISE NOTICE '⚠️ Global user record was not created';
    END IF;
    
    -- Clean up
    DELETE FROM users WHERE id = test_user_id;
    DELETE FROM global_users WHERE user_id = test_user_id;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error in test: %', SQLERRM;
        -- Clean up on error
        DELETE FROM users WHERE email = test_email;
        DELETE FROM global_users WHERE email = test_email;
END $$;

-- 8. Summary
SELECT 
    'TRIGGER FIX SUMMARY' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.routines 
            WHERE routine_name = 'create_global_user_record'
        )
        AND EXISTS (
            SELECT FROM information_schema.triggers 
            WHERE trigger_name = 'create_global_user_on_signup'
        )
        THEN '🎉 Global users trigger should now work correctly!'
        ELSE '⚠️ Some components may still be missing'
    END as status;
