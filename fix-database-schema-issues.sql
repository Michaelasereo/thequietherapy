-- Fix database schema issues for authentication system
-- This script addresses the missing columns causing authentication errors

-- 1. Fix rate_limit_attempts table - add missing identifier column
DO $$ 
BEGIN
    -- Check if rate_limit_attempts table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'rate_limit_attempts') THEN
        -- Add identifier column if it doesn't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                      WHERE table_name = 'rate_limit_attempts' AND column_name = 'identifier') THEN
            ALTER TABLE rate_limit_attempts ADD COLUMN identifier TEXT;
            CREATE INDEX IF NOT EXISTS idx_rate_limit_attempts_identifier ON rate_limit_attempts(identifier);
            CREATE INDEX IF NOT EXISTS idx_rate_limit_attempts_action ON rate_limit_attempts(action);
            CREATE INDEX IF NOT EXISTS idx_rate_limit_attempts_created_at ON rate_limit_attempts(created_at);
        END IF;
    ELSE
        -- Create the rate_limit_attempts table if it doesn't exist
        CREATE TABLE rate_limit_attempts (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            identifier TEXT NOT NULL,
            action TEXT NOT NULL,
            ip_address INET,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        CREATE INDEX idx_rate_limit_attempts_identifier ON rate_limit_attempts(identifier);
        CREATE INDEX idx_rate_limit_attempts_action ON rate_limit_attempts(action);
        CREATE INDEX idx_rate_limit_attempts_created_at ON rate_limit_attempts(created_at);
        CREATE INDEX idx_rate_limit_attempts_identifier_action ON rate_limit_attempts(identifier, action);
    END IF;
END $$;

-- 2. Fix audit_logs table - add missing device_fingerprint column
DO $$ 
BEGIN
    -- Check if audit_logs table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
        -- Add device_fingerprint column if it doesn't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                      WHERE table_name = 'audit_logs' AND column_name = 'device_fingerprint') THEN
            ALTER TABLE audit_logs ADD COLUMN device_fingerprint TEXT;
            CREATE INDEX IF NOT EXISTS idx_audit_logs_device_fingerprint ON audit_logs(device_fingerprint);
        END IF;
        
        -- Add archived column if it doesn't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                      WHERE table_name = 'audit_logs' AND column_name = 'archived') THEN
            ALTER TABLE audit_logs ADD COLUMN archived BOOLEAN DEFAULT FALSE;
            CREATE INDEX IF NOT EXISTS idx_audit_logs_archived ON audit_logs(archived);
        END IF;
    ELSE
        -- Create the audit_logs table if it doesn't exist
        CREATE TABLE audit_logs (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
            event_type TEXT NOT NULL,
            ip_address INET,
            user_agent TEXT,
            device_fingerprint TEXT,
            session_id TEXT,
            metadata JSONB DEFAULT '{}',
            archived BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
        CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type);
        CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
        CREATE INDEX idx_audit_logs_device_fingerprint ON audit_logs(device_fingerprint);
        CREATE INDEX idx_audit_logs_archived ON audit_logs(archived);
        CREATE INDEX idx_audit_logs_metadata ON audit_logs USING GIN(metadata);
    END IF;
END $$;

-- 3. Create verification_tokens table if it doesn't exist (for magic links)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'verification_tokens') THEN
        CREATE TABLE verification_tokens (
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
        
        CREATE INDEX idx_verification_tokens_token ON verification_tokens(token);
        CREATE INDEX idx_verification_tokens_email ON verification_tokens(email);
        CREATE INDEX idx_verification_tokens_expires_at ON verification_tokens(expires_at);
        CREATE INDEX idx_verification_tokens_used ON verification_tokens(used);
        
        -- Add RLS policies
        ALTER TABLE verification_tokens ENABLE ROW LEVEL SECURITY;
        
        -- Policy for service role to access all tokens
        CREATE POLICY "Service role can access all verification tokens" ON verification_tokens
            FOR ALL USING (auth.role() = 'service_role');
            
        -- Policy for users to access their own tokens
        CREATE POLICY "Users can access their own verification tokens" ON verification_tokens
            FOR SELECT USING (email = auth.jwt() ->> 'email');
    END IF;
END $$;

-- 4. Clean up any orphaned records
DELETE FROM rate_limit_attempts WHERE created_at < NOW() - INTERVAL '7 days';
DELETE FROM verification_tokens WHERE expires_at < NOW() - INTERVAL '1 day';

-- 5. Create a function to clean up old rate limit attempts (for cron jobs)
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void AS $$
BEGIN
    DELETE FROM rate_limit_attempts WHERE created_at < NOW() - INTERVAL '24 hours';
    DELETE FROM verification_tokens WHERE expires_at < NOW() - INTERVAL '1 day';
    RAISE NOTICE 'Cleaned up old rate limit attempts and expired verification tokens';
END;
$$ LANGUAGE plpgsql;

-- 6. Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON rate_limit_attempts TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON audit_logs TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON verification_tokens TO service_role;

-- 7. Create indexes for better performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rate_limit_attempts_composite 
    ON rate_limit_attempts(identifier, action, created_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_composite 
    ON audit_logs(user_id, event_type, created_at);

COMMENT ON TABLE rate_limit_attempts IS 'Rate limiting attempts for authentication endpoints';
COMMENT ON TABLE audit_logs IS 'HIPAA-compliant audit logs for security events';
COMMENT ON TABLE verification_tokens IS 'Magic link verification tokens for authentication';
