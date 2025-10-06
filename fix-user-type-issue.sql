-- Fix user type mismatch issue
-- This allows users to log in regardless of their stored user_type
-- During migration, we'll be more flexible with user types

-- Update the magic link verification to be more flexible
-- This is a temporary fix during migration period

-- First, let's see what user types we have
SELECT user_type, COUNT(*) as count 
FROM users 
GROUP BY user_type;

-- Option 1: Allow admin users to also log in as individual
-- (This is for migration flexibility)
UPDATE users 
SET user_type = 'individual' 
WHERE user_type = 'admin' AND email = 'asereopeyemimichael@gmail.com';

-- Option 2: Create a more flexible auth system
-- Add a column to track multiple user types
ALTER TABLE users ADD COLUMN IF NOT EXISTS allowed_user_types TEXT[];

-- Update existing users to have their current type in allowed_types
UPDATE users 
SET allowed_user_types = ARRAY[user_type] 
WHERE allowed_user_types IS NULL;

-- For the specific user, allow both admin and individual access
UPDATE users 
SET allowed_user_types = ARRAY['admin', 'individual']
WHERE email = 'asereopeyemimichael@gmail.com';
