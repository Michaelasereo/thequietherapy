-- COMPLETE DATA CLEANUP - REMOVES ALL USERS AND RELATED DATA
-- WARNING: This will delete ALL data in the database
-- Use this only for development/testing purposes

-- Disable foreign key checks temporarily
SET session_replication_role = replica;

-- Delete all data in dependency order (child tables first)

-- 1. Delete session notes
DELETE FROM session_notes;

-- 2. Delete sessions
DELETE FROM sessions;

-- 3. Delete user sessions (auth sessions)
DELETE FROM user_sessions;

-- 4. Delete magic links
DELETE FROM magic_links;

-- 5. Delete verification tokens
DELETE FROM verification_tokens;

-- 6. Delete therapist enrollments
DELETE FROM therapist_enrollments;

-- 7. Delete therapist profiles
DELETE FROM therapist_profiles;

-- 8. Delete therapist availability
DELETE FROM therapist_availability;

-- 9. Delete user credits
DELETE FROM user_credits;

-- 10. Delete user packages
DELETE FROM user_packages;

-- 11. Delete payments
DELETE FROM payments;

-- 12. Delete credits
DELETE FROM credits;

-- 13. Delete partner members
DELETE FROM partner_members;

-- 14. Delete partners
DELETE FROM partners;

-- 15. Delete content
DELETE FROM content;

-- 16. Delete admin logs
DELETE FROM admin_logs;

-- 17. Finally delete all users
DELETE FROM users;

-- Re-enable foreign key checks
SET session_replication_role = DEFAULT;

-- Reset sequences to start from 1
-- Note: Adjust sequence names based on your actual table structure
-- ALTER SEQUENCE users_id_seq RESTART WITH 1;
-- ALTER SEQUENCE sessions_id_seq RESTART WITH 1;
-- ALTER SEQUENCE therapist_profiles_id_seq RESTART WITH 1;

-- Show confirmation
SELECT 'All data has been cleared successfully!' as status;

-- Show remaining tables (should be empty)
SELECT 
    'users' as table_name, 
    COUNT(*) as remaining_records 
FROM users
UNION ALL
SELECT 
    'sessions' as table_name, 
    COUNT(*) as remaining_records 
FROM sessions
UNION ALL
SELECT 
    'therapist_profiles' as table_name, 
    COUNT(*) as remaining_records 
FROM therapist_profiles
UNION ALL
SELECT 
    'therapist_enrollments' as table_name, 
    COUNT(*) as remaining_records 
FROM therapist_enrollments
UNION ALL
SELECT 
    'magic_links' as table_name, 
    COUNT(*) as remaining_records 
FROM magic_links;
