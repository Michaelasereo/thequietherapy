-- =============================================
-- DIAGNOSTIC: Therapist Booking Availability Issue
-- Use this to diagnose why a therapist shows as "not available for bookings"
-- =============================================

-- Step 1: Find the therapist (you can search by email or ID)
-- Replace 'therapist-email@example.com' with the actual therapist email
-- OR replace with therapist ID if you have it

-- Option A: Search by email
-- SELECT 
--     '🔍 Therapist User Info:' as check_type,
--     id,
--     email,
--     full_name,
--     user_type,
--     is_active,
--     is_verified,
--     created_at
-- FROM users 
-- WHERE email = 'therapist-email@example.com';

-- Option B: Search by ID (if you have the therapist ID from the error)
-- SELECT 
--     '🔍 Therapist User Info:' as check_type,
--     id,
--     email,
--     full_name,
--     user_type,
--     is_active,
--     is_verified,
--     created_at
-- FROM users 
-- WHERE id = 'therapist-id-here';

-- Step 2: Check therapist enrollment status
-- SELECT 
--     '📋 Therapist Enrollment Status:' as check_type,
--     te.id,
--     te.email,
--     te.status,
--     te.is_active,
--     te.created_at,
--     te.updated_at
-- FROM therapist_enrollments te
-- WHERE te.email = (
--     SELECT email FROM users WHERE id = 'therapist-id-here'
--     -- OR: WHERE email = 'therapist-email@example.com'
-- );

-- Step 3: Check therapist availability
-- SELECT 
--     '📅 Therapist Availability:' as check_type,
--     aws.therapist_id,
--     aws.is_active,
--     aws.weekly_availability,
--     aws.created_at,
--     aws.updated_at
-- FROM availability_weekly_schedules aws
-- WHERE aws.therapist_id = 'therapist-id-here'
-- AND aws.is_active = true;

-- Step 4: Comprehensive check for ALL therapists
-- This shows all therapists and their booking availability status
SELECT 
    '🔍 Comprehensive Therapist Status Check:' as check_type,
    u.id as therapist_id,
    u.email,
    u.full_name,
    u.user_type,
    u.is_active as user_is_active,
    u.is_verified as user_is_verified,
    te.status as enrollment_status,
    te.is_active as enrollment_is_active,
    CASE 
        WHEN aws.therapist_id IS NOT NULL THEN 'Configured'
        ELSE 'Not Configured'
    END as availability_status,
    CASE 
        WHEN u.user_type = 'therapist' 
            AND u.is_active = true 
            AND u.is_verified = true 
            AND te.status = 'approved' 
            AND te.is_active = true
            AND aws.therapist_id IS NOT NULL
            AND aws.is_active = true
        THEN '✅ Available for Bookings'
        ELSE '❌ Not Available for Bookings'
    END as booking_status,
    CASE 
        WHEN u.user_type != 'therapist' THEN '❌ Wrong user_type'
        WHEN u.is_active = false THEN '❌ User not active'
        WHEN u.is_verified = false THEN '❌ User not verified'
        WHEN te.status != 'approved' THEN '❌ Enrollment not approved'
        WHEN te.is_active = false THEN '❌ Enrollment not active'
        WHEN aws.therapist_id IS NULL THEN '❌ No availability configured'
        WHEN aws.is_active = false THEN '❌ Availability not active'
        ELSE '✅ All checks passed'
    END as reason
FROM users u
LEFT JOIN therapist_enrollments te ON u.email = te.email
LEFT JOIN availability_weekly_schedules aws ON u.id = aws.therapist_id AND aws.is_active = true
WHERE u.user_type = 'therapist'
ORDER BY u.created_at DESC;

-- Step 5: Quick fix - Update therapist to be active and verified (if needed)
-- ⚠️ Only run this if you want to make a therapist available
-- UPDATE users 
-- SET is_active = true, is_verified = true
-- WHERE id = 'therapist-id-here' 
--   AND user_type = 'therapist';

-- Step 6: Quick fix - Approve therapist enrollment (if needed)
-- ⚠️ Only run this if you want to approve a therapist
-- UPDATE therapist_enrollments 
-- SET status = 'approved', is_active = true
-- WHERE email = (
--     SELECT email FROM users WHERE id = 'therapist-id-here'
-- );

