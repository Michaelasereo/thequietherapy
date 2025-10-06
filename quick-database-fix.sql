-- Quick fix for the most critical database schema issues
-- Run this in your Supabase SQL Editor to fix the immediate problems

-- 1. Fix audit_logs table - add missing columns
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS event_type TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS device_fingerprint TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;

-- 2. Fix rate_limit_attempts table - add missing columns
ALTER TABLE rate_limit_attempts ADD COLUMN IF NOT EXISTS identifier TEXT;
ALTER TABLE rate_limit_attempts ADD COLUMN IF NOT EXISTS action TEXT;

-- 3. Create verification_tokens table if it doesn't exist
CREATE TABLE IF NOT EXISTS verification_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    token TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    user_type TEXT NOT NULL,
    auth_type TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_device_fingerprint ON audit_logs(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_rate_limit_attempts_identifier ON rate_limit_attempts(identifier);
CREATE INDEX IF NOT EXISTS idx_rate_limit_attempts_action ON rate_limit_attempts(action);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_token ON verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_email ON verification_tokens(email);

-- 5. Enable RLS on verification_tokens
ALTER TABLE verification_tokens ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for verification_tokens
CREATE POLICY IF NOT EXISTS "Service role can access all verification tokens" ON verification_tokens
    FOR ALL USING (auth.role() = 'service_role');
    
CREATE POLICY IF NOT EXISTS "Users can access their own verification tokens" ON verification_tokens
    FOR SELECT USING (email = auth.jwt() ->> 'email');
