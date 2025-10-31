-- =============================================
-- FIX THERAPIST ENROLLMENT DATABASE INTEGRITY
-- Links therapist_enrollments to users table and creates therapist_profiles
-- =============================================

-- 1. Link therapist_enrollments to users table by email
UPDATE therapist_enrollments te
SET user_id = u.id,
    updated_at = NOW()
FROM users u
WHERE te.email = u.email
  AND te.user_id IS NULL
  AND u.user_type = 'therapist';

-- 2. Verify the links were created
SELECT 
    te.id as enrollment_id,
    te.email,
    te.user_id,
    u.id as users_table_id,
    u.user_type,
    u.is_verified,
    u.is_active
FROM therapist_enrollments te
LEFT JOIN users u ON te.user_id = u.id
WHERE te.user_id IS NULL OR te.user_id IS NOT NULL
ORDER BY te.created_at DESC
LIMIT 10;

-- 3. Create therapist_profiles entries for approved therapists
-- Insert with all available fields from therapist_enrollments
-- NOTE: We're using specific therapist data from the logs
INSERT INTO therapist_profiles (
    user_id,
    licensed_qualification,
    verification_status,
    is_verified,
    specialization,
    languages,
    bio,
    experience_years,
    hourly_rate,
    profile_image_url,
    created_at,
    updated_at
)
SELECT 
    u.id as user_id,
    COALESCE(te.licensed_qualification, 'Not specified') as licensed_qualification,
    CASE 
        WHEN te.status = 'approved' THEN 'approved'
        WHEN te.status = 'pending' THEN 'pending'
        ELSE 'pending'
    END as verification_status,
    (te.status = 'approved' AND te.is_active) as is_verified,
    te.specialization[1] as specialization,
    te.languages as languages,
    te.bio,
    COALESCE(te.experience_years, 0) as experience_years,
    COALESCE(te.hourly_rate, 0.00) as hourly_rate,
    te.profile_image_url,
    COALESCE(te.approved_at, te.created_at, NOW()) as created_at,
    NOW() as updated_at
FROM users u
INNER JOIN therapist_enrollments te ON te.email = u.email
WHERE u.user_type = 'therapist'
  AND te.status = 'approved'
  AND NOT EXISTS (
    SELECT 1 FROM therapist_profiles tp 
    WHERE tp.user_id = u.id
  );

-- 4. Verify therapist_profiles were created
SELECT 
    tp.id,
    tp.user_id,
    tp.verification_status,
    tp.is_verified,
    u.email,
    u.full_name,
    u.user_type
FROM therapist_profiles tp
LEFT JOIN users u ON tp.user_id = u.id
ORDER BY tp.created_at DESC
LIMIT 10;

-- 5. Check for any orphaned records
SELECT 
    'Users without therapist_profiles' as issue_type,
    u.id::text,
    u.email,
    u.user_type
FROM users u
WHERE u.user_type = 'therapist'
  AND NOT EXISTS (
    SELECT 1 FROM therapist_profiles tp WHERE tp.user_id = u.id
  )
UNION ALL
SELECT 
    'therapist_enrollments without user_id' as issue_type,
    te.id::text,
    te.email,
    NULL::text as user_type
FROM therapist_enrollments te
WHERE te.user_id IS NULL;

-- 6. Summary report
SELECT 
    (SELECT COUNT(*) FROM users WHERE user_type = 'therapist') as total_therapists,
    (SELECT COUNT(*) FROM therapist_profiles) as total_profiles,
    (SELECT COUNT(*) FROM therapist_enrollments WHERE user_id IS NOT NULL) as linked_enrollments,
    (SELECT COUNT(*) FROM therapist_enrollments WHERE user_id IS NULL) as orphaned_enrollments;

