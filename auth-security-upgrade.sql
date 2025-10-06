-- Authentication & Security Upgrade Migration
-- This migration implements healthcare-grade authentication with HIPAA compliance
-- Date: October 1, 2025

-- ================================================================
-- 1. UPDATE USER_SESSIONS TABLE
-- Add absolute expiry and fingerprinting support
-- ================================================================

-- Add absolute_expires_at column (30-day maximum session duration)
ALTER TABLE user_sessions 
ADD COLUMN IF NOT EXISTS absolute_expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days');

-- Add session fingerprinting for security
ALTER TABLE user_sessions
ADD COLUMN IF NOT EXISTS device_fingerprint VARCHAR(64);

-- Add IP address tracking
ALTER TABLE user_sessions
ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45);

-- Add user agent tracking
ALTER TABLE user_sessions
ADD COLUMN IF NOT EXISTS user_agent TEXT;

-- Update existing sessions to have absolute expiry
UPDATE user_sessions 
SET absolute_expires_at = created_at + INTERVAL '30 days'
WHERE absolute_expires_at IS NULL;

-- Add index for performance on active sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_active 
ON user_sessions(session_token, invalidated_at, absolute_expires_at) 
WHERE invalidated_at IS NULL AND absolute_expires_at > NOW();

-- Add index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_user_sessions_expired 
ON user_sessions(absolute_expires_at) 
WHERE invalidated_at IS NULL;

-- ================================================================
-- 2. CREATE RATE_LIMIT_ATTEMPTS TABLE
-- Track rate limiting for security
-- ================================================================

CREATE TABLE IF NOT EXISTS rate_limit_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    identifier VARCHAR(255) NOT NULL, -- email, IP, or token hash
    action VARCHAR(50) NOT NULL, -- 'magic_link_request', 'auth_attempt', etc.
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB
);

-- Index for rate limit lookups
CREATE INDEX IF NOT EXISTS idx_rate_limit_identifier_action 
ON rate_limit_attempts(identifier, action, created_at);

-- Index for cleanup
CREATE INDEX IF NOT EXISTS idx_rate_limit_created 
ON rate_limit_attempts(created_at);

-- Add RLS (Row Level Security)
ALTER TABLE rate_limit_attempts ENABLE ROW LEVEL SECURITY;

-- Policy: Only service role can access rate limits
CREATE POLICY "Service role only access" ON rate_limit_attempts
    FOR ALL
    USING (auth.role() = 'service_role');

-- ================================================================
-- 3. CREATE AUDIT_LOGS TABLE
-- HIPAA-compliant audit logging
-- ================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    device_fingerprint VARCHAR(64),
    session_id VARCHAR(255),
    metadata JSONB,
    archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user 
ON audit_logs(user_id, created_at DESC);

-- Index for event type
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type 
ON audit_logs(event_type, created_at DESC);

-- Index for suspicious activity queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_suspicious 
ON audit_logs(event_type, created_at DESC)
WHERE event_type IN ('suspicious_activity', 'session_hijack_attempt', 'rate_limit_exceeded');

-- Index for archival
CREATE INDEX IF NOT EXISTS idx_audit_logs_archived 
ON audit_logs(archived, created_at);

-- Add RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own logs
CREATE POLICY "Users can read own logs" ON audit_logs
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Service role has full access
CREATE POLICY "Service role full access" ON audit_logs
    FOR ALL
    USING (auth.role() = 'service_role');

-- Policy: Admins can read all logs
CREATE POLICY "Admins can read all logs" ON audit_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.user_type = 'admin'
        )
    );

-- ================================================================
-- 4. ADD MAGIC LINK EXPIRY TRACKING
-- Track why magic links expired (for analytics)
-- ================================================================

ALTER TABLE magic_links
ADD COLUMN IF NOT EXISTS expiry_reason VARCHAR(50);

-- Add index for analytics
CREATE INDEX IF NOT EXISTS idx_magic_links_expiry 
ON magic_links(expires_at, used_at, expiry_reason);

-- ================================================================
-- 5. CLEANUP FUNCTIONS
-- Automated cleanup of expired data
-- ================================================================

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM user_sessions
    WHERE (
        -- Expired beyond grace period
        expires_at < NOW() - INTERVAL '30 minutes'
        OR
        -- Exceeded absolute maximum
        absolute_expires_at < NOW()
    )
    AND invalidated_at IS NULL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old rate limit attempts
