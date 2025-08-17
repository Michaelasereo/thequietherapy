-- Separate Authentication System with Unified User Management
-- This allows one email to have multiple roles while keeping auth separate

-- 1. Keep the existing users table as the master user record
-- (This already exists and tracks basic user info)

-- 2. Create separate authentication tables for each user type
CREATE TABLE IF NOT EXISTS individual_auth (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    credits INTEGER DEFAULT 0,
    package_type VARCHAR(50) DEFAULT 'Basic',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS therapist_auth (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    hourly_rate INTEGER DEFAULT 5000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS partner_auth (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    organization_name VARCHAR(255),
    organization_type VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create separate session tables for each user type
CREATE TABLE IF NOT EXISTS individual_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    user_agent TEXT,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS therapist_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    user_agent TEXT,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS partner_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    user_agent TEXT,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_individual_auth_email ON individual_auth(email);
CREATE INDEX IF NOT EXISTS idx_individual_auth_user_id ON individual_auth(user_id);
CREATE INDEX IF NOT EXISTS idx_therapist_auth_email ON therapist_auth(email);
CREATE INDEX IF NOT EXISTS idx_therapist_auth_user_id ON therapist_auth(user_id);
CREATE INDEX IF NOT EXISTS idx_partner_auth_email ON partner_auth(email);
CREATE INDEX IF NOT EXISTS idx_partner_auth_user_id ON partner_auth(user_id);

CREATE INDEX IF NOT EXISTS idx_individual_sessions_token ON individual_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_individual_sessions_user_id ON individual_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_individual_sessions_expires ON individual_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_therapist_sessions_token ON therapist_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_therapist_sessions_user_id ON therapist_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_therapist_sessions_expires ON therapist_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_partner_sessions_token ON partner_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_partner_sessions_user_id ON partner_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_partner_sessions_expires ON partner_sessions(expires_at);

-- 5. Create functions to check available auth types for an email
CREATE OR REPLACE FUNCTION get_available_auth_types(user_email TEXT)
RETURNS TABLE (
    auth_type VARCHAR(50),
    is_verified BOOLEAN,
    is_active BOOLEAN,
    status VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'individual'::VARCHAR(50) as auth_type,
        ia.is_verified,
        ia.is_active,
        'active'::VARCHAR(50) as status,
        ia.created_at
    FROM individual_auth ia
    WHERE ia.email = user_email
    UNION ALL
    SELECT 
        'therapist'::VARCHAR(50) as auth_type,
        ta.is_verified,
        ta.is_active,
        ta.status,
        ta.created_at
    FROM therapist_auth ta
    WHERE ta.email = user_email
    UNION ALL
    SELECT 
        'partner'::VARCHAR(50) as auth_type,
        pa.is_verified,
        pa.is_active,
        'active'::VARCHAR(50) as status,
        pa.created_at
    FROM partner_auth pa
    WHERE pa.email = user_email;
END;
$$ LANGUAGE plpgsql;

-- 6. Create function to add auth type to user
CREATE OR REPLACE FUNCTION add_auth_type(
    user_email TEXT,
    auth_type VARCHAR(50),
    full_name TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    user_id UUID;
    existing_user_id UUID;
BEGIN
    -- Check if user exists in master users table
    SELECT id INTO existing_user_id FROM users WHERE email = user_email;
    
    IF existing_user_id IS NULL THEN
        -- Create new user in master table
        INSERT INTO users (email, full_name, user_type, is_verified, is_active)
        VALUES (user_email, COALESCE(full_name, user_email), auth_type, true, true)
        RETURNING id INTO user_id;
    ELSE
        -- Use existing user
        user_id := existing_user_id;
    END IF;
    
    -- Add auth type based on type
    IF auth_type = 'individual' THEN
        INSERT INTO individual_auth (user_id, email, is_verified, is_active)
        VALUES (user_id, user_email, true, true)
        ON CONFLICT (email) DO UPDATE SET
            is_verified = true,
            is_active = true,
            updated_at = NOW();
    ELSIF auth_type = 'therapist' THEN
        INSERT INTO therapist_auth (user_id, email, is_verified, is_active)
        VALUES (user_id, user_email, true, true)
        ON CONFLICT (email) DO UPDATE SET
            is_verified = true,
            is_active = true,
            updated_at = NOW();
    ELSIF auth_type = 'partner' THEN
        INSERT INTO partner_auth (user_id, email, is_verified, is_active)
        VALUES (user_id, user_email, true, true)
        ON CONFLICT (email) DO UPDATE SET
            is_verified = true,
            is_active = true,
            updated_at = NOW();
    ELSIF auth_type = 'admin' THEN
        INSERT INTO admin_auth (user_id, email, is_verified, is_active, role)
        VALUES (user_id, user_email, true, true, 'admin')
        ON CONFLICT (email) DO UPDATE SET
            is_verified = true,
            is_active = true,
            updated_at = NOW();
    END IF;
    
    RETURN user_id;
END;
$$ LANGUAGE plpgsql;

-- 7. Create function to validate auth session
CREATE OR REPLACE FUNCTION validate_auth_session(
    session_token TEXT,
    auth_type VARCHAR(50)
)
RETURNS TABLE (
    user_id UUID,
    email TEXT,
    full_name TEXT,
    user_auth_type VARCHAR(50),
    is_valid BOOLEAN
) AS $$
BEGIN
    IF auth_type = 'individual' THEN
        RETURN QUERY
        SELECT 
            ind_sess.user_id,
            u.email,
            u.full_name,
            'individual' as user_auth_type,
            (ind_sess.expires_at > NOW()) as is_valid
        FROM individual_sessions ind_sess
        JOIN users u ON ind_sess.user_id = u.id
        WHERE ind_sess.session_token = session_token
        AND ind_sess.expires_at > NOW();
    ELSIF auth_type = 'therapist' THEN
        RETURN QUERY
        SELECT 
            ts.user_id,
            u.email,
            u.full_name,
            'therapist' as user_auth_type,
            (ts.expires_at > NOW()) as is_valid
        FROM therapist_sessions ts
        JOIN users u ON ts.user_id = u.id
        WHERE ts.session_token = session_token
        AND ts.expires_at > NOW();
    ELSIF auth_type = 'partner' THEN
        RETURN QUERY
        SELECT 
            ps.user_id,
            u.email,
            u.full_name,
            'partner' as user_auth_type,
            (ps.expires_at > NOW()) as is_valid
        FROM partner_sessions ps
        JOIN users u ON ps.user_id = u.id
        WHERE ps.session_token = session_token
        AND ps.expires_at > NOW();
    ELSIF auth_type = 'admin' THEN
        RETURN QUERY
        SELECT 
            ads.user_id,
            u.email,
            u.full_name,
            'admin' as user_auth_type,
            (ads.expires_at > NOW()) as is_valid
        FROM admin_sessions ads
        JOIN users u ON ads.user_id = u.id
        WHERE ads.session_token = session_token
        AND ads.expires_at > NOW();
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 8. Migrate existing data
-- Migrate existing individual users
INSERT INTO individual_auth (user_id, email, is_verified, is_active, credits, package_type)
SELECT id, email, is_verified, is_active, credits, package_type
FROM users
WHERE user_type = 'individual'
ON CONFLICT (email) DO NOTHING;

-- Migrate existing therapist users
INSERT INTO therapist_auth (user_id, email, is_verified, is_active, status, hourly_rate)
SELECT u.id, u.email, u.is_verified, u.is_active, 
       COALESCE(te.status, 'pending') as status,
       COALESCE(te.hourly_rate, 5000) as hourly_rate
FROM users u
LEFT JOIN therapist_enrollments te ON u.email = te.email
WHERE u.user_type = 'therapist'
ON CONFLICT (email) DO NOTHING;

-- 9. Create views for easy querying
CREATE OR REPLACE VIEW individual_users_view AS
SELECT 
    u.id,
    u.email,
    u.full_name,
    u.created_at as user_created_at,
    ia.is_verified,
    ia.is_active,
    ia.credits,
    ia.package_type,
    ia.created_at as auth_created_at
FROM users u
JOIN individual_auth ia ON u.id = ia.user_id
WHERE ia.is_active = true;

CREATE OR REPLACE VIEW therapist_users_view AS
SELECT 
    u.id,
    u.email,
    u.full_name,
    u.created_at as user_created_at,
    ta.is_verified,
    ta.is_active,
    ta.status,
    ta.hourly_rate,
    ta.created_at as auth_created_at
FROM users u
JOIN therapist_auth ta ON u.id = ta.user_id
WHERE ta.is_active = true;

-- 10. Add comments for documentation
COMMENT ON TABLE individual_auth IS 'Individual user authentication and profile data';
COMMENT ON TABLE therapist_auth IS 'Therapist authentication and profile data';
COMMENT ON TABLE partner_auth IS 'Partner authentication and profile data';
COMMENT ON TABLE individual_sessions IS 'Individual user sessions';
COMMENT ON TABLE therapist_sessions IS 'Therapist sessions';
COMMENT ON TABLE partner_sessions IS 'Partner sessions';
COMMENT ON FUNCTION get_available_auth_types IS 'Get all available authentication types for an email';
COMMENT ON FUNCTION add_auth_type IS 'Add authentication type to a user';
COMMENT ON FUNCTION validate_auth_session IS 'Validate session token for specific auth type';

-- End of script
