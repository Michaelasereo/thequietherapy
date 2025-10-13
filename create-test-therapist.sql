-- ================================================
-- CREATE TEST THERAPIST ACCOUNTS FOR VIDEO TESTING
-- Run this in your Supabase SQL Editor
-- ================================================

-- TEST THERAPIST 1
-- Email: test-therapist-1@quiet-therapy.com
-- Password: Use magic link authentication

DO $$
DECLARE
  therapist_user_id UUID;
BEGIN
  -- Create user account
  INSERT INTO users (
    id,
    email,
    user_type,
    email_verified,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    'test-therapist-1@quiet-therapy.com',
    'therapist',
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (email) DO UPDATE
    SET user_type = 'therapist',
        email_verified = true
  RETURNING id INTO therapist_user_id;

  -- Create therapist profile
  INSERT INTO therapist_profiles (
    id,
    user_id,
    full_name,
    specialization,
    license_number,
    years_of_experience,
    bio,
    hourly_rate,
    is_verified,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    therapist_user_id,
    'Dr. Sarah Johnson',
    'Clinical Psychology',
    'NIG-PSY-2024-001',
    8,
    'Specialized in healthcare worker burnout and stress management. Over 8 years of experience working with medical professionals.',
    5000,
    true,
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE
    SET full_name = 'Dr. Sarah Johnson',
        specialization = 'Clinical Psychology',
        is_verified = true,
        is_active = true;

  RAISE NOTICE 'Test Therapist 1 created: %', therapist_user_id;
END $$;

-- TEST THERAPIST 2
-- Email: test-therapist-2@quiet-therapy.com

DO $$
DECLARE
  therapist_user_id UUID;
BEGIN
  INSERT INTO users (
    id,
    email,
    user_type,
    email_verified,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    'test-therapist-2@quiet-therapy.com',
    'therapist',
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (email) DO UPDATE
    SET user_type = 'therapist',
        email_verified = true
  RETURNING id INTO therapist_user_id;

  INSERT INTO therapist_profiles (
    id,
    user_id,
    full_name,
    specialization,
    license_number,
    years_of_experience,
    bio,
    hourly_rate,
    is_verified,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    therapist_user_id,
    'Dr. Ibrahim Okonkwo',
    'Counseling Psychology',
    'NIG-PSY-2024-002',
    12,
    'Expert in trauma therapy and PTSD, particularly for healthcare professionals dealing with patient loss.',
    6000,
    true,
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE
    SET full_name = 'Dr. Ibrahim Okonkwo',
        specialization = 'Counseling Psychology',
        is_verified = true,
        is_active = true;

  RAISE NOTICE 'Test Therapist 2 created: %', therapist_user_id;
END $$;

-- TEST PATIENT ACCOUNTS
-- Email: test-patient-1@quiet-therapy.com

DO $$
DECLARE
  patient_user_id UUID;
BEGIN
  INSERT INTO users (
    id,
    email,
    user_type,
    email_verified,
    credits,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    'test-patient-1@quiet-therapy.com',
    'individual',
    true,
    10, -- Give 10 test credits
    NOW(),
    NOW()
  )
  ON CONFLICT (email) DO UPDATE
    SET user_type = 'individual',
        email_verified = true,
        credits = 10
  RETURNING id INTO patient_user_id;

  RAISE NOTICE 'Test Patient 1 created: %', patient_user_id;
END $$;

-- TEST PATIENT 2
DO $$
DECLARE
  patient_user_id UUID;
BEGIN
  INSERT INTO users (
    id,
    email,
    user_type,
    email_verified,
    credits,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    'test-patient-2@quiet-therapy.com',
    'individual',
    true,
    10,
    NOW(),
    NOW()
  )
  ON CONFLICT (email) DO UPDATE
    SET user_type = 'individual',
        email_verified = true,
        credits = 10
  RETURNING id INTO patient_user_id;

  RAISE NOTICE 'Test Patient 2 created: %', patient_user_id;
END $$;

-- Verify accounts created
SELECT 
  u.email,
  u.user_type,
  u.email_verified,
  u.credits,
  tp.full_name,
  tp.specialization,
  tp.is_verified AS therapist_verified
FROM users u
LEFT JOIN therapist_profiles tp ON tp.user_id = u.id
WHERE u.email LIKE 'test-%@quiet-therapy.com'
ORDER BY u.user_type, u.email;

-- ================================================
-- USAGE INSTRUCTIONS
-- ================================================

/*
1. Run this entire script in Supabase SQL Editor

2. Test accounts created:
   
   THERAPISTS:
   - test-therapist-1@quiet-therapy.com (Dr. Sarah Johnson)
   - test-therapist-2@quiet-therapy.com (Dr. Ibrahim Okonkwo)
   
   PATIENTS:
   - test-patient-1@quiet-therapy.com (10 credits)
   - test-patient-2@quiet-therapy.com (10 credits)

3. Login using magic links:
   - Therapists: https://your-app.com/therapist/login
   - Patients: https://your-app.com/login

4. After testing, you can:
   - Keep accounts for more testing
   - Delete with: DELETE FROM users WHERE email LIKE 'test-%@quiet-therapy.com';
   - Reset credits with: UPDATE users SET credits = 10 WHERE email LIKE 'test-patient%';

5. Check created accounts:
   SELECT email, user_type, credits FROM users WHERE email LIKE 'test-%@quiet-therapy.com';
*/

-- ================================================
-- CLEANUP (Optional - only run if you want to remove test accounts)
-- ================================================

-- Uncomment to delete all test accounts:
-- DELETE FROM session_notes WHERE session_id IN (
--   SELECT id FROM sessions WHERE user_id IN (
--     SELECT id FROM users WHERE email LIKE 'test-%@quiet-therapy.com'
--   )
-- );
-- DELETE FROM sessions WHERE user_id IN (
--   SELECT id FROM users WHERE email LIKE 'test-%@quiet-therapy.com'
-- );
-- DELETE FROM therapist_profiles WHERE user_id IN (
--   SELECT id FROM users WHERE email LIKE 'test-%@quiet-therapy.com'
-- );
-- DELETE FROM users WHERE email LIKE 'test-%@quiet-therapy.com';

