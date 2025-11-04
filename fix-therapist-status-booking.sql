-- =============================================
-- FIX THERAPIST STATUS FOR BOOKING
-- Ensures therapist has correct status for booking
-- =============================================

-- Step 1: Verify therapist user status
SELECT 
    'THERAPIST USER STATUS' as check_name,
    id,
    email,
    user_type,
    is_active,
    is_verified,
    CASE 
        WHEN user_type = 'therapist' AND is_active = true AND is_verified = true
        THEN '✅ Active and verified'
        ELSE '❌ Not active or not verified'
    END as status
FROM users
WHERE id = 'ac7aaa37-0681-48f5-b93f-140dd2ea65f2';

-- Step 2: Verify therapist enrollment status
SELECT 
    'THERAPIST ENROLLMENT STATUS' as check_name,
    te.id,
    te.email,
    te.status,
    te.is_active,
    CASE 
        WHEN te.status = 'approved' AND te.is_active = true
        THEN '✅ Approved and active'
        ELSE '❌ Not approved or inactive'
    END as status
FROM therapist_enrollments te
WHERE te.email = (SELECT email FROM users WHERE id = 'ac7aaa37-0681-48f5-b93f-140dd2ea65f2');

-- Step 3: Check therapist status (no therapist_states table needed)
-- Status is determined by users + therapist_enrollments tables
SELECT 
    'THERAPIST STATUS CHECK' as check_name,
    u.id as therapist_id,
    u.is_active as user_active,
    u.is_verified as user_verified,
    te.status as enrollment_status,
    te.is_active as enrollment_active,
    CASE 
        WHEN u.is_active = true AND u.is_verified = true 
         AND te.status = 'approved' AND te.is_active = true
        THEN '✅ Active'
        ELSE '❌ Not active'
    END as status
FROM users u
LEFT JOIN therapist_enrollments te ON te.email = u.email
WHERE u.id = 'ac7aaa37-0681-48f5-b93f-140dd2ea65f2'
AND u.user_type = 'therapist';

-- Step 4: Fix therapist status if missing or inactive
DO $$
DECLARE
    v_therapist_id UUID := 'ac7aaa37-0681-48f5-b93f-140dd2ea65f2';
    v_user_email TEXT;
BEGIN
    -- Get therapist email
    SELECT email INTO v_user_email
    FROM users
    WHERE id = v_therapist_id
    AND user_type = 'therapist';
    
    IF v_user_email IS NULL THEN
        RAISE NOTICE '❌ Therapist not found: %', v_therapist_id;
        RETURN;
    END IF;
    
    -- Ensure therapist user is active and verified
    UPDATE users
    SET is_active = true, is_verified = true, updated_at = NOW()
    WHERE id = v_therapist_id
    AND user_type = 'therapist';
    
    RAISE NOTICE '✅ Therapist user set to active and verified';
    
    -- Ensure therapist enrollment is approved
    UPDATE therapist_enrollments
    SET status = 'approved', is_active = true, updated_at = NOW()
    WHERE email = v_user_email;
    
    RAISE NOTICE '✅ Therapist enrollment set to approved';
    
    -- Note: No therapist_states table needed
    -- Status is determined by users + therapist_enrollments tables
    
    RAISE NOTICE '✅ Therapist status fixed successfully';
END $$;

-- Step 5: Verify fix
SELECT 
    'FINAL STATUS CHECK' as check_name,
    u.id,
    u.email,
    u.is_active as user_active,
    u.is_verified as user_verified,
    te.status as enrollment_status,
    te.is_active as enrollment_active,
    CASE 
        WHEN u.is_active = true AND u.is_verified = true 
         AND te.status = 'approved' AND te.is_active = true
        THEN '✅ All checks passed - Therapist ready for booking'
        ELSE '❌ Some checks failed'
    END as final_status
FROM users u
LEFT JOIN therapist_enrollments te ON te.email = u.email
WHERE u.id = 'ac7aaa37-0681-48f5-b93f-140dd2ea65f2'
AND u.user_type = 'therapist';

SELECT '✅ Therapist status fix completed!' as status;

