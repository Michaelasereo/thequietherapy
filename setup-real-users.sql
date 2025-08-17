-- Setup Real Users for Live Testing
-- This script creates actual user accounts for testing the complete workflow

-- 1. Create Admin User
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
) VALUES (
    gen_random_uuid(),
    'asereopeyemimichael@gmail.com', -- Your actual admin email
    'Platform Administrator',
    'admin',
    true,
    0,
    'Admin',
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    user_type = 'admin',
    is_verified = true,
    updated_at = NOW();

-- 2. Create Therapist User
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
) VALUES (
    gen_random_uuid(),
    'michaelasereo@gmail.com', -- Your actual therapist email
    'Dr. Sarah Johnson',
    'therapist',
    false, -- Will be approved by admin
    0,
    'Therapist',
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    user_type = 'therapist',
    updated_at = NOW();

-- 3. Create Regular User (Patient)
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
) VALUES (
    gen_random_uuid(),
    'asereope@gmail.com', -- Your actual patient email
    'John Doe',
    'individual',
    true,
    20, -- Give some credits for testing
    'Standard',
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    credits = 20,
    package_type = 'Standard',
    updated_at = NOW();

-- 4. Create Therapist Profile (if therapist_enrollments table exists)
-- This will be populated when therapist completes enrollment
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

-- 5. Create some sample content for testing
INSERT INTO blog_posts (title, content, excerpt, author, category, tags, status, publish_date, views) VALUES
(
    'Welcome to Trpi Therapy Platform',
    'This is a test blog post to verify the content management system is working properly.',
    'A welcome message for new users.',
    'Platform Team',
    'Platform Updates',
    ARRAY['welcome', 'platform', 'introduction'],
    'published',
    NOW(),
    0
);

INSERT INTO faqs (question, answer, category, tags, status, helpful, not_helpful) VALUES
(
    'How do I start my first therapy session?',
    'To start your first therapy session, simply log in to your account, browse available therapists, and book a session that fits your schedule.',
    'Getting Started',
    ARRAY['first-session', 'booking', 'therapy'],
    'published',
    0,
    0
);

-- 6. Create notification settings for users
-- (This assumes you have a notifications table or similar)

-- Display the created users
SELECT 
    email,
    full_name,
    user_type,
    is_verified,
    credits,
    package_type,
    created_at
FROM users 
WHERE email IN ('asereopeyemimichael@gmail.com', 'michaelasereo@gmail.com', 'asereope@gmail.com')
ORDER BY user_type;

-- Display therapist enrollment status
SELECT 
    te.full_name,
    te.email,
    te.status,
    te.created_at
FROM therapist_enrollments te
WHERE te.email = 'michaelasereo@gmail.com';
