// Simple script to create sample users for testing
// This script will be run manually in the Supabase dashboard

console.log(`
🚀 Sample Users Creation Script
================================

Run these SQL commands in your Supabase SQL Editor:

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

-- 5. Create sample sessions (run after getting therapist ID)
-- First, get the therapist ID:
-- SELECT id FROM users WHERE email = 'testtherapist@example.com';

-- Then insert sessions (replace THERAPIST_ID with actual ID):
-- INSERT INTO sessions (therapist_id, title, description, duration_minutes, price, status)
-- VALUES 
--   (THERAPIST_ID, 'Initial Consultation', 'First session to understand your needs', 60, 5000, 'available'),
--   (THERAPIST_ID, 'Follow-up Session', 'Regular therapy session', 45, 4000, 'available');

-- 6. Create global user records for cross-dashboard functionality
-- Get user IDs first:
-- SELECT id, email, user_type FROM users WHERE email IN ('testuser@example.com', 'testtherapist@example.com', 'testpartner@example.com', 'testadmin@example.com');

-- Then insert global records (replace USER_IDs with actual IDs):
-- INSERT INTO global_users (user_id, user_type, dashboard_type)
-- VALUES 
--   (USER_ID_1, 'individual', 'user'),
--   (USER_ID_2, 'therapist', 'therapist'),
--   (USER_ID_3, 'partner', 'partner'),
--   (USER_ID_4, 'admin', 'admin');

📋 Test Credentials:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 User: testuser@example.com
👨‍⚕️ Therapist: testtherapist@example.com
🏢 Partner: testpartner@example.com
👑 Admin: testadmin@example.com
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 Use the dev-login page to authenticate: http://localhost:3001/test-login

🎯 Testing Workflow:
1. Go to http://localhost:3001/test-login
2. Click on any user type to authenticate
3. Navigate to the dashboard
4. For user: Book a session with the therapist
5. For therapist: View and manage sessions
6. Test the video call functionality at /session/[session-id]
`);
