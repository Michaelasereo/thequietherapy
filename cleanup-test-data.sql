-- Clean up test data for fresh testing
-- This will remove all test users, therapists, and partners

-- Delete test sessions first (foreign key constraints)
DELETE FROM session_notes WHERE session_id IN (
    SELECT id FROM sessions WHERE user_id IN (
        SELECT id FROM users WHERE email LIKE '%test%' OR email LIKE '%example%'
    )
);

DELETE FROM sessions WHERE user_id IN (
    SELECT id FROM users WHERE email LIKE '%test%' OR email LIKE '%example%'
);

-- Delete therapist enrollments
DELETE FROM therapist_enrollments WHERE email LIKE '%test%' OR email LIKE '%example%';

-- Delete therapist profiles
DELETE FROM therapist_profiles WHERE therapist_id IN (
    SELECT id FROM users WHERE email LIKE '%test%' OR email LIKE '%example%'
);

-- Delete therapist availability
DELETE FROM therapist_availability WHERE therapist_id IN (
    SELECT id FROM users WHERE email LIKE '%test%' OR email LIKE '%example%'
);

-- Delete user credits and packages
DELETE FROM user_credits WHERE user_id IN (
    SELECT id FROM users WHERE email LIKE '%test%' OR email LIKE '%example%'
);

DELETE FROM user_packages WHERE user_id IN (
    SELECT id FROM users WHERE email LIKE '%test%' OR email LIKE '%example%'
);

-- Delete auth sessions
DELETE FROM auth_sessions WHERE user_id IN (
    SELECT id FROM users WHERE email LIKE '%test%' OR email LIKE '%example%'
);

-- Delete verification tokens
DELETE FROM verification_tokens WHERE email LIKE '%test%' OR email LIKE '%example%';

-- Finally delete users
DELETE FROM users WHERE email LIKE '%test%' OR email LIKE '%example%';

-- Show remaining users for verification
SELECT 
    id, 
    email, 
    full_name, 
    user_type, 
    is_verified, 
    is_active,
    created_at
FROM users 
ORDER BY created_at DESC;
