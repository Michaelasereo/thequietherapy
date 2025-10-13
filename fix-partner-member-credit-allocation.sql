-- FIX: DISABLE AUTOMATIC FREE CREDIT FOR ALL USERS
-- Only partner members via CSV should get credits (as specified in CSV)
-- Regular individual users get NO automatic free credits (they must purchase)

-- =====================================================
-- 1. DROP EXISTING TRIGGER
-- =====================================================
DROP TRIGGER IF EXISTS trigger_auto_grant_signup_credit ON users;

-- =====================================================
-- 2. DROP EXISTING FUNCTION
-- =====================================================
DROP FUNCTION IF EXISTS auto_grant_signup_credit() CASCADE;

-- =====================================================
-- 3. CREATE DISABLED FUNCTION (no auto-credits)
-- =====================================================
CREATE OR REPLACE FUNCTION auto_grant_signup_credit()
RETURNS TRIGGER AS $$
BEGIN
    -- NO automatic credit grants
    -- Partner members get credits via CSV upload only
    -- Regular users must purchase credits
    -- This trigger exists but does nothing (for future compatibility)
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. RECREATE THE TRIGGER (disabled)
-- =====================================================
CREATE TRIGGER trigger_auto_grant_signup_credit
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION auto_grant_signup_credit();

-- =====================================================
-- 5. VERIFY THE SETUP
-- =====================================================
SELECT 
    '✅ Auto-credit trigger disabled successfully!' as status,
    'No automatic credits will be granted' as note;

-- Check trigger exists
SELECT 
    '✅ Trigger exists but is disabled' as status,
    tgname as trigger_name,
    tgrelid::regclass as table_name
FROM pg_trigger 
WHERE tgname = 'trigger_auto_grant_signup_credit';

-- =====================================================
-- 6. DISPLAY UPDATED LOGIC
-- =====================================================
SELECT 
    '📋 NEW CREDIT ALLOCATION LOGIC:' as info,
    'Regular individual users → NO automatic credits (must purchase)' as rule_1,
    'Partner members via CSV → Get ONLY credits specified in CSV' as rule_2,
    'Partners, therapists, admins → NO automatic credits' as rule_3;

