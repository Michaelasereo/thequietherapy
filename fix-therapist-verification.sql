-- Fix therapist verification status
-- This script will mark all existing therapist users as verified
-- since they've already gone through the magic link process

-- First, let's see the current state
SELECT 
    id,
    email,
    full_name,
    user_type,
    is_verified,
    created_at,
    last_login_at
FROM users 
WHERE user_type = 'therapist'
ORDER BY created_at DESC;

-- Update all therapist users to be verified
-- (This assumes they've already completed the magic link verification)
UPDATE users 
SET is_verified = true
WHERE user_type = 'therapist' 
AND is_verified = false;

-- Show the updated state
SELECT 
    id,
    email,
    full_name,
    user_type,
    is_verified,
    created_at,
    last_login_at
FROM users 
WHERE user_type = 'therapist'
ORDER BY created_at DESC;
