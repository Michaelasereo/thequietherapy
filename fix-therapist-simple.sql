-- =============================================
-- SIMPLE FIX: Link therapist_enrollments to users
-- =============================================

-- Step 1: Link therapist_enrollments to users table by email
UPDATE therapist_enrollments te
SET user_id = u.id,
    updated_at = NOW()
FROM users u
WHERE te.email = u.email
  AND te.user_id IS NULL
  AND u.user_type = 'therapist';

-- Step 2: Verify the fix
SELECT 
    'therapist_enrollments' as table_name,
    te.email,
    te.user_id,
    u.id as matched_user_id,
    u.user_type
FROM therapist_enrollments te
LEFT JOIN users u ON te.user_id = u.id
WHERE te.email = 'michaelasereo@gmail.com';

-- Step 3: Create therapist_profiles entry
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
    created_at,
    updated_at
)
SELECT 
    u.id as user_id,
    COALESCE(te.licensed_qualification, 'Not specified') as licensed_qualification,
    'approved' as verification_status,
    true as is_verified,
    te.specialization[1] as specialization,
    te.languages as languages,
    te.bio,
    COALESCE(te.experience_years, 0) as experience_years,
    COALESCE(te.hourly_rate, 0.00) as hourly_rate,
    NOW() as created_at,
    NOW() as updated_at
FROM users u
INNER JOIN therapist_enrollments te ON te.email = u.email
WHERE u.email = 'michaelasereo@gmail.com'
  AND u.user_type = 'therapist'
  AND NOT EXISTS (
    SELECT 1 FROM therapist_profiles tp WHERE tp.user_id = u.id
  );

-- Step 4: Verify therapist_profiles was created
SELECT 
    tp.id,
    tp.user_id,
    tp.verification_status,
    tp.is_verified,
    u.email,
    u.full_name
FROM therapist_profiles tp
LEFT JOIN users u ON tp.user_id = u.id
WHERE u.email = 'michaelasereo@gmail.com';

