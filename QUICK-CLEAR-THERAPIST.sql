-- Quick Clear: Delete specific therapist (ceo@thequietherapy.live)
-- Copy and run this in Supabase SQL Editor

-- Delete enrollment
DELETE FROM therapist_enrollments WHERE email = 'ceo@thequietherapy.live';

-- Delete user account
DELETE FROM users WHERE email = 'ceo@thequietherapy.live';

-- Verify it's gone
SELECT 'Therapists remaining' as status, COUNT(*) as count FROM therapist_enrollments;

