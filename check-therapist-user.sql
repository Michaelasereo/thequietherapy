-- Check Therapist User Status
-- Run this to see if the therapist user was created correctly

-- Check if therapist user exists and has correct user_type
SELECT 
    id,
    email,
    full_name,
    user_type,
    is_verified,
    created_at,
    updated_at
FROM users 
WHERE email = 'michaelasereo@gmail.com';

-- Check if therapist enrollment exists
SELECT 
    id,
    full_name,
    email,
    status,
    created_at
FROM therapist_enrollments 
WHERE email = 'michaelasereo@gmail.com';

-- Check all users to see what's in the database
SELECT 
    email,
    full_name,
    user_type,
    is_verified,
    created_at
FROM users 
ORDER BY created_at DESC
LIMIT 10;