CREATE OR REPLACE FUNCTION cleanup_rate_limit_attempts()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM rate_limit_attempts
    WHERE created_at < NOW() - INTERVAL '24 hours';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to archive old audit logs
CREATE OR REPLACE FUNCTION archive_old_audit_logs()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE audit_logs
    SET archived = TRUE
    WHERE created_at < NOW() - INTERVAL '90 days'
    AND archived = FALSE;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- 6. SCHEDULED CLEANUP (CRON JOBS)
-- Run these via pg_cron or external scheduler
-- ================================================================

-- Note: If using Supabase, set these up in the dashboard
-- Or use pg_cron extension if available

-- Example cron commands (to be set up separately):
-- SELECT cron.schedule('cleanup_sessions', '0 * * * *', 'SELECT cleanup_expired_sessions()');
-- SELECT cron.schedule('cleanup_rate_limits', '0 0 * * *', 'SELECT cleanup_rate_limit_attempts()');
-- SELECT cron.schedule('archive_audit_logs', '0 2 * * 0', 'SELECT archive_old_audit_logs()');

-- ================================================================
-- 7. SECURITY VIEWS
-- Helper views for monitoring
-- ================================================================

-- View for active sessions
CREATE OR REPLACE VIEW active_sessions AS
SELECT 
    us.id,
    us.user_id,
    u.email,
    u.user_type,
    us.created_at,
    us.last_accessed_at,
    us.expires_at,
    us.absolute_expires_at,
    us.ip_address,
    us.device_fingerprint,
    EXTRACT(EPOCH FROM (us.absolute_expires_at - NOW())) / 3600 AS hours_until_absolute_expiry
FROM user_sessions us
JOIN users u ON us.user_id = u.id
WHERE us.invalidated_at IS NULL
AND us.absolute_expires_at > NOW();

-- View for suspicious activity
CREATE OR REPLACE VIEW suspicious_activity_summary AS
SELECT 
    event_type,
    COUNT(*) as occurrence_count,
    MAX(created_at) as last_occurrence,
    COUNT(DISTINCT user_id) as affected_users
FROM audit_logs
WHERE event_type IN ('suspicious_activity', 'session_hijack_attempt', 'rate_limit_exceeded')
AND created_at > NOW() - INTERVAL '7 days'
GROUP BY event_type
ORDER BY occurrence_count DESC;

-- ================================================================
-- 8. GRANT PERMISSIONS
-- ================================================================

-- Grant execute permissions on cleanup functions
GRANT EXECUTE ON FUNCTION cleanup_expired_sessions() TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_rate_limit_attempts() TO service_role;
GRANT EXECUTE ON FUNCTION archive_old_audit_logs() TO service_role;

-- Grant select on views
GRANT SELECT ON active_sessions TO service_role;
GRANT SELECT ON suspicious_activity_summary TO service_role;

-- ================================================================
-- 9. ADD HELPFUL COMMENTS
-- ================================================================

COMMENT ON TABLE rate_limit_attempts IS 'Tracks rate limiting attempts for security. Cleaned up after 24 hours.';
COMMENT ON TABLE audit_logs IS 'HIPAA-compliant audit log. Archived after 90 days, retained according to compliance requirements.';
COMMENT ON COLUMN user_sessions.absolute_expires_at IS 'Maximum session duration (30 days). Session cannot be refreshed beyond this time.';
COMMENT ON COLUMN user_sessions.device_fingerprint IS 'Hashed device fingerprint for detecting session hijacking.';
COMMENT ON FUNCTION cleanup_expired_sessions() IS 'Cleans up sessions expired beyond grace period or exceeding absolute maximum.';

-- ================================================================
-- MIGRATION COMPLETE
-- ================================================================

-- Verify migration
DO $$
BEGIN
    RAISE NOTICE '✅ Authentication security upgrade completed successfully';
    RAISE NOTICE 'Tables created/updated: user_sessions, rate_limit_attempts, audit_logs';
    RAISE NOTICE 'Functions created: cleanup_expired_sessions, cleanup_rate_limit_attempts, archive_old_audit_logs';
    RAISE NOTICE 'Views created: active_sessions, suspicious_activity_summary';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Set up cron jobs for cleanup functions';
    RAISE NOTICE '2. Update application code to use new security features';
    RAISE NOTICE '3. Test rate limiting and audit logging';
    RAISE NOTICE '4. Review active_sessions and suspicious_activity_summary views regularly';
END $$;

