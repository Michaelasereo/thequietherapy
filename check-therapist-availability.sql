-- Quick check script to see if therapist has availability configured

-- Replace with your therapist's email
\set therapist_email 'therapist@example.com'

-- 1. Find therapist ID
SELECT 
    'Therapist Info:' as check_type,
    u.id,
    u.email,
    u.full_name,
    u.is_verified,
    u.is_active
FROM users u
WHERE u.email = :'therapist_email' AND u.user_type = 'therapist';

-- 2. Check if they have availability configured
SELECT 
    'Availability Check:' as check_type,
    aws.id,
    aws.therapist_id,
    aws.template_name,
    aws.is_active,
    aws.updated_at,
    CASE 
        WHEN aws.weekly_availability IS NOT NULL 
        THEN '✅ Has availability'
        ELSE '❌ No availability data'
    END as status
FROM availability_weekly_schedules aws
JOIN users u ON aws.therapist_id = u.id
WHERE u.email = :'therapist_email';

-- 3. Check therapist_profiles
SELECT 
    'Profile Check:' as check_type,
    tp.id,
    tp.user_id,
    tp.verification_status,
    tp.is_verified,
    CASE 
        WHEN tp.verification_status = 'approved' AND tp.is_verified = true
        THEN '✅ Bookable'
        ELSE '❌ Not bookable'
    END as booking_status
FROM therapist_profiles tp
JOIN users u ON tp.user_id = u.id
WHERE u.email = :'therapist_email';

