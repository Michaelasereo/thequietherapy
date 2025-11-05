-- =============================================
-- CHECK BOOKING & AVAILABILITY STATUS
-- This script checks if therapists have availability configured
-- and if the booking system should be working
-- =============================================

-- Step 1: Check if therapists have availability configured
SELECT 
    '📅 Therapist Availability Status:' as check_type,
    u.id as therapist_id,
    u.email,
    u.full_name,
    u.is_active as user_active,
    u.is_verified as user_verified,
    te.status as enrollment_status,
    te.is_active as enrollment_active,
    CASE 
        WHEN aws.therapist_id IS NOT NULL THEN '✅ Configured'
        ELSE '❌ Not Configured'
    END as availability_status,
    CASE 
        WHEN aws.weekly_availability IS NOT NULL THEN 
            CASE 
                WHEN (aws.weekly_availability->'standardHours') IS NOT NULL THEN 'Has Weekly Schedule'
                ELSE 'No Weekly Schedule'
            END
        ELSE 'No Availability Data'
    END as availability_details,
    CASE 
        WHEN u.user_type = 'therapist' 
            AND u.is_active = true 
            AND u.is_verified = true 
            AND te.status = 'approved' 
            AND te.is_active = true
            AND aws.therapist_id IS NOT NULL
            AND aws.is_active = true
            AND (aws.weekly_availability->'standardHours') IS NOT NULL
        THEN '✅ Ready for Bookings'
        ELSE '❌ Not Ready for Bookings'
    END as booking_status,
    CASE 
        WHEN u.user_type != 'therapist' THEN '❌ Wrong user_type'
        WHEN u.is_active = false THEN '❌ User not active'
        WHEN u.is_verified = false THEN '❌ User not verified'
        WHEN te.status != 'approved' THEN '❌ Enrollment not approved'
        WHEN te.is_active = false THEN '❌ Enrollment not active'
        WHEN aws.therapist_id IS NULL THEN '❌ No availability configured'
        WHEN aws.is_active = false THEN '❌ Availability not active'
        WHEN (aws.weekly_availability->'standardHours') IS NULL THEN '❌ No weekly schedule'
        ELSE '✅ All checks passed'
    END as reason
FROM users u
LEFT JOIN therapist_enrollments te ON u.email = te.email
LEFT JOIN availability_weekly_schedules aws ON u.id = aws.therapist_id AND aws.is_active = true
WHERE u.user_type = 'therapist'
ORDER BY 
    CASE 
        WHEN u.user_type = 'therapist' 
            AND u.is_active = true 
            AND u.is_verified = true 
            AND te.status = 'approved' 
            AND te.is_active = true
            AND aws.therapist_id IS NOT NULL
            AND aws.is_active = true
            AND (aws.weekly_availability->'standardHours') IS NOT NULL
        THEN 1
        ELSE 2
    END,
    u.created_at DESC;

-- Step 2: Check specific day availability (for today)
SELECT 
    '📅 Today''s Availability Check:' as check_type,
    u.id as therapist_id,
    u.email,
    u.full_name,
    aws.weekly_availability->'standardHours'->LOWER(TO_CHAR(NOW(), 'Day')) as today_availability,
    CASE 
        WHEN (aws.weekly_availability->'standardHours'->LOWER(TO_CHAR(NOW(), 'Day'))->>'enabled')::boolean = true 
        THEN '✅ Available Today'
        ELSE '❌ Not Available Today'
    END as today_status
FROM users u
LEFT JOIN therapist_enrollments te ON u.email = te.email
LEFT JOIN availability_weekly_schedules aws ON u.id = aws.therapist_id AND aws.is_active = true
WHERE u.user_type = 'therapist'
  AND u.is_active = true
  AND u.is_verified = true
  AND te.status = 'approved'
  AND te.is_active = true
  AND aws.therapist_id IS NOT NULL;

-- Step 3: Sample availability structure (shows first therapist's availability)
SELECT 
    '📋 Sample Availability Structure:' as check_type,
    u.id as therapist_id,
    u.email,
    u.full_name,
    aws.weekly_availability as full_availability_json
FROM users u
LEFT JOIN availability_weekly_schedules aws ON u.id = aws.therapist_id AND aws.is_active = true
WHERE u.user_type = 'therapist'
  AND aws.weekly_availability IS NOT NULL
LIMIT 1;

-- Step 4: Count therapists ready for bookings
SELECT 
    '📊 Summary:' as check_type,
    COUNT(*) FILTER (WHERE 
        u.user_type = 'therapist' 
        AND u.is_active = true 
        AND u.is_verified = true 
        AND te.status = 'approved' 
        AND te.is_active = true
        AND aws.therapist_id IS NOT NULL
        AND aws.is_active = true
        AND (aws.weekly_availability->'standardHours') IS NOT NULL
    ) as ready_for_bookings,
    COUNT(*) FILTER (WHERE 
        u.user_type = 'therapist'
    ) as total_therapists,
    COUNT(*) FILTER (WHERE 
        u.user_type = 'therapist'
        AND u.is_active = true 
        AND u.is_verified = true 
        AND te.status = 'approved' 
        AND te.is_active = true
    ) as active_and_approved,
    COUNT(*) FILTER (WHERE 
        u.user_type = 'therapist'
        AND aws.therapist_id IS NOT NULL
        AND aws.is_active = true
    ) as has_availability_configured
FROM users u
LEFT JOIN therapist_enrollments te ON u.email = te.email
LEFT JOIN availability_weekly_schedules aws ON u.id = aws.therapist_id AND aws.is_active = true;

