-- ============================================================
-- FIX MAGIC LINK VERIFICATION - Run in Supabase
-- This creates the missing functions and tables
-- ============================================================

-- 1. Create user_sessions table (if missing)
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);

-- Enable RLS
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
DROP POLICY IF EXISTS "Service role full access to user_sessions" ON user_sessions;
CREATE POLICY "Service role full access to user_sessions"
  ON user_sessions FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Allow users to read their own sessions
DROP POLICY IF EXISTS "Users can read own sessions" ON user_sessions;
CREATE POLICY "Users can read own sessions"
  ON user_sessions FOR SELECT
  USING (auth.uid() = user_id);


-- 2. Create helper function: create_or_get_user
CREATE OR REPLACE FUNCTION create_or_get_user(
  p_email TEXT,
  p_full_name TEXT,
  p_user_type TEXT
) RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Try to get existing user
  SELECT id INTO v_user_id
  FROM users
  WHERE email = p_email;
  
  -- If not exists, create new user
  IF v_user_id IS NULL THEN
    INSERT INTO users (
      email, 
      full_name, 
      user_type, 
      is_verified, 
      is_active, 
      credits,
      created_at,
      updated_at
    )
    VALUES (
      p_email, 
      p_full_name, 
      p_user_type, 
      true, 
      true, 
      0,
      NOW(),
      NOW()
    )
    RETURNING id INTO v_user_id;
    
    RAISE NOTICE 'Created new user: %', v_user_id;
  ELSE
    RAISE NOTICE 'Found existing user: %', v_user_id;
  END IF;
  
  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. Create helper function: create_user_session
CREATE OR REPLACE FUNCTION create_user_session(
  p_user_id UUID,
  p_session_token TEXT,
  p_expires_at TIMESTAMPTZ,
  p_user_agent TEXT DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_session_id UUID;
BEGIN
  -- Delete any existing sessions for this user (optional - single session per user)
  DELETE FROM user_sessions 
  WHERE user_id = p_user_id;
  
  -- Create new session
  INSERT INTO user_sessions (
    user_id,
    session_token,
    expires_at,
    created_at,
    last_accessed_at
  )
  VALUES (
    p_user_id,
    p_session_token,
    p_expires_at,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_session_id;
  
  RAISE NOTICE 'Created session: %', v_session_id;
  
  RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. Verify everything was created
DO $$
BEGIN
  -- Check user_sessions table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_sessions') THEN
    RAISE NOTICE '✅ user_sessions table exists';
  ELSE
    RAISE NOTICE '❌ user_sessions table MISSING';
  END IF;
  
  -- Check create_or_get_user function
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'create_or_get_user') THEN
    RAISE NOTICE '✅ create_or_get_user function exists';
  ELSE
    RAISE NOTICE '❌ create_or_get_user function MISSING';
  END IF;
  
  -- Check create_user_session function
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'create_user_session') THEN
    RAISE NOTICE '✅ create_user_session function exists';
  ELSE
    RAISE NOTICE '❌ create_user_session function MISSING';
  END IF;
END $$;

-- 5. Display summary
SELECT 
  'Setup complete!' as status,
  (SELECT COUNT(*) FROM user_sessions) as total_sessions,
  (SELECT COUNT(*) FROM magic_links) as total_magic_links,
  (SELECT COUNT(*) FROM users WHERE is_verified = true) as verified_users;

