-- =====================================================
-- FIX THERAPIST AVAILABILITY ISSUE
-- Therapist: asereope@gmail.com
-- Issue: Unable to set availability after duplicate deletion
-- =====================================================

-- Step 1: Check current status of the therapist
SELECT 
    '🔍 Current Therapist Status:' as check_type,
    u.id as user_id,
    u.email,
    u.full_name,
    u.user_type,
    u.is_verified,
    u.is_active,
    u.created_at as user_created,
    te.id as enrollment_id,
    te.status as enrollment_status,
    te.is_active as enrollment_is_active,
    te.approved_at,
    te.created_at as enrollment_created,
    CASE 
        WHEN u.is_verified = true AND u.is_active = true THEN '✅ User Approved'
        ELSE '❌ User Not Approved'
    END as user_status,
    CASE 
        WHEN te.status = 'approved' AND te.is_active = true THEN '✅ Enrollment Approved'
        WHEN te.status = 'approved' AND te.is_active = false THEN '⚠️ Enrollment Approved but Inactive'
        WHEN te.status IS NULL THEN '❌ No Enrollment'
        ELSE '❌ Enrollment Not Approved'
    END as enrollment_status_check,
    CASE 
        WHEN u.is_verified = true AND u.is_active = true AND te.status = 'approved' AND te.is_active = true THEN '✅ Fully Approved'
        WHEN u.is_verified = true AND u.is_active = true AND te.status = 'approved' AND te.is_active = false THEN '⚠️ User Approved but Enrollment Inactive'
        WHEN u.is_verified = true AND u.is_active = true AND te.id IS NULL THEN '⚠️ User Approved but No Enrollment'
        ELSE '❌ Not Fully Approved'
    END as overall_status
FROM users u
LEFT JOIN therapist_enrollments te ON u.email = te.email
WHERE u.email = 'asereope@gmail.com'
   OR te.email = 'asereope@gmail.com';

-- Step 2: Check if there are multiple records (duplicates)
SELECT 
    '🔍 Duplicate Check:' as check_type,
    'users' as table_name,
    COUNT(*) as count,
    STRING_AGG(id::text, ', ') as ids
FROM users
WHERE email = 'asereope@gmail.com'
  AND user_type = 'therapist';

SELECT 
    '🔍 Duplicate Check:' as check_type,
    'therapist_enrollments' as table_name,
    COUNT(*) as count,
    STRING_AGG(id::text, ', ') as ids
FROM therapist_enrollments
WHERE email = 'asereope@gmail.com';

-- Step 3: Check availability_approved calculation
SELECT 
    '🔍 Availability Approval Calculation:' as check_type,
    u.email,
    u.is_verified,
    u.is_active,
    (u.is_verified AND u.is_active) as calculated_availability_approved,
    te.status as enrollment_status,
    te.is_active as enrollment_is_active
FROM users u
LEFT JOIN therapist_enrollments te ON u.email = te.email
WHERE u.email = 'asereope@gmail.com'
  AND u.user_type = 'therapist';

-- Step 4: FIX - Ensure user is fully approved
-- Update users table to ensure is_verified and is_active are true
UPDATE users
SET 
    is_verified = true,
    is_active = true,
    updated_at = NOW()
WHERE email = 'asereope@gmail.com'
  AND user_type = 'therapist'
  AND (is_verified = false OR is_active = false);

-- Step 5: FIX - Ensure enrollment exists and is approved
-- First, check if enrollment exists
DO $$
DECLARE
    v_user_id UUID;
    v_user_email TEXT;
    v_user_name TEXT;
    v_enrollment_id UUID;
    v_enrollment_exists BOOLEAN;
