-- Clear test users from database
-- This script removes test users while preserving dummy/sample data

-- First, let's see what users we have
SELECT 'Current users before cleanup:' as info;
SELECT id, email, full_name, user_type, is_verified, created_at 
FROM users 
ORDER BY created_at DESC;

-- Delete test users (emails containing 'test', 'debug', or specific test domains)
DELETE FROM users 
WHERE email LIKE '%test%' 
   OR email LIKE '%debug%' 
   OR email LIKE '%@example.com'
   OR email LIKE '%@gmail.com'
   OR email LIKE '%@opportunedesignco.com';

-- Also delete any magic links for these users
DELETE FROM magic_links 
WHERE email LIKE '%test%' 
   OR email LIKE '%debug%' 
   OR email LIKE '%@example.com'
   OR email LIKE '%@gmail.com'
   OR email LIKE '%@opportunedesignco.com';

-- Show remaining users (should only be dummy data)
SELECT 'Remaining users after cleanup:' as info;
SELECT id, email, full_name, user_type, is_verified, created_at 
FROM users 
ORDER BY created_at DESC;

-- Show remaining magic links
SELECT 'Remaining magic links:' as info;
SELECT email, type, created_at 
FROM magic_links 
ORDER BY created_at DESC;
