-- Clear all users except admin
-- This script removes all users except the admin user for testing purposes

-- Delete all sessions except admin sessions
DELETE FROM user_sessions 
WHERE user_id NOT IN (
    SELECT id FROM users WHERE email = 'asereopeyemimichael@gmail.com'
);

-- Delete all magic links except admin magic links
DELETE FROM magic_links 
WHERE email != 'asereopeyemimichael@gmail.com';

-- Delete all therapist enrollments except admin
DELETE FROM therapist_enrollments 
WHERE email != 'asereopeyemimichael@gmail.com';

-- Delete from individual_auth except admin (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'individual_auth') THEN
        DELETE FROM individual_auth WHERE email != 'asereopeyemimichael@gmail.com';
    END IF;
END $$;

-- Delete from therapist_auth except admin (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'therapist_auth') THEN
        DELETE FROM therapist_auth WHERE email != 'asereopeyemimichael@gmail.com';
    END IF;
END $$;

-- Delete from partner_auth except admin (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'partner_auth') THEN
        DELETE FROM partner_auth WHERE email != 'asereopeyemimichael@gmail.com';
    END IF;
END $$;

-- Delete from individual_sessions except admin (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'individual_sessions') THEN
        DELETE FROM individual_sessions 
        WHERE user_id NOT IN (
            SELECT id FROM users WHERE email = 'asereopeyemimichael@gmail.com'
        );
    END IF;
END $$;

-- Delete from therapist_sessions except admin (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'therapist_sessions') THEN
        DELETE FROM therapist_sessions 
        WHERE user_id NOT IN (
            SELECT id FROM users WHERE email = 'asereopeyemimichael@gmail.com'
        );
    END IF;
END $$;

-- Delete from partner_sessions except admin (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'partner_sessions') THEN
        DELETE FROM partner_sessions 
        WHERE user_id NOT IN (
            SELECT id FROM users WHERE email = 'asereopeyemimichael@gmail.com'
        );
    END IF;
END $$;

-- Delete from global_users except admin (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'global_users') THEN
        DELETE FROM global_users WHERE email != 'asereopeyemimichael@gmail.com';
    END IF;
END $$;

-- Delete from global_sessions except admin sessions (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'global_sessions') THEN
        DELETE FROM global_sessions 
        WHERE user_id NOT IN (
            SELECT id FROM users WHERE email = 'asereopeyemimichael@gmail.com'
        )
        AND therapist_id NOT IN (
            SELECT id FROM users WHERE email = 'asereopeyemimichael@gmail.com'
        )
        AND partner_id NOT IN (
            SELECT id FROM users WHERE email = 'asereopeyemimichael@gmail.com'
        );
    END IF;
END $$;

-- Delete from dashboard_connections except admin (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'dashboard_connections') THEN
        DELETE FROM dashboard_connections 
        WHERE user_id NOT IN (
            SELECT id FROM users WHERE email = 'asereopeyemimichael@gmail.com'
        );
    END IF;
END $$;

-- Delete from user_activity except admin (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_activity') THEN
        DELETE FROM user_activity 
        WHERE user_id NOT IN (
            SELECT id FROM users WHERE email = 'asereopeyemimichael@gmail.com'
        );
    END IF;
END $$;

-- Delete from user_roles except admin (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_roles') THEN
        DELETE FROM user_roles 
        WHERE user_id NOT IN (
            SELECT id FROM users WHERE email = 'asereopeyemimichael@gmail.com'
        );
    END IF;
END $$;

-- Delete from password_reset_tokens except admin (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'password_reset_tokens') THEN
        DELETE FROM password_reset_tokens 
        WHERE user_id NOT IN (
            SELECT id FROM users WHERE email = 'asereopeyemimichael@gmail.com'
        );
    END IF;
END $$;

-- Delete from sessions except admin sessions (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'sessions') THEN
        DELETE FROM sessions 
        WHERE user_id NOT IN (
            SELECT id FROM users WHERE email = 'asereopeyemimichael@gmail.com'
        )
        AND therapist_id NOT IN (
            SELECT id FROM users WHERE email = 'asereopeyemimichael@gmail.com'
        );
    END IF;
END $$;

-- Delete from payments except admin payments (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'payments') THEN
        DELETE FROM payments 
        WHERE user_id NOT IN (
            SELECT id FROM users WHERE email = 'asereopeyemimichael@gmail.com'
        );
    END IF;
END $$;

-- Delete from global_notifications (clear all notifications if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'global_notifications') THEN
        DELETE FROM global_notifications;
    END IF;
END $$;

-- Delete from cross_dashboard_events (clear all events if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'cross_dashboard_events') THEN
        DELETE FROM cross_dashboard_events;
    END IF;
END $$;

-- Delete from data_sync_log (clear all sync logs if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'data_sync_log') THEN
        DELETE FROM data_sync_log;
    END IF;
END $$;

-- Delete all users except admin
DELETE FROM users 
WHERE email != 'asereopeyemimichael@gmail.com';

-- Verify admin user still exists
SELECT id, email, full_name, user_type, is_verified, is_active 
FROM users 
WHERE email = 'asereopeyemimichael@gmail.com';
