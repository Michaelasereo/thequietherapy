-- FIX AUTO-GRANT SIGNUP CREDIT FUNCTION
-- Properly handle function dependencies

-- =====================================================
-- 1. DROP TRIGGER FIRST (if exists)
-- =====================================================
DROP TRIGGER IF EXISTS trigger_auto_grant_signup_credit ON users;

-- =====================================================
-- 2. DROP FUNCTION (now safe to drop)
-- =====================================================
DROP FUNCTION IF EXISTS auto_grant_signup_credit() CASCADE;

-- =====================================================
-- 3. RECREATE THE FUNCTION WITH PROPER LOGIC
-- =====================================================
CREATE OR REPLACE FUNCTION auto_grant_signup_credit()
RETURNS TRIGGER AS $$
BEGIN
    -- Grant free credit to new individual users only
    IF NEW.user_type = 'individual' THEN
        -- Use the existing grant_signup_credit function
        PERFORM grant_signup_credit(NEW.id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. RECREATE THE TRIGGER
-- =====================================================
CREATE TRIGGER trigger_auto_grant_signup_credit
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION auto_grant_signup_credit();

-- =====================================================
-- 5. VERIFY THE SETUP
-- =====================================================
SELECT 
    'Function recreated successfully!' as status,
    proname as function_name,
    pg_get_function_arguments(oid) as arguments
FROM pg_proc 
WHERE proname = 'auto_grant_signup_credit';

-- Check trigger exists
SELECT 
    'Trigger recreated successfully!' as status,
    tgname as trigger_name,
    tgrelid::regclass as table_name
FROM pg_trigger 
WHERE tgname = 'trigger_auto_grant_signup_credit';

-- Test the function (optional - only run if you want to test)
-- SELECT 'Test completed!' as test_status;
