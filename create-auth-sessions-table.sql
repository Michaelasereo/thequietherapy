-- Create authentication sessions table for user login sessions
CREATE TABLE IF NOT EXISTS auth_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id ON auth_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_token ON auth_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires_at ON auth_sessions(expires_at);

-- Enable Row Level Security
ALTER TABLE auth_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for auth_sessions
CREATE POLICY "Service role can manage auth sessions" ON auth_sessions
  FOR ALL USING (auth.role() = 'service_role');

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_auth_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM auth_sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Verify the table was created
SELECT 'auth_sessions' as table_name, COUNT(*) as row_count FROM auth_sessions;
