-- Setup Admin Authentication System
-- Only allows asereopeyemimichael@gmail.com to access admin features

-- Create admin_auth table if it doesn't exist
CREATE TABLE IF NOT EXISTS admin_auth (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    is_verified BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    role VARCHAR(50) DEFAULT 'admin',
    permissions JSONB DEFAULT '{"all": true}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admin_sessions table if it doesn't exist
CREATE TABLE IF NOT EXISTS admin_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_admin_auth_email ON admin_auth(email);
CREATE INDEX IF NOT EXISTS idx_admin_auth_user_id ON admin_auth(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_user_id ON admin_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at);

-- Insert admin user (if not exists)
INSERT INTO users (id, email, full_name, is_verified, is_active, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'asereopeyemimichael@gmail.com',
    'Admin User',
    true,
    true,
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Insert admin auth record (if not exists)
INSERT INTO admin_auth (user_id, email, is_verified, is_active, role, permissions)
SELECT 
    u.id,
    u.email,
    true,
    true,
    'admin',
    '{"all": true, "approve_therapists": true, "manage_users": true, "view_analytics": true}'::jsonb
FROM users u
WHERE u.email = 'asereopeyemimichael@gmail.com'
ON CONFLICT (email) DO NOTHING;

-- Add comments
COMMENT ON TABLE admin_auth IS 'Admin authentication and authorization data';
COMMENT ON TABLE admin_sessions IS 'Admin session management';
COMMENT ON COLUMN admin_auth.permissions IS 'JSON object containing admin permissions';
