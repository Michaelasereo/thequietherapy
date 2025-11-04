-- =============================================
-- Clear Therapist Records
-- =============================================
-- This script removes therapist records for:
-- - opeyemimichaelasere@gmail.com
-- - asereope@gmail.com
-- - michaelopportunedesignco@gmail.com
-- =============================================

DO $$
DECLARE
    v_user_ids UUID[];
    v_user_id UUID;
    v_email TEXT;
BEGIN
    -- Get all user IDs for these email addresses
    SELECT ARRAY_AGG(id) INTO v_user_ids
    FROM users
    WHERE email IN (
        'opeyemimichaelasere@gmail.com',
        'asereope@gmail.com',
        'michaelopportunedesignco@gmail.com'
    );

    -- Check if any users were found
    IF v_user_ids IS NULL OR array_length(v_user_ids, 1) IS NULL THEN
        RAISE NOTICE 'No users found with the specified email addresses';
        RETURN;
    END IF;

    RAISE NOTICE 'Found % users to delete', array_length(v_user_ids, 1);

    -- Loop through each user and delete related records
    FOREACH v_user_id IN ARRAY v_user_ids
    LOOP
        -- Get email for logging
        SELECT email INTO v_email FROM users WHERE id = v_user_id;
        RAISE NOTICE 'Processing user: % (ID: %)', v_email, v_user_id;

        -- 1. Delete sessions associated with this therapist
        RAISE NOTICE '  Deleting sessions for therapist...';
        DELETE FROM sessions WHERE therapist_id = v_user_id;
        RAISE NOTICE '    Deleted sessions';

        -- 2. Delete sessions where user is the client (if any)
        DELETE FROM sessions WHERE user_id = v_user_id;
        RAISE NOTICE '    Deleted client sessions';

        -- 3. Delete therapist availability records
        BEGIN
            DELETE FROM therapist_availability WHERE therapist_id = v_user_id;
            RAISE NOTICE '    Deleted therapist availability';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '    No therapist_availability table or already deleted';
        END;

        -- 4. Delete therapist enrollments
        DELETE FROM therapist_enrollments WHERE email = v_email;
        RAISE NOTICE '    Deleted therapist enrollment';

        -- 5. Delete user credits (if any)
        DELETE FROM user_credits WHERE user_id = v_user_id;
        RAISE NOTICE '    Deleted user credits';

        -- 6. Delete partner credits (if any)
        BEGIN
            DELETE FROM partner_credits WHERE user_id = v_user_id;
            RAISE NOTICE '    Deleted partner credits';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '    No partner_credits table or already deleted';
        END;

        -- 7. Delete booking audit logs
        BEGIN
            DELETE FROM booking_audit_log WHERE user_id = v_user_id;
            RAISE NOTICE '    Deleted booking audit logs';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '    No booking_audit_log table or already deleted';
        END;

        -- 8. Delete notifications (if any)
        BEGIN
            DELETE FROM notifications WHERE user_id = v_user_id OR therapist_id = v_user_id;
            RAISE NOTICE '    Deleted notifications';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '    No notifications table or already deleted';
        END;

        -- 9. Delete client medical history records (if therapist created them)
        BEGIN
            DELETE FROM client_medical_history WHERE therapist_id = v_user_id;
            RAISE NOTICE '    Deleted client medical history';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '    No client_medical_history table or already deleted';
        END;

        -- 10. Delete session notes (if any)
        BEGIN
            DELETE FROM session_notes WHERE therapist_id = v_user_id;
            RAISE NOTICE '    Deleted session notes';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '    No session_notes table or already deleted';
        END;

        -- 11. Delete SOAP notes (if any)
        BEGIN
            DELETE FROM soap_notes WHERE therapist_id = v_user_id;
            RAISE NOTICE '    Deleted SOAP notes';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '    No soap_notes table or already deleted';
        END;

        -- 12. Finally, delete the user record
        DELETE FROM users WHERE id = v_user_id;
        RAISE NOTICE '    Deleted user record';

        RAISE NOTICE '✅ Completed deletion for user: %', v_email;
    END LOOP;

    RAISE NOTICE '';
    RAISE NOTICE '✅ Successfully cleared all therapist records';
    RAISE NOTICE '   Emails processed:';
    RAISE NOTICE '   - opeyemimichaelasere@gmail.com';
    RAISE NOTICE '   - asereope@gmail.com';
    RAISE NOTICE '   - michaelopportunedesignco@gmail.com';

EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Error deleting therapist records: %', SQLERRM;
END $$;

-- Verify deletion
SELECT 
    'Verification' as status,
    COUNT(*) as remaining_users
FROM users
WHERE email IN (
    'opeyemimichaelasere@gmail.com',
    'asereope@gmail.com',
    'michaelopportunedesignco@gmail.com'
);

SELECT 
    'Therapist enrollments remaining' as status,
    COUNT(*) as count
FROM therapist_enrollments
WHERE email IN (
    'opeyemimichaelasere@gmail.com',
    'asereope@gmail.com',
    'michaelopportunedesignco@gmail.com'
);

