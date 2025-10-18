-- ============================================
-- CHECK CEO ACCOUNT PROFILE IMAGE STATUS
-- ============================================
-- This will help us understand why profile_image_url is undefined
-- ============================================

-- Check users table (profile_image_url doesn't exist here)
SELECT 
  'USERS TABLE' as table_name,
  email,
  full_name,
  is_verified,
  is_active
FROM users 
WHERE email = 'ceo@thequietherapy.live';

-- Check therapist_profiles table
SELECT 
  'THERAPIST_PROFILES TABLE' as table_name,
  user_id,
  profile_image_url,
  created_at,
  updated_at
FROM therapist_profiles 
WHERE user_id = (
  SELECT id FROM users WHERE email = 'ceo@thequietherapy.live'
);

-- Check therapist_enrollments table
SELECT 
  'THERAPIST_ENROLLMENTS TABLE' as table_name,
  email,
  user_id,
  status,
  is_active,
  profile_image_url,
  created_at,
  updated_at
FROM therapist_enrollments 
WHERE email = 'ceo@thequietherapy.live';

-- Summary of all profile image sources (users table doesn't have profile_image_url)
SELECT 
  'SUMMARY' as info,
  u.email,
  tp.profile_image_url as profiles_profile_image,
  te.profile_image_url as enrollments_profile_image,
  CASE 
    WHEN te.profile_image_url IS NOT NULL THEN te.profile_image_url
    WHEN tp.profile_image_url IS NOT NULL THEN tp.profile_image_url
    ELSE 'NO PROFILE IMAGE FOUND'
  END as final_profile_image_url
FROM users u
LEFT JOIN therapist_profiles tp ON u.id = tp.user_id
LEFT JOIN therapist_enrollments te ON u.email = te.email
WHERE u.email = 'ceo@thequietherapy.live';
