-- Create authentication tables for magic link system

-- Add magic_link_token column to users table if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS magic_link_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS magic_link_expires_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- Create magic_links table for tracking magic link requests
CREATE TABLE IF NOT EXISTS magic_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  token TEXT NOT NULL UNIQUE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('booking', 'login', 'signup')),
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB -- Store additional data like first_name for booking flow
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_magic_links_email ON magic_links(email);
CREATE INDEX IF NOT EXISTS idx_magic_links_token ON magic_links(token);
CREATE INDEX IF NOT EXISTS idx_magic_links_type ON magic_links(type);
CREATE INDEX IF NOT EXISTS idx_magic_links_expires_at ON magic_links(expires_at);

-- Enable Row Level Security
ALTER TABLE magic_links ENABLE ROW LEVEL SECURITY;

-- Create policies for magic_links
CREATE POLICY "Users can view their own magic links" ON magic_links
  FOR SELECT USING (email = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "Service role can manage magic links" ON magic_links
  FOR ALL USING (auth.role() = 'service_role');

-- Add user_type column to users table if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_type VARCHAR(50) DEFAULT 'individual' CHECK (user_type IN ('individual', 'therapist', 'partner', 'admin'));

-- Create user_sessions table for tracking active sessions
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  last_accessed_at TIMESTAMP DEFAULT NOW(),
  user_agent TEXT,
  ip_address INET
);

-- Create indexes for user_sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

-- Enable Row Level Security
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for user_sessions
CREATE POLICY "Users can view their own sessions" ON user_sessions
  FOR ALL USING (auth.role() = 'service_role');

-- Function to clean up expired magic links
CREATE OR REPLACE FUNCTION cleanup_expired_magic_links()
RETURNS void AS $$
BEGIN
  DELETE FROM magic_links WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM user_sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create a function to get or create user
CREATE OR REPLACE FUNCTION get_or_create_user(
  p_email VARCHAR(255),
  p_first_name VARCHAR(255) DEFAULT NULL,
  p_user_type VARCHAR(50) DEFAULT 'individual'
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Check if user exists
  SELECT id INTO v_user_id FROM users WHERE email = p_email;
  
  -- If user doesn't exist, create new user
  IF v_user_id IS NULL THEN
    INSERT INTO users (id, email, full_name, user_type, is_verified, credits, package_type)
    VALUES (
      gen_random_uuid(),
      p_email,
      COALESCE(p_first_name, 'User'),
      p_user_type,
      false,
      10,
      'Basic'
    )
    RETURNING id INTO v_user_id;
  END IF;
  
  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql;

-- Verify the tables were created
SELECT 'magic_links' as table_name, COUNT(*) as row_count FROM magic_links
UNION ALL
SELECT 'user_sessions' as table_name, COUNT(*) as row_count FROM user_sessions;
