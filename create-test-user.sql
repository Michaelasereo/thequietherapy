-- Create a test individual user for booking flow testing
-- Run this in Supabase SQL Editor

-- Insert a test individual user
INSERT INTO users (
    email,
    full_name,
    user_type,
    is_verified,
    is_active,
    created_at
) VALUES (
    'testuser@example.com',
    'Test User',
    'individual',
    true,
    true,
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    user_type = 'individual',
    is_verified = true,
    is_active = true;

-- Create a user session for the test user
INSERT INTO user_sessions (
    user_id,
    session_token,
    expires_at,
    user_agent,
    ip_address
) SELECT 
    u.id,
    'test_session_token_' || extract(epoch from now()),
    NOW() + INTERVAL '7 days',
    'Test Session',
    '127.0.0.1'
FROM users u 
WHERE u.email = 'testuser@example.com'
ON CONFLICT (session_token) DO NOTHING;

-- Give the test user some credits
INSERT INTO user_credits (
    user_id,
    user_type,
    credits_balance,
    credits_purchased
) SELECT 
    u.id,
    'individual',
    5,
    5
FROM users u 
WHERE u.email = 'testuser@example.com'
ON CONFLICT (user_id, user_type) DO UPDATE SET
    credits_balance = 5,
    credits_purchased = 5;

SELECT 'Test user created successfully' as message;