BEGIN
    -- Get user info
    SELECT id, email, full_name INTO v_user_id, v_user_email, v_user_name
    FROM users
    WHERE email = 'asereope@gmail.com'
      AND user_type = 'therapist'
    LIMIT 1;
    
    IF v_user_id IS NULL THEN
        RAISE NOTICE '❌ User not found: asereope@gmail.com';
        RETURN;
    END IF;
    
    RAISE NOTICE '✅ Found user: % (%)', v_user_name, v_user_id;
    
    -- Check if enrollment exists
    SELECT id INTO v_enrollment_id
    FROM therapist_enrollments
    WHERE email = 'asereope@gmail.com'
    LIMIT 1;
    
    v_enrollment_exists := v_enrollment_id IS NOT NULL;
    
    IF v_enrollment_exists THEN
        RAISE NOTICE '✅ Enrollment exists: %', v_enrollment_id;
        
        -- Update enrollment to ensure it's approved and active
        UPDATE therapist_enrollments
        SET 
            status = 'approved',
            is_active = true,
            is_verified = true,
            approved_at = COALESCE(approved_at, NOW()),
            user_id = COALESCE(user_id, v_user_id),
            updated_at = NOW()
        WHERE id = v_enrollment_id;
        
        RAISE NOTICE '✅ Updated enrollment to approved and active';
    ELSE
        RAISE NOTICE '⚠️ No enrollment found, creating one...';
        
        -- Create enrollment if it doesn't exist
        INSERT INTO therapist_enrollments (
            user_id,
            email,
            full_name,
            status,
            is_active,
            is_verified,
            approved_at,
            created_at,
            updated_at
        ) VALUES (
            v_user_id,
            v_user_email,
            v_user_name,
            'approved',
            true,
            true,
            NOW(),
            NOW(),
            NOW()
        )
        RETURNING id INTO v_enrollment_id;
        
        RAISE NOTICE '✅ Created enrollment: %', v_enrollment_id;
    END IF;
    
    -- Ensure user_id is linked in enrollment
    UPDATE therapist_enrollments
    SET user_id = v_user_id
    WHERE id = v_enrollment_id
      AND (user_id IS NULL OR user_id != v_user_id);
    
    RAISE NOTICE '✅ Ensured user_id is linked in enrollment';
END $$;

-- Step 6: Verify the fix
SELECT 
    '✅ Verification After Fix:' as check_type,
    u.id as user_id,
    u.email,
    u.is_verified,
    u.is_active,
    (u.is_verified AND u.is_active) as availability_approved,
    te.id as enrollment_id,
    te.status as enrollment_status,
    te.is_active as enrollment_is_active,
    te.user_id as enrollment_user_id,
    CASE 
        WHEN u.is_verified = true AND u.is_active = true AND te.status = 'approved' AND te.is_active = true THEN '✅ READY TO SET AVAILABILITY'
        ELSE '❌ STILL HAS ISSUES'
    END as final_status
FROM users u
LEFT JOIN therapist_enrollments te ON u.email = te.email
WHERE u.email = 'asereope@gmail.com'
  AND u.user_type = 'therapist';

-- Step 7: Check therapist_profiles table
SELECT 
    '🔍 Therapist Profile Check:' as check_type,
    tp.id as profile_id,
    tp.user_id,
    tp.is_verified as profile_is_verified,
    tp.verification_status,
    u.email,
    u.is_verified as user_is_verified
FROM therapist_profiles tp
RIGHT JOIN users u ON tp.user_id = u.id
WHERE u.email = 'asereope@gmail.com'
  AND u.user_type = 'therapist';

-- Step 8: Ensure therapist_profiles exists and is verified
DO $$
DECLARE
    v_user_id UUID;
    v_profile_id UUID;
    v_profile_exists BOOLEAN;
    v_licensed_qualification TEXT;
    v_has_licensed_qualification BOOLEAN;
    v_has_mdcn_code BOOLEAN;
