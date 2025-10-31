-- Fix booking issue: Update existing approved therapists to have verification_status = 'approved' in therapist_profiles
-- This fixes the 409 conflict error when booking

-- Step 1: Show current state
SELECT 
    'Current therapist_profiles state:' as info,
    u.email,
    u.is_verified as user_verified,
    u.is_active as user_active,
    te.status as enrollment_status,
    tp.verification_status as profile_verification,
    tp.is_verified as profile_verified
FROM users u
LEFT JOIN therapist_enrollments te ON u.email = te.email
LEFT JOIN therapist_profiles tp ON u.id = tp.user_id
WHERE u.user_type = 'therapist' 
  AND (u.is_verified = true OR te.status = 'approved')
ORDER BY u.email;

-- Step 2: Update all therapist_profiles that should be approved
UPDATE therapist_profiles tp
SET 
    verification_status = 'approved',
    is_verified = true,
    updated_at = NOW()
WHERE EXISTS (
    SELECT 1 
    FROM users u 
    WHERE u.id = tp.user_id 
      AND u.user_type = 'therapist'
      AND u.is_verified = true
      AND u.is_active = true
)
AND (tp.verification_status != 'approved' OR tp.is_verified != true);

-- Step 3: Create missing therapist_profiles for approved therapists
INSERT INTO therapist_profiles (
    user_id,
    verification_status,
    is_verified,
    created_at,
    updated_at
)
SELECT 
    u.id,
    'approved',
    true,
    NOW(),
    NOW()
FROM users u
WHERE u.user_type = 'therapist'
  AND u.is_verified = true
  AND u.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM therapist_profiles tp WHERE tp.user_id = u.id
  );

-- Step 4: Verify the fix
SELECT 
    'After fix:' as info,
    u.email,
    u.is_verified as user_verified,
    u.is_active as user_active,
    te.status as enrollment_status,
    tp.verification_status as profile_verification,
    tp.is_verified as profile_verified,
    CASE 
        WHEN u.is_verified = true AND u.is_active = true 
             AND tp.verification_status = 'approved' 
             AND tp.is_verified = true
        THEN '✅ Bookable'
        ELSE '❌ Not bookable'
    END as booking_status
FROM users u
LEFT JOIN therapist_enrollments te ON u.email = te.email
LEFT JOIN therapist_profiles tp ON u.id = tp.user_id
WHERE u.user_type = 'therapist'
ORDER BY u.email;

SELECT '🎉 Booking fix complete! Therapists should now be bookable.' as result;

