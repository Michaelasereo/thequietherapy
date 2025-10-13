-- ================================================
-- QUICK TEST ACCOUNTS - FIXED VERSION
-- Run this in Supabase NOW!
-- ================================================

BEGIN;

-- Clean up any existing quick test accounts first
DELETE FROM session_notes WHERE session_id IN (
  SELECT id FROM sessions WHERE user_id IN (
    SELECT id FROM users WHERE email LIKE 'quicktest-%@test.com'
  ) OR therapist_id IN (
    SELECT id FROM users WHERE email LIKE 'quicktest-%@test.com'
  )
);

DELETE FROM sessions WHERE user_id IN (
  SELECT id FROM users WHERE email LIKE 'quicktest-%@test.com'
) OR therapist_id IN (
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
    full_name,
    user_type,
    is_verified,
    is_active,
    credits,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    'quicktest-therapist@test.com',
    'Quick Test Therapist',
    'therapist',
    true,
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
    full_name,
    user_type,
    is_verified,
    is_active,
    credits,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    'quicktest-patient@test.com',
    'Quick Test Patient',
    'individual',
    true,
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
  '✅ TEST ACCOUNTS CREATED!' as status,
  email,
  user_type,
  is_verified,
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
-- SUCCESS! NOW TEST THE VIDEO FLOW
-- ================================================

/*
✅ ACCOUNTS READY:
- Therapist: quicktest-therapist@test.com
- Patient: quicktest-patient@test.com (20 credits)

🚀 NEXT STEPS:

1. Therapist Login:
   → Go to: http://localhost:3000/therapist/login
   → Email: quicktest-therapist@test.com
   → Check terminal/email for magic link

2. Set Availability:
   → Dashboard → Availability
   → Add TODAY, time: NOW to +2 hours
   → Save

3. Patient Login (Incognito):
   → Go to: http://localhost:3000/login
   → Email: quicktest-patient@test.com
   → Check magic link

4. Book Session:
   → Book Session → Select therapist
   → Choose time slot 5-10 min from now
   → Confirm

5. Join Video Call:
   → Both dashboards → "Join Session"
   → Allow camera/mic
   → Have conversation for 3-5 minutes
   → End session

6. Check Results:
   → Therapist Dashboard → Client Sessions
   → View completed session
   → See transcript & AI SOAP notes!

⏱️ TOTAL TIME: ~20 minutes
📝 WHAT YOU'LL SEE: Full transcript + AI-generated SOAP notes
*/

