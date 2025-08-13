-- =====================================================
-- CLEAR ALL USERS SCRIPT
-- This script will remove all users and related data
-- WARNING: This will delete ALL user data permanently!
-- =====================================================

-- First, let's see what users exist
SELECT 'Current users in database:' as info;
SELECT id, email, full_name, user_type, created_at FROM users ORDER BY created_at;

-- Clear all related data first (due to foreign key constraints)
-- Order matters: delete child tables before parent tables

-- 1. Clear cross-dashboard events and notifications first
DO $$
BEGIN
    DELETE FROM cross_dashboard_events;
    RAISE NOTICE 'Cleared cross_dashboard_events';
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Table cross_dashboard_events does not exist';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error clearing cross_dashboard_events: %', SQLERRM;
END $$;

DO $$
BEGIN
    DELETE FROM global_notifications;
    RAISE NOTICE 'Cleared global_notifications';
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Table global_notifications does not exist';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error clearing global_notifications: %', SQLERRM;
END $$;

DO $$
BEGIN
    DELETE FROM system_metrics;
    RAISE NOTICE 'Cleared system_metrics';
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Table system_metrics does not exist';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error clearing system_metrics: %', SQLERRM;
END $$;

DO $$
BEGIN
    DELETE FROM dashboard_connections;
    RAISE NOTICE 'Cleared dashboard_connections';
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Table dashboard_connections does not exist';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error clearing dashboard_connections: %', SQLERRM;
END $$;

DO $$
BEGIN
    DELETE FROM data_sync_log;
    RAISE NOTICE 'Cleared data_sync_log';
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Table data_sync_log does not exist';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error clearing data_sync_log: %', SQLERRM;
END $$;

-- 2. Clear session-related data
DO $$
BEGIN
    DELETE FROM session_notes;
    RAISE NOTICE 'Cleared session_notes';
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Table session_notes does not exist';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error clearing session_notes: %', SQLERRM;
END $$;

DO $$
BEGIN
    DELETE FROM session_ratings;
    RAISE NOTICE 'Cleared session_ratings';
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Table session_ratings does not exist';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error clearing session_ratings: %', SQLERRM;
END $$;

DO $$
BEGIN
    DELETE FROM session_attachments;
    RAISE NOTICE 'Cleared session_attachments';
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Table session_attachments does not exist';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error clearing session_attachments: %', SQLERRM;
END $$;

-- 3. Clear therapist-client relationships
DO $$
BEGIN
    DELETE FROM therapist_client_relationships;
    RAISE NOTICE 'Cleared therapist_client_relationships';
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Table therapist_client_relationships does not exist';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error clearing therapist_client_relationships: %', SQLERRM;
END $$;

DO $$
BEGIN
    DELETE FROM client_notes;
    RAISE NOTICE 'Cleared client_notes';
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Table client_notes does not exist';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error clearing client_notes: %', SQLERRM;
END $$;

DO $$
BEGIN
    DELETE FROM client_goals;
    RAISE NOTICE 'Cleared client_goals';
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Table client_goals does not exist';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error clearing client_goals: %', SQLERRM;
END $$;

-- 4. Clear therapist verification and documents
DO $$
BEGIN
    DELETE FROM therapist_verification_requests;
    RAISE NOTICE 'Cleared therapist_verification_requests';
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Table therapist_verification_requests does not exist';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error clearing therapist_verification_requests: %', SQLERRM;
END $$;

DO $$
BEGIN
    DELETE FROM therapist_documents;
    RAISE NOTICE 'Cleared therapist_documents';
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Table therapist_documents does not exist';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error clearing therapist_documents: %', SQLERRM;
END $$;

-- 5. Clear therapist financial data
DO $$
BEGIN
    DELETE FROM therapist_analytics;
    RAISE NOTICE 'Cleared therapist_analytics';
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Table therapist_analytics does not exist';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error clearing therapist_analytics: %', SQLERRM;
END $$;

DO $$
BEGIN
    DELETE FROM therapist_earnings;
    RAISE NOTICE 'Cleared therapist_earnings';
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Table therapist_earnings does not exist';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error clearing therapist_earnings: %', SQLERRM;
END $$;

DO $$
BEGIN
    DELETE FROM therapist_transactions;
    RAISE NOTICE 'Cleared therapist_transactions';
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Table therapist_transactions does not exist';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error clearing therapist_transactions: %', SQLERRM;
END $$;

-- 6. Clear patient data
DO $$
BEGIN
    DELETE FROM patient_biodata;
    RAISE NOTICE 'Cleared patient_biodata';
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Table patient_biodata does not exist';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error clearing patient_biodata: %', SQLERRM;
END $$;

DO $$
BEGIN
    DELETE FROM patient_family_history;
    RAISE NOTICE 'Cleared patient_family_history';
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Table patient_family_history does not exist';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error clearing patient_family_history: %', SQLERRM;
END $$;

