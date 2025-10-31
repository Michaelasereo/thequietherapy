-- Create a test therapist for booking
-- This script creates a therapist with all required fields to enable booking

-- First, check if therapist already exists
DO $$
DECLARE
    therapist_id UUID;
    enrollment_id UUID;
    profile_id UUID;
BEGIN
    -- Try to get existing therapist
    SELECT id INTO therapist_id 
    FROM users 
    WHERE email = 'test.therapist@trpi.com' 
    LIMIT 1;

    -- If therapist exists, update it
    IF therapist_id IS NOT NULL THEN
        -- Update user
        UPDATE users SET
            full_name = 'Test Therapist',
            user_type = 'therapist',
            is_active = true,
            is_verified = true
        WHERE id = therapist_id;

        RAISE NOTICE 'Updated existing therapist: %', therapist_id;
    ELSE
        -- Create new therapist user
        INSERT INTO users (id, email, full_name, user_type, is_active, is_verified, created_at, updated_at)
        VALUES (
            gen_random_uuid(),
            'test.therapist@trpi.com',
            'Test Therapist',
            'therapist',
            true,
            true,
            NOW(),
            NOW()
        )
        RETURNING id INTO therapist_id;

        RAISE NOTICE 'Created new therapist user: %', therapist_id;
    END IF;

    -- Now ensure therapist_profiles entry exists
    SELECT id INTO profile_id 
    FROM therapist_profiles 
    WHERE user_id = therapist_id 
    LIMIT 1;

    IF profile_id IS NULL THEN
        -- Create therapist profile
        INSERT INTO therapist_profiles (
            id,
            user_id,
            verification_status,
            is_verified,
            is_active,
            created_at,
            updated_at
        )
        VALUES (
            gen_random_uuid(),
            therapist_id,
            'approved',
            true,
            true,
            NOW(),
            NOW()
        )
        RETURNING id INTO profile_id;

        RAISE NOTICE 'Created therapist profile: %', profile_id;
    ELSE
        -- Update existing profile
        UPDATE therapist_profiles SET
            verification_status = 'approved',
            is_verified = true,
            is_active = true,
            updated_at = NOW()
        WHERE id = profile_id;

        RAISE NOTICE 'Updated therapist profile: %', profile_id;
    END IF;

    -- Show the result
    RAISE NOTICE '✅ Test therapist created/updated successfully!';
    RAISE NOTICE '   User ID: %', therapist_id;
    RAISE NOTICE '   Email: test.therapist@trpi.com';
    RAISE NOTICE '   Profile ID: %', profile_id;

END $$;

-- Verify the therapist was created
SELECT 
    u.id as user_id,
    u.email,
    u.full_name,
    u.user_type,
    u.is_active,
    u.is_verified,
    tp.id as profile_id,
    tp.verification_status,
    tp.is_verified as profile_verified
FROM users u
LEFT JOIN therapist_profiles tp ON u.id = tp.user_id
WHERE u.email = 'test.therapist@trpi.com';
