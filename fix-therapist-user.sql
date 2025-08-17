-- Fix Therapist User
-- Run this if the therapist user_type is not set correctly

-- Update therapist user to have correct user_type
UPDATE users 
SET 
    user_type = 'therapist',
    is_verified = false,
    updated_at = NOW()
WHERE email = 'michaelasereo@gmail.com';

-- If user doesn't exist, create it
INSERT INTO users (
    id,
    email,
    full_name,
    user_type,
    is_verified,
    credits,
    package_type,
    created_at,
    updated_at
) 
SELECT 
    gen_random_uuid(),
    'michaelasereo@gmail.com',
    'Dr. Sarah Johnson',
    'therapist',
    false,
    0,
    'Therapist',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE email = 'michaelasereo@gmail.com'
);

-- Ensure therapist enrollment exists
INSERT INTO therapist_enrollments (
    full_name,
    email,
    phone,
    mdcn_code,
    specialization,
    languages,
    status,
    created_at,
    updated_at
) 
SELECT 
    'Dr. Sarah Johnson',
    'michaelasereo@gmail.com',
    '+234 801 234 5678',
    'MDCN12345',
    ARRAY['Cognitive Behavioral Therapy (CBT)', 'Anxiety & Stress Management'],
    ARRAY['English', 'Yoruba'],
    'pending',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM therapist_enrollments WHERE email = 'michaelasereo@gmail.com'
);

-- Verify the fix
SELECT 
    'User Table' as table_name,
    email,
    full_name,
    user_type,
    is_verified
FROM users 
WHERE email = 'michaelasereo@gmail.com';
