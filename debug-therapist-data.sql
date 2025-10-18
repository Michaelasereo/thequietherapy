-- Debug script to check therapist data in database
-- Run this in your Supabase SQL Editor to see what data exists

-- 1. Check if therapist_enrollments table exists and has data
SELECT 'therapist_enrollments table structure:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'therapist_enrollments' 
ORDER BY ordinal_position;

-- 2. Check if there are any therapist enrollments
SELECT 'therapist_enrollments data:' as info;
SELECT id, email, full_name, user_id, status, created_at 
FROM therapist_enrollments 
ORDER BY created_at DESC 
LIMIT 10;

-- 3. Check if therapist_profiles table exists and has data
SELECT 'therapist_profiles table structure:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'therapist_profiles' 
ORDER BY ordinal_position;

-- 4. Check if there are any therapist profiles
SELECT 'therapist_profiles data:' as info;
SELECT id, user_id, email, full_name, created_at 
FROM therapist_profiles 
ORDER BY created_at DESC 
LIMIT 10;

-- 5. Check users table for therapist users
SELECT 'users table - therapist users:' as info;
SELECT id, email, full_name, user_type, is_verified, created_at 
FROM users 
WHERE user_type = 'therapist' 
ORDER BY created_at DESC 
LIMIT 10;

-- 6. Check for any users with therapist emails
SELECT 'users table - potential therapist emails:' as info;
SELECT id, email, full_name, user_type, is_verified, created_at 
FROM users 
WHERE email LIKE '%@thequietherapy.live' 
ORDER BY created_at DESC 
LIMIT 10;
