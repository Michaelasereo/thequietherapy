-- =====================================================
-- CLEAR ALL USERS SCRIPT
-- This script will remove all users and related data
-- WARNING: This will delete ALL user data permanently!
-- =====================================================

-- First, let's see what users exist
SELECT 'Current users in database:' as info;
SELECT id, email, full_name, user_type, created_at FROM users ORDER BY created_at;

-- Clear all related data first (due to foreign key constraints)

-- 1. Clear session notes
DELETE FROM session_notes;
SELECT 'Cleared session_notes' as status;

-- 2. Clear session ratings
DELETE FROM session_ratings;
SELECT 'Cleared session_ratings' as status;

-- 3. Clear session attachments
DELETE FROM session_attachments;
SELECT 'Cleared session_attachments' as status;

-- 4. Clear therapist client relationships
DELETE FROM therapist_client_relationships;
SELECT 'Cleared therapist_client_relationships' as status;

-- 5. Clear client notes
DELETE FROM client_notes;
SELECT 'Cleared client_notes' as status;

-- 6. Clear client goals
DELETE FROM client_goals;
SELECT 'Cleared client_goals' as status;

-- 7. Clear therapist verification requests
DELETE FROM therapist_verification_requests;
SELECT 'Cleared therapist_verification_requests' as status;

-- 8. Clear therapist documents
DELETE FROM therapist_documents;
SELECT 'Cleared therapist_documents' as status;

-- 9. Clear therapist analytics
DELETE FROM therapist_analytics;
SELECT 'Cleared therapist_analytics' as status;

-- 10. Clear therapist earnings
DELETE FROM therapist_earnings;
SELECT 'Cleared therapist_earnings' as status;

-- 11. Clear therapist transactions
DELETE FROM therapist_transactions;
SELECT 'Cleared therapist_transactions' as status;

-- 12. Clear patient data
DELETE FROM patient_biodata;
SELECT 'Cleared patient_biodata' as status;

DELETE FROM patient_family_history;
SELECT 'Cleared patient_family_history' as status;

DELETE FROM patient_social_history;
SELECT 'Cleared patient_social_history' as status;

DELETE FROM patient_medical_history;
SELECT 'Cleared patient_medical_history' as status;

DELETE FROM patient_drug_history;
SELECT 'Cleared patient_drug_history' as status;

-- 13. Clear sessions
DELETE FROM sessions;
SELECT 'Cleared sessions' as status;

DELETE FROM global_sessions;
SELECT 'Cleared global_sessions' as status;

-- 14. Clear payments
DELETE FROM payments;
SELECT 'Cleared payments' as status;

-- 15. Clear user activity
DELETE FROM user_activity;
SELECT 'Cleared user_activity' as status;

-- 16. Clear magic links
DELETE FROM magic_links;
SELECT 'Cleared magic_links' as status;

-- 17. Clear therapist availability
DELETE FROM therapist_availability;
SELECT 'Cleared therapist_availability' as status;

-- 18. Clear therapist enrollments
DELETE FROM therapist_enrollments;
SELECT 'Cleared therapist_enrollments' as status;

-- 19. Clear therapists table
DELETE FROM therapists;
SELECT 'Cleared therapists' as status;

-- 20. Clear global users
DELETE FROM global_users;
SELECT 'Cleared global_users' as status;

-- 21. Finally, clear the main users table
DELETE FROM users;
SELECT 'Cleared users' as status;

-- 22. Clear auth.users (if accessible)
-- Note: This might require admin privileges
-- DELETE FROM auth.users;

-- Verify all tables are empty
SELECT 'Verification - checking if tables are empty:' as info;

SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'global_users', COUNT(*) FROM global_users
UNION ALL
SELECT 'sessions', COUNT(*) FROM sessions
UNION ALL
SELECT 'global_sessions', COUNT(*) FROM global_sessions
UNION ALL
SELECT 'patient_biodata', COUNT(*) FROM patient_biodata
UNION ALL
SELECT 'patient_family_history', COUNT(*) FROM patient_family_history
UNION ALL
SELECT 'patient_social_history', COUNT(*) FROM patient_social_history
UNION ALL
SELECT 'patient_medical_history', COUNT(*) FROM patient_medical_history
UNION ALL
SELECT 'patient_drug_history', COUNT(*) FROM patient_drug_history
UNION ALL
SELECT 'session_notes', COUNT(*) FROM session_notes
UNION ALL
SELECT 'session_ratings', COUNT(*) FROM session_ratings
UNION ALL
SELECT 'session_attachments', COUNT(*) FROM session_attachments
UNION ALL
SELECT 'therapist_earnings', COUNT(*) FROM therapist_earnings
UNION ALL
SELECT 'therapist_transactions', COUNT(*) FROM therapist_transactions
UNION ALL
SELECT 'therapist_client_relationships', COUNT(*) FROM therapist_client_relationships
UNION ALL
SELECT 'client_notes', COUNT(*) FROM client_notes
UNION ALL
SELECT 'client_goals', COUNT(*) FROM client_goals
UNION ALL
SELECT 'therapist_verification_requests', COUNT(*) FROM therapist_verification_requests
UNION ALL
SELECT 'therapist_documents', COUNT(*) FROM therapist_documents
UNION ALL
SELECT 'therapist_analytics', COUNT(*) FROM therapist_analytics
UNION ALL
SELECT 'magic_links', COUNT(*) FROM magic_links
UNION ALL
SELECT 'therapists', COUNT(*) FROM therapists
UNION ALL
SELECT 'therapist_availability', COUNT(*) FROM therapist_availability
UNION ALL
SELECT 'therapist_enrollments', COUNT(*) FROM therapist_enrollments
UNION ALL
SELECT 'payments', COUNT(*) FROM payments
UNION ALL
SELECT 'user_activity', COUNT(*) FROM user_activity;

SELECT '✅ All users and related data cleared successfully!' as result;