BEGIN
    -- Get user ID
    SELECT id INTO v_user_id
    FROM users
    WHERE email = 'asereope@gmail.com'
      AND user_type = 'therapist'
    LIMIT 1;
    
    IF v_user_id IS NULL THEN
        RAISE NOTICE '❌ User not found';
        RETURN;
    END IF;
    
    -- Get licensed_qualification from enrollment if it exists
    SELECT COALESCE(
        licensed_qualification,
        mdcn_code,
        'Not specified'
    ) INTO v_licensed_qualification
    FROM therapist_enrollments
    WHERE email = 'asereope@gmail.com'
    LIMIT 1;
    
    -- If not found in enrollment, use default
    IF v_licensed_qualification IS NULL THEN
        v_licensed_qualification := 'Not specified';
    END IF;
    
    -- Check which column exists in therapist_profiles table
    SELECT EXISTS(
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'therapist_profiles' 
          AND column_name = 'licensed_qualification'
    ) INTO v_has_licensed_qualification;
    
    SELECT EXISTS(
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'therapist_profiles' 
          AND column_name = 'mdcn_code'
    ) INTO v_has_mdcn_code;
    
    -- Check if profile exists
    SELECT id INTO v_profile_id
    FROM therapist_profiles
    WHERE user_id = v_user_id
    LIMIT 1;
    
    v_profile_exists := v_profile_id IS NOT NULL;
    
    IF v_profile_exists THEN
        -- Update profile to ensure it's verified and has licensed_qualification
        IF v_has_licensed_qualification THEN
            UPDATE therapist_profiles
            SET 
                is_verified = true,
                verification_status = 'approved',
                licensed_qualification = COALESCE(licensed_qualification, v_licensed_qualification),
                updated_at = NOW()
            WHERE user_id = v_user_id;
            RAISE NOTICE '✅ Updated therapist profile to verified (using licensed_qualification)';
        ELSIF v_has_mdcn_code THEN
            UPDATE therapist_profiles
            SET 
                is_verified = true,
                verification_status = 'approved',
                mdcn_code = COALESCE(mdcn_code, v_licensed_qualification),
                updated_at = NOW()
            WHERE user_id = v_user_id;
            RAISE NOTICE '✅ Updated therapist profile to verified (using mdcn_code)';
        ELSE
            UPDATE therapist_profiles
            SET 
                is_verified = true,
                verification_status = 'approved',
                updated_at = NOW()
            WHERE user_id = v_user_id;
            RAISE NOTICE '✅ Updated therapist profile to verified (no qualification column)';
        END IF;
    ELSE
        -- Create profile if it doesn't exist
        IF v_has_licensed_qualification THEN
            INSERT INTO therapist_profiles (
                user_id,
                licensed_qualification,
                is_verified,
                verification_status,
                created_at,
                updated_at
            ) VALUES (
                v_user_id,
                v_licensed_qualification,
                true,
                'approved',
                NOW(),
                NOW()
            )
            RETURNING id INTO v_profile_id;
            RAISE NOTICE '✅ Created therapist profile: %', v_profile_id;
        ELSIF v_has_mdcn_code THEN
            INSERT INTO therapist_profiles (
                user_id,
                mdcn_code,
                is_verified,
                verification_status,
                created_at,
                updated_at
            ) VALUES (
                v_user_id,
                v_licensed_qualification,
                true,
                'approved',
                NOW(),
                NOW()
            )
            RETURNING id INTO v_profile_id;
            RAISE NOTICE '✅ Created therapist profile with mdcn_code: %', v_profile_id;
        ELSE
            -- If neither column exists, this shouldn't happen but we'll try without it
            RAISE NOTICE '⚠️ Warning: No qualification column found, attempting insert without it';
            INSERT INTO therapist_profiles (
                user_id,
                is_verified,
                verification_status,
                created_at,
                updated_at
            ) VALUES (
                v_user_id,
                true,
                'approved',
                NOW(),
                NOW()
            )
            RETURNING id INTO v_profile_id;
            RAISE NOTICE '✅ Created therapist profile without qualification: %', v_profile_id;
        END IF;
    END IF;
END $$;

-- Step 9: Final verification - All systems check
SELECT 
    '✅ FINAL STATUS CHECK:' as check_type,
    u.email,
    u.is_verified as user_verified,
    u.is_active as user_active,
    te.status as enrollment_status,
    te.is_active as enrollment_active,
    tp.is_verified as profile_verified,
    tp.verification_status as profile_status,
    (u.is_verified AND u.is_active) as availability_approved_calculated,
    CASE 
        WHEN u.is_verified = true 
         AND u.is_active = true 
         AND te.status = 'approved' 
         AND te.is_active = true 
         AND tp.is_verified = true 
         AND tp.verification_status = 'approved' 
        THEN '✅ FULLY APPROVED - CAN SET AVAILABILITY'
        ELSE '❌ STILL HAS ISSUES - CHECK ABOVE'
    END as final_status
FROM users u
LEFT JOIN therapist_enrollments te ON u.email = te.email
LEFT JOIN therapist_profiles tp ON u.id = tp.user_id
WHERE u.email = 'asereope@gmail.com'
  AND u.user_type = 'therapist';

