-- Simple fix for user type mismatch issue
-- This allows the specific user to log in as individual

-- Option 1: Change the user's type to individual (simplest fix)
UPDATE users 
SET user_type = 'individual' 
WHERE email = 'asereopeyemimichael@gmail.com';

-- Verify the change
SELECT email, user_type FROM users WHERE email = 'asereopeyemimichael@gmail.com';
