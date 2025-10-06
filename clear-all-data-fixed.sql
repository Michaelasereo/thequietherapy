-- COMPLETE DATA CLEANUP - REMOVES ALL USERS AND RELATED DATA
-- This script is based on the actual table structure in your database

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

-- 5. Delete therapist enrollments
DELETE FROM therapist_enrollments;

-- 6. Delete therapist profiles
DELETE FROM therapist_profiles;

-- 7. Delete therapist availability
DELETE FROM therapist_availability;

-- 8. Delete user credits
DELETE FROM user_credits;

-- 9. Delete user packages
DELETE FROM user_packages;

-- 10. Delete payments
DELETE FROM payments;

-- 11. Delete credits
DELETE FROM credits;

-- 12. Delete partner members
DELETE FROM partner_members;

-- 13. Delete partners
DELETE FROM partners;

-- 14. Delete content
DELETE FROM content;

-- 15. Delete admin logs
DELETE FROM admin_logs;

-- 16. Finally delete all users
DELETE FROM users;

-- Re-enable foreign key checks
SET session_replication_role = DEFAULT;

-- Show confirmation
SELECT 'All data has been cleared successfully!' as status;

-- Show remaining records in key tables (should be 0)
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
