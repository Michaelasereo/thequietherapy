-- Fix existing therapists to make them bookable
-- This will update ALL existing therapists to have proper therapist_profiles

-- First, check what therapists exist
SELECT 
    u.id,
    u.email,
    u.full_name,
    u.user_type,
    u.is_active,
    u.is_verified,
    tp.id as profile_id,
    tp.verification_status
FROM users u
LEFT JOIN therapist_profiles tp ON u.id = tp.user_id
WHERE u.user_type = 'therapist';

-- Now fix them all by ensuring they have proper profiles
DO $$
DECLARE
    therapist_record RECORD;
    profile_exists BOOLEAN;
BEGIN
    -- Loop through all therapists
    FOR therapist_record IN 
        SELECT id, email, full_name 
        FROM users 
        WHERE user_type = 'therapist'
    LOOP
        -- Check if profile exists
        SELECT EXISTS(
            SELECT 1 FROM therapist_profiles WHERE user_id = therapist_record.id
        ) INTO profile_exists;
        
        IF profile_exists THEN
            -- Update existing profile to approved (only set fields that exist)
            UPDATE therapist_profiles SET
                verification_status = 'approved',
                is_verified = true,
                updated_at = NOW()
            WHERE user_id = therapist_record.id;
            
            RAISE NOTICE 'Updated profile for therapist: % (%)', therapist_record.email, therapist_record.id;
        ELSE
            -- Create new profile (only include required fields)
            INSERT INTO therapist_profiles (
                id,
                user_id,
                verification_status,
                is_verified,
                created_at,
                updated_at
            )
            VALUES (
                gen_random_uuid(),
                therapist_record.id,
                'approved',
                true,
                NOW(),
                NOW()
            );
            
            RAISE NOTICE 'Created profile for therapist: % (%)', therapist_record.email, therapist_record.id;
        END IF;
    END LOOP;
    
    RAISE NOTICE '✅ All therapists have been fixed!';
END $$;

-- Show the result
SELECT 
    u.id,
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
WHERE u.user_type = 'therapist';

-- Also ensure all therapists are active and verified
UPDATE users SET
    is_active = true,
    is_verified = true
WHERE user_type = 'therapist';

SELECT '✅ All therapists are now active and verified!' as status;

