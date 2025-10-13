-- ================================================
-- QUICK TEST ACCOUNTS - Run this in Supabase NOW!
-- ================================================

-- This creates ready-to-use test accounts for immediate testing

BEGIN;

-- Clean up any existing quick test accounts first
DELETE FROM session_notes WHERE session_id IN (
  SELECT id FROM sessions WHERE user_id IN (
    SELECT id FROM users WHERE email LIKE 'quicktest-%@test.com'
  )
);
DELETE FROM sessions WHERE user_id IN (
  SELECT id FROM users WHERE email LIKE 'quicktest-%@test.com'
);
DELETE FROM therapist_availability WHERE therapist_id IN (
  SELECT id FROM users WHERE email = 'quicktest-therapist@test.com'
);
DELETE FROM therapist_profiles WHERE user_id IN (
  SELECT id FROM users WHERE email = 'quicktest-therapist@test.com'
);
DELETE FROM users WHERE email LIKE 'quicktest-%@test.com';

-- Create Therapist Account
DO $$
DECLARE
  v_therapist_id UUID;
BEGIN
  -- Insert therapist user
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
    'quicktest-therapist@test.com',
    'therapist',
    true,
    0,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_therapist_id;

  -- Insert therapist profile
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
    v_therapist_id,
    'Quick Test Therapist',
    'Clinical Psychology',
    'TEST-001',
    5,
    'Test therapist account for video session testing',
    5000,
    true,
    true,
    NOW(),
    NOW()
  );

  RAISE NOTICE '✅ Therapist created: % (ID: %)', 'quicktest-therapist@test.com', v_therapist_id;
END $$;

-- Create Patient Account with Credits
DO $$
DECLARE
  v_patient_id UUID;
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
    'quicktest-patient@test.com',
    'individual',
    true,
    20, -- Lots of credits for testing
    NOW(),
    NOW()
  )
  RETURNING id INTO v_patient_id;

  RAISE NOTICE '✅ Patient created: % (ID: %) with 20 credits', 'quicktest-patient@test.com', v_patient_id;
END $$;

COMMIT;

-- Verify accounts
SELECT 
  '✅ ACCOUNTS CREATED!' as status,
  email,
  user_type,
  email_verified,
  credits,
  id
FROM users 
WHERE email LIKE 'quicktest-%@test.com'
ORDER BY user_type;

-- Show therapist profile
SELECT 
  '✅ THERAPIST PROFILE' as status,
  tp.full_name,
  tp.specialization,
  tp.is_verified,
  tp.is_active,
  u.email
FROM therapist_profiles tp
JOIN users u ON u.id = tp.user_id
WHERE u.email = 'quicktest-therapist@test.com';

-- ================================================
-- NOW YOU CAN TEST!
-- ================================================

/*
LOGIN CREDENTIALS:
- Therapist: quicktest-therapist@test.com
- Patient: quicktest-patient@test.com

NEXT STEPS:
1. Go to http://localhost:3000/therapist/login
2. Login with quicktest-therapist@test.com
3. Set availability for NOW to +2 hours
4. Open incognito window
5. Go to http://localhost:3000/login
6. Login with quicktest-patient@test.com
7. Book a session 5 minutes from now
8. Join video session
9. Have a test conversation
10. Check dashboard for transcript and SOAP notes!
*/

