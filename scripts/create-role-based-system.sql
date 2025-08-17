-- Role-based system for multiple user types per email
-- This allows users to have multiple roles (individual, therapist, partner, admin)

-- 1. Create user_roles table to track multiple roles per user
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_type VARCHAR(50) NOT NULL CHECK (role_type IN ('individual', 'therapist', 'partner', 'admin')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, role_type)
);

-- 2. Create role_sessions table for role-specific sessions
CREATE TABLE IF NOT EXISTS role_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_type VARCHAR(50) NOT NULL CHECK (role_type IN ('individual', 'therapist', 'partner', 'admin')),
    session_token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    user_agent TEXT,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_type ON user_roles(role_type);
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON user_roles(is_active);
CREATE INDEX IF NOT EXISTS idx_role_sessions_user_id ON role_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_role_sessions_role_type ON role_sessions(role_type);
CREATE INDEX IF NOT EXISTS idx_role_sessions_token ON role_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_role_sessions_expires ON role_sessions(expires_at);

-- 4. Create function to get user roles
CREATE OR REPLACE FUNCTION get_user_roles(user_email TEXT)
RETURNS TABLE (
    user_id UUID,
    email TEXT,
    full_name TEXT,
    role_type VARCHAR(50),
    is_active BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.email,
        u.full_name,
        ur.role_type,
        ur.is_active,
        ur.created_at
    FROM users u
    JOIN user_roles ur ON u.id = ur.user_id
    WHERE u.email = user_email
    AND ur.is_active = true
    ORDER BY ur.created_at;
END;
$$ LANGUAGE plpgsql;

-- 5. Create function to add role to user
CREATE OR REPLACE FUNCTION add_user_role(
    user_email TEXT,
    role_type VARCHAR(50),
    full_name TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    user_id UUID;
    existing_user_id UUID;
BEGIN
    -- Check if user exists
    SELECT id INTO existing_user_id FROM users WHERE email = user_email;
    
    IF existing_user_id IS NULL THEN
        -- Create new user
        INSERT INTO users (email, full_name, user_type, is_verified, is_active)
        VALUES (user_email, COALESCE(full_name, user_email), role_type, true, true)
        RETURNING id INTO user_id;
    ELSE
        -- Use existing user
        user_id := existing_user_id;
        
        -- Update user type if it's different (keep the most recent one)
        UPDATE users 
        SET user_type = role_type,
            full_name = COALESCE(full_name, users.full_name),
            updated_at = NOW()
        WHERE id = user_id;
    END IF;
    
    -- Add role (or update if exists)
    INSERT INTO user_roles (user_id, role_type, is_active)
    VALUES (user_id, role_type, true)
    ON CONFLICT (user_id, role_type)
    DO UPDATE SET 
        is_active = true,
        updated_at = NOW();
    
    RETURN user_id;
END;
$$ LANGUAGE plpgsql;

-- 6. Create function to create role session
CREATE OR REPLACE FUNCTION create_role_session(
    user_email TEXT,
    role_type VARCHAR(50),
    session_token TEXT,
    expires_at TIMESTAMP WITH TIME ZONE
)
RETURNS BOOLEAN AS $$
DECLARE
    user_id UUID;
    role_exists BOOLEAN;
BEGIN
    -- Check if user has this role
    SELECT ur.user_id INTO user_id
    FROM users u
    JOIN user_roles ur ON u.id = ur.user_id
    WHERE u.email = user_email
    AND ur.role_type = role_type
    AND ur.is_active = true;
    
    IF user_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Delete existing sessions for this user and role
    DELETE FROM role_sessions 
    WHERE user_id = user_id AND role_type = role_type;
    
    -- Create new session
    INSERT INTO role_sessions (user_id, role_type, session_token, expires_at)
    VALUES (user_id, role_type, session_token, expires_at);
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 7. Create function to validate role session
CREATE OR REPLACE FUNCTION validate_role_session(
    session_token TEXT,
    role_type VARCHAR(50)
)
RETURNS TABLE (
    user_id UUID,
    email TEXT,
    full_name TEXT,
    role_type VARCHAR(50),
    is_valid BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rs.user_id,
        u.email,
        u.full_name,
        rs.role_type,
        (rs.expires_at > NOW()) as is_valid
    FROM role_sessions rs
    JOIN users u ON rs.user_id = u.id
    WHERE rs.session_token = session_token
    AND rs.role_type = role_type
    AND rs.expires_at > NOW();
END;
$$ LANGUAGE plpgsql;

-- 8. Migrate existing data
-- Add individual role for existing users
INSERT INTO user_roles (user_id, role_type, is_active)
SELECT id, user_type, true
FROM users
WHERE user_type IN ('individual', 'therapist', 'partner', 'admin')
ON CONFLICT (user_id, role_type) DO NOTHING;

-- Add therapist role for existing therapist enrollments
INSERT INTO user_roles (user_id, role_type, is_active)
SELECT u.id, 'therapist', true
FROM users u
JOIN therapist_enrollments te ON u.email = te.email
WHERE u.user_type = 'therapist'
ON CONFLICT (user_id, role_type) DO NOTHING;

-- 9. Create view for easy role querying
CREATE OR REPLACE VIEW user_roles_view AS
SELECT 
    u.id as user_id,
    u.email,
    u.full_name,
    u.is_verified,
    u.is_active as user_active,
    ur.role_type,
    ur.is_active as role_active,
    ur.created_at as role_created_at,
    CASE 
        WHEN ur.role_type = 'therapist' THEN te.status
        ELSE NULL
    END as therapist_status,
    CASE 
        WHEN ur.role_type = 'therapist' THEN te.hourly_rate
        ELSE NULL
    END as therapist_rate
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN therapist_enrollments te ON u.email = te.email AND ur.role_type = 'therapist'
WHERE ur.is_active = true;

-- 10. Add comments for documentation
COMMENT ON TABLE user_roles IS 'Tracks multiple roles per user (individual, therapist, partner, admin)';
COMMENT ON TABLE role_sessions IS 'Role-specific sessions for different user types';
COMMENT ON FUNCTION get_user_roles IS 'Get all active roles for a user email';
COMMENT ON FUNCTION add_user_role IS 'Add a new role to a user (creates user if not exists)';
COMMENT ON FUNCTION create_role_session IS 'Create a session for a specific user role';
COMMENT ON FUNCTION validate_role_session IS 'Validate a session token for a specific role';
COMMENT ON VIEW user_roles_view IS 'View for easy querying of user roles with related data';
