-- QUICK CLEAR CEO THERAPIST ACCOUNT
-- Copy and paste this into Supabase SQL Editor and run it

-- Delete all records for ceo@thequietherapy.live
DELETE FROM magic_links WHERE email = 'ceo@thequietherapy.live';
DELETE FROM user_sessions WHERE user_id IN (SELECT id FROM users WHERE email = 'ceo@thequietherapy.live');
DELETE FROM therapist_enrollments WHERE email = 'ceo@thequietherapy.live';
DELETE FROM therapist_profiles WHERE user_id IN (SELECT id FROM users WHERE email = 'ceo@thequietherapy.live');
DELETE FROM users WHERE email = 'ceo@thequietherapy.live';

-- Verify deletion (should all show 0)
SELECT 
    'users' as table_name, COUNT(*) as records FROM users WHERE email = 'ceo@thequietherapy.live'
UNION ALL
SELECT 'therapist_enrollments', COUNT(*) FROM therapist_enrollments WHERE email = 'ceo@thequietherapy.live'
UNION ALL
SELECT 'magic_links', COUNT(*) FROM magic_links WHERE email = 'ceo@thequietherapy.live';

-- Success message
SELECT '✅ CEO account cleared - ready for fresh enrollment!' as status;

