-- Verify Therapist User Fix
-- Run this after the fix script to confirm everything is working

-- Check user table
SELECT 
    'USER TABLE' as source,
    email,
    full_name,
    user_type,
    is_verified,
    created_at
FROM users 
WHERE email = 'michaelasereo@gmail.com';

-- Check enrollment table
SELECT 
    'ENROLLMENT TABLE' as source,
    email,
    full_name,
    status,
    created_at
FROM therapist_enrollments 
WHERE email = 'michaelasereo@gmail.com';

-- Summary
SELECT 
    'SUMMARY' as info,
    'Therapist user should now be able to login' as message;
