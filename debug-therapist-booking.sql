-- Debug script to check why booking is failing
-- Run this in Supabase SQL editor to see what's wrong

-- 1. Check if therapist_profiles has the right data
SELECT 
    '🎯 Therapist Profile Check:' as info,
    u.email,
    u.is_verified as user_verified,
    u.is_active as user_active,
    u.user_type,
    tp.id as profile_id,
    tp.verification_status,
    tp.is_verified as profile_verified,
    CASE 
        WHEN tp.verification_status = 'approved' 
             AND tp.is_verified = true 
             AND u.is_verified = true 
             AND u.is_active = true
        THEN '✅ Bookable'
        ELSE '❌ Not Bookable'
    END as booking_status
FROM users u
LEFT JOIN therapist_profiles tp ON u.id = tp.user_id
WHERE u.user_type = 'therapist'
ORDER BY u.email;

-- 2. Check if therapist_availability_weekly_schedules exists and has data
SELECT 
    '📅 Availability Check:' as info,
    COUNT(*) as schedule_count,
    therapist_id,
    is_active
FROM availability_weekly_schedules
GROUP BY therapist_id, is_active;

-- 3. Check therapist enrollments status
SELECT 
    '📋 Enrollment Check:' as info,
    te.email,
    te.status as enrollment_status,
    te.is_active as enrollment_active,
    u.is_verified as user_verified,
    u.is_active as user_active
FROM therapist_enrollments te
LEFT JOIN users u ON te.email = u.email
WHERE u.user_type = 'therapist'
ORDER BY te.email;

-- 4. Check for any missing therapist_profiles records
SELECT 
    '🔍 Missing Profiles:' as info,
    u.id,
    u.email,
    u.full_name
FROM users u
LEFT JOIN therapist_profiles tp ON u.id = tp.user_id
WHERE u.user_type = 'therapist'
  AND u.is_verified = true
  AND u.is_active = true
  AND tp.id IS NULL;

-- 5. Check for inconsistent verification_status
SELECT 
    '⚠️ Inconsistent Status:' as info,
    u.email,
    u.is_verified as user_verified,
    tp.verification_status,
    tp.is_verified as profile_verified,
    te.status as enrollment_status
FROM users u
LEFT JOIN therapist_profiles tp ON u.id = tp.user_id
LEFT JOIN therapist_enrollments te ON u.email = te.email
WHERE u.user_type = 'therapist'
  AND u.is_verified = true
  AND (
    tp.verification_status IS NULL 
    OR tp.verification_status != 'approved'
    OR tp.is_verified != true
  )
ORDER BY u.email;

