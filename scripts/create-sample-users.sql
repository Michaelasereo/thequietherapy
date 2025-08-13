-- Sample Users Creation Script for TRPI App Testing
-- Run this in your Supabase SQL Editor

-- 1. Create Sample User (Individual)
INSERT INTO users (email, full_name, user_type, is_verified, is_active, credits, package_type)
VALUES (
  'testuser@example.com',
  'John Doe',
  'individual',
  true,
  true,
  50,
  'basic'
);

-- 2. Create Sample Therapist
INSERT INTO users (email, full_name, user_type, is_verified, is_active, credits, package_type)
VALUES (
  'testtherapist@example.com',
  'Dr. Sarah Johnson',
  'therapist',
  true,
  true,
  0,
  'professional'
);

-- 3. Create Sample Partner
INSERT INTO users (email, full_name, user_type, is_verified, is_active, credits, package_type)
VALUES (
  'testpartner@example.com',
  'TechCorp Solutions',
  'partner',
  true,
  true,
  1000,
  'enterprise'
);

-- 4. Create Sample Admin
INSERT INTO users (email, full_name, user_type, is_verified, is_active, credits, package_type)
VALUES (
  'testadmin@example.com',
  'System Administrator',
  'admin',
  true,
  true,
  0,
  'admin'
);

-- 5. Create a therapist record for the test therapist
DO $$
DECLARE
    therapist_user_id UUID;
BEGIN
    -- Get the therapist user ID
    SELECT id INTO therapist_user_id FROM users WHERE email = 'testtherapist@example.com';
    
    -- Create therapist record
    INSERT INTO therapists (user_id, full_name, email, specialization, bio, hourly_rate, is_verified, is_active)
    VALUES (
        therapist_user_id,
        'Dr. Sarah Johnson',
        'testtherapist@example.com',
        'General Therapy',
        'Experienced therapist specializing in various therapeutic approaches.',
        100.00,
        true,
        true
    );
END $$;

-- 6. Create sample sessions for the therapist
DO $$
DECLARE
    therapist_id UUID;
BEGIN
    -- Get therapist ID from therapists table
    SELECT id INTO therapist_id FROM therapists WHERE email = 'testtherapist@example.com';
    
    -- Create sessions
    INSERT INTO sessions (therapist_id, title, description, scheduled_date, scheduled_time, duration_minutes, status)
    VALUES 
      (therapist_id, 'Initial Consultation', 'First session to understand your needs', CURRENT_DATE + INTERVAL '1 day', '14:00:00', 60, 'scheduled'),
      (therapist_id, 'Follow-up Session', 'Regular therapy session', CURRENT_DATE + INTERVAL '2 days', '15:00:00', 45, 'scheduled');
END $$;

-- 7. Create global user records for cross-dashboard functionality
-- Note: This requires users to exist in auth.users table
-- For testing purposes, we'll skip this step if the users don't exist in auth.users
DO $$
DECLARE
    user_id UUID;
    therapist_id UUID;
    partner_id UUID;
    admin_id UUID;
    user_exists BOOLEAN;
    therapist_exists BOOLEAN;
    partner_exists BOOLEAN;
    admin_exists BOOLEAN;
BEGIN
    -- Check if users exist in auth.users table
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = 'testuser@example.com') INTO user_exists;
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = 'testtherapist@example.com') INTO therapist_exists;
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = 'testpartner@example.com') INTO partner_exists;
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = 'testadmin@example.com') INTO admin_exists;
    
    -- Only create global user records if the users exist in auth.users
    IF user_exists THEN
        SELECT id INTO user_id FROM auth.users WHERE email = 'testuser@example.com';
        INSERT INTO global_users (user_id, full_name, email, user_type)
        VALUES (user_id, 'John Doe', 'testuser@example.com', 'user');
    END IF;
    
    IF therapist_exists THEN
        SELECT id INTO therapist_id FROM auth.users WHERE email = 'testtherapist@example.com';
        INSERT INTO global_users (user_id, full_name, email, user_type)
        VALUES (therapist_id, 'Dr. Sarah Johnson', 'testtherapist@example.com', 'therapist');
    END IF;
    
    IF partner_exists THEN
        SELECT id INTO partner_id FROM auth.users WHERE email = 'testpartner@example.com';
        INSERT INTO global_users (user_id, full_name, email, user_type)
        VALUES (partner_id, 'TechCorp Solutions', 'testpartner@example.com', 'partner');
    END IF;
    
    IF admin_exists THEN
        SELECT id INTO admin_id FROM auth.users WHERE email = 'testadmin@example.com';
        INSERT INTO global_users (user_id, full_name, email, user_type)
        VALUES (admin_id, 'System Administrator', 'testadmin@example.com', 'admin');
    END IF;
END $$;

-- 8. Create a sample user session (booking)
DO $$
DECLARE
    user_id UUID;
    therapist_record_id UUID;
BEGIN
    -- Get user ID
    SELECT id INTO user_id FROM users WHERE email = 'testuser@example.com';
    
    -- Get therapist record ID
    SELECT id INTO therapist_record_id FROM therapists WHERE email = 'testtherapist@example.com';
    
    -- Create a session booking (sessions table already has user_id column)
    INSERT INTO sessions (user_id, therapist_id, title, description, scheduled_date, scheduled_time, duration_minutes, status)
    VALUES (
        user_id,
        therapist_record_id,
        'Booked Session with Dr. Sarah Johnson',
        'Initial consultation session booked by John Doe',
        CURRENT_DATE + INTERVAL '1 day',
        '14:00:00',
        60,
        'scheduled'
    );
END $$;

-- Verify the data was created
SELECT 'Users created:' as info;
SELECT email, full_name, user_type, is_verified FROM users WHERE email LIKE 'test%@example.com';

SELECT 'Therapist record created:' as info;
SELECT t.full_name, t.email, t.specialization, t.hourly_rate, t.is_verified
FROM therapists t 
WHERE t.email = 'testtherapist@example.com';

SELECT 'Sessions created:' as info;
SELECT s.title, s.description, s.duration_minutes, s.status, t.full_name as therapist_name 
FROM sessions s 
JOIN therapists t ON s.therapist_id = t.id 
WHERE t.email = 'testtherapist@example.com';

SELECT 'Global users created:' as info;
SELECT gu.user_type, gu.full_name, gu.email 
FROM global_users gu 
WHERE gu.email LIKE 'test%@example.com';

-- Note: Global users will only be created if corresponding auth.users exist
-- For testing without auth.users, you can manually create them later

SELECT 'User sessions created:' as info;
SELECT s.status, s.scheduled_date, s.scheduled_time, u.full_name as user_name, s.title as session_title, t.full_name as therapist_name
FROM sessions s
JOIN users u ON s.user_id = u.id
JOIN therapists t ON s.therapist_id = t.id
WHERE u.email = 'testuser@example.com';