DO $$
BEGIN
    DELETE FROM patient_social_history;
    RAISE NOTICE 'Cleared patient_social_history';
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Table patient_social_history does not exist';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error clearing patient_social_history: %', SQLERRM;
END $$;

DO $$
BEGIN
    DELETE FROM patient_medical_history;
    RAISE NOTICE 'Cleared patient_medical_history';
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Table patient_medical_history does not exist';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error clearing patient_medical_history: %', SQLERRM;
END $$;

DO $$
BEGIN
    DELETE FROM patient_drug_history;
    RAISE NOTICE 'Cleared patient_drug_history';
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Table patient_drug_history does not exist';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error clearing patient_drug_history: %', SQLERRM;
END $$;

-- 7. Clear sessions (both tables)
DO $$
BEGIN
    DELETE FROM sessions;
    RAISE NOTICE 'Cleared sessions';
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Table sessions does not exist';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error clearing sessions: %', SQLERRM;
END $$;

DO $$
BEGIN
    DELETE FROM global_sessions;
    RAISE NOTICE 'Cleared global_sessions';
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Table global_sessions does not exist';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error clearing global_sessions: %', SQLERRM;
END $$;

-- 8. Clear payments and activity
DO $$
BEGIN
    DELETE FROM payments;
    RAISE NOTICE 'Cleared payments';
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Table payments does not exist';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error clearing payments: %', SQLERRM;
END $$;

DO $$
BEGIN
    DELETE FROM user_activity;
    RAISE NOTICE 'Cleared user_activity';
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Table user_activity does not exist';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error clearing user_activity: %', SQLERRM;
END $$;

-- 9. Clear authentication data
DO $$
BEGIN
    DELETE FROM magic_links;
    RAISE NOTICE 'Cleared magic_links';
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Table magic_links does not exist';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error clearing magic_links: %', SQLERRM;
END $$;

-- 10. Clear therapist availability and enrollments
DO $$
BEGIN
    DELETE FROM therapist_availability;
    RAISE NOTICE 'Cleared therapist_availability';
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Table therapist_availability does not exist';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error clearing therapist_availability: %', SQLERRM;
END $$;

DO $$
BEGIN
    DELETE FROM therapist_enrollments;
    RAISE NOTICE 'Cleared therapist_enrollments';
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Table therapist_enrollments does not exist';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error clearing therapist_enrollments: %', SQLERRM;
END $$;

-- 11. Clear therapists table
DO $$
BEGIN
    DELETE FROM therapists;
    RAISE NOTICE 'Cleared therapists';
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Table therapists does not exist';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error clearing therapists: %', SQLERRM;
END $$;

-- 12. Clear global users
DO $$
BEGIN
    DELETE FROM global_users;
    RAISE NOTICE 'Cleared global_users';
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Table global_users does not exist';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error clearing global_users: %', SQLERRM;
END $$;

-- 13. Finally, clear the main users table
DO $$
BEGIN
    DELETE FROM users;
    RAISE NOTICE 'Cleared users';
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Table users does not exist';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error clearing users: %', SQLERRM;
END $$;

-- 22. Clear auth.users (if accessible)
-- Note: This might require admin privileges
-- DELETE FROM auth.users;

-- Verify all tables are empty
SELECT 'Verification - checking if tables are empty:' as info;

-- Use a safer approach to check table counts with error handling
DO $$
DECLARE
    table_name TEXT;
    table_count INTEGER;
    tables_to_check TEXT[] := ARRAY[
        'users', 'global_users', 'sessions', 'global_sessions',
        'patient_biodata', 'patient_family_history', 'patient_social_history',
        'patient_medical_history', 'patient_drug_history', 'session_notes',
        'session_ratings', 'session_attachments', 'therapist_earnings',
        'therapist_transactions', 'therapist_client_relationships',
        'client_notes', 'client_goals', 'therapist_verification_requests',
        'therapist_documents', 'therapist_analytics', 'magic_links',
        'therapists', 'therapist_availability', 'therapist_enrollments',
        'payments', 'user_activity', 'cross_dashboard_events',
        'global_notifications', 'system_metrics', 'dashboard_connections',
        'data_sync_log'
    ];
BEGIN
    FOREACH table_name IN ARRAY tables_to_check
    LOOP
        BEGIN
            EXECUTE format('SELECT COUNT(*) FROM %I', table_name) INTO table_count;
            RAISE NOTICE 'Table %: % rows', table_name, table_count;
        EXCEPTION
            WHEN undefined_table THEN
                RAISE NOTICE 'Table % does not exist', table_name;
            WHEN OTHERS THEN
                RAISE NOTICE 'Error checking table %: %', table_name, SQLERRM;
        END;
    END LOOP;
END $$;

SELECT '✅ All users and related data cleared successfully!' as result;
