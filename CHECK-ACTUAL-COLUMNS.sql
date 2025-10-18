-- ============================================
-- CHECK ACTUAL COLUMN STRUCTURE
-- ============================================
-- Let's see what columns actually exist in each table
-- ============================================

-- Check users table structure
SELECT 
  'USERS TABLE COLUMNS' as info,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check therapist_profiles table structure
SELECT 
  'THERAPIST_PROFILES TABLE COLUMNS' as info,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'therapist_profiles' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check therapist_enrollments table structure
SELECT 
  'THERAPIST_ENROLLMENTS TABLE COLUMNS' as info,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'therapist_enrollments' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check CEO account data with correct column names
SELECT 
  'CEO ACCOUNT DATA' as info,
  u.email,
  u.full_name,
  u.is_verified,
  u.is_active,
  te.status as enrollment_status,
  te.is_active as enrollment_active
FROM users u
LEFT JOIN therapist_enrollments te ON u.email = te.email
WHERE u.email = 'ceo@thequietherapy.live';
