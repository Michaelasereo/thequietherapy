-- Fix audit_logs table by adding missing columns
-- This addresses the specific error: column "device_fingerprint" does not exist

-- Add missing columns to existing audit_logs table
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS device_fingerprint TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_audit_logs_device_fingerprint ON audit_logs(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_audit_logs_archived ON audit_logs(archived);

-- Add comments for documentation
COMMENT ON COLUMN audit_logs.device_fingerprint IS 'Device fingerprint for security tracking';
COMMENT ON COLUMN audit_logs.archived IS 'Whether the log entry has been archived for compliance';
