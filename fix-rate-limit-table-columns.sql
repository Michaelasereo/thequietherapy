-- Fix rate_limit_attempts table by adding missing columns
-- This addresses the specific error: column "action" does not exist

-- Add missing columns to existing rate_limit_attempts table
ALTER TABLE rate_limit_attempts ADD COLUMN IF NOT EXISTS identifier TEXT;
ALTER TABLE rate_limit_attempts ADD COLUMN IF NOT EXISTS action TEXT;

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_rate_limit_attempts_identifier ON rate_limit_attempts(identifier);
CREATE INDEX IF NOT EXISTS idx_rate_limit_attempts_action ON rate_limit_attempts(action);
CREATE INDEX IF NOT EXISTS idx_rate_limit_attempts_created_at ON rate_limit_attempts(created_at);

-- Create composite index for better performance
CREATE INDEX IF NOT EXISTS idx_rate_limit_attempts_identifier_action ON rate_limit_attempts(identifier, action);

-- Add comments for documentation
COMMENT ON COLUMN rate_limit_attempts.identifier IS 'Email or IP address for rate limiting';
COMMENT ON COLUMN rate_limit_attempts.action IS 'Type of action being rate limited (e.g., magic_link_request)';

-- Clean up any orphaned records without required columns
DELETE FROM rate_limit_attempts WHERE identifier IS NULL OR action IS NULL;
