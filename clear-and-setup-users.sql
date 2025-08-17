-- Clear all test users and therapist enrollments
-- This will remove any existing test data and start fresh

-- First, delete therapist enrollments
DELETE FROM therapist_enrollments 
WHERE email IN (
    'test@example.com',
    'therapist@test.com', 
    'michaelasereo@gmail.com',
    'asereope@gmail.com',
    'asereopeyemimichael@gmail.com'
);

-- Delete users
DELETE FROM users 
WHERE email IN (
    'test@example.com',
    'therapist@test.com',
    'user@test.com',
    'admin@test.com',
    'michaelasereo@gmail.com',
    'asereope@gmail.com', 
    'asereopeyemimichael@gmail.com'
);

-- Now create fresh users with real email addresses
INSERT INTO users (
    id,
    email,
    full_name,
    user_type,
    is_verified,
    created_at,
    updated_at
) VALUES 
-- Admin user
(
    gen_random_uuid(),
    'asereopeyemimichael@gmail.com',
    'Admin User',
    'admin',
    true,
    NOW(),
    NOW()
),
-- Therapist user  
(
    gen_random_uuid(),
    'michaelasereo@gmail.com',
    'Dr. Sarah Johnson',
    'therapist',
    true,
    NOW(),
    NOW()
),
-- Patient/Individual user
(
    gen_random_uuid(),
    'asereope@gmail.com',
    'John Doe',
    'individual',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    updated_at = NOW();

-- Create therapist enrollment record
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
) VALUES (
    'Dr. Sarah Johnson',
    'michaelasereo@gmail.com',
    '+234 801 234 5678',
    'MDCN12345',
    ARRAY['Cognitive Behavioral Therapy (CBT)', 'Anxiety & Stress Management'],
    ARRAY['English', 'Yoruba'],
    'pending', -- Will be approved by admin
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    updated_at = NOW();

-- Verify the setup
SELECT 
    'Users created:' as info,
    COUNT(*) as count
FROM users 
WHERE email IN ('asereopeyemimichael@gmail.com', 'michaelasereo@gmail.com', 'asereope@gmail.com')

UNION ALL

SELECT 
    'Therapist enrollments:' as info,
    COUNT(*) as count
FROM therapist_enrollments 
WHERE email = 'michaelasereo@gmail.com';

