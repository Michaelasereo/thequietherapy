-- ============================================
-- ERROR LOGS TABLE
-- ============================================
-- Purpose: Store application errors for monitoring and debugging
-- Used by: Global Error Boundary + Error Logging API
-- ============================================

-- Create error_logs table
CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Error details
  error_type VARCHAR(50) NOT NULL, -- 'runtime_error', 'promise_rejection', 'react_error', etc.
  message TEXT NOT NULL,
  stack TEXT,
  
  -- Context
  url TEXT,
  user_agent TEXT,
  ip_address INET,
  
  -- User information (if available)
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_email VARCHAR(255),
  
  -- Additional data (JSON for flexibility)
  additional_data JSONB,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Status tracking
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolution_notes TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_error_type ON error_logs(error_type);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_email ON error_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON error_logs(resolved) WHERE NOT resolved;

-- Full-text search on error messages
CREATE INDEX IF NOT EXISTS idx_error_logs_message_search ON error_logs USING gin(to_tsvector('english', message));

-- Comments for documentation
COMMENT ON TABLE error_logs IS 'Stores application errors for monitoring and debugging';
COMMENT ON COLUMN error_logs.error_type IS 'Type of error: runtime_error, promise_rejection, react_error, etc.';
COMMENT ON COLUMN error_logs.message IS 'Error message';
COMMENT ON COLUMN error_logs.stack IS 'Stack trace';
COMMENT ON COLUMN error_logs.url IS 'URL where error occurred';
COMMENT ON COLUMN error_logs.user_id IS 'User ID if authenticated';
COMMENT ON COLUMN error_logs.additional_data IS 'Additional context (JSON format)';

-- Enable Row Level Security (optional)
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can read error logs
CREATE POLICY "Admin can read error logs" ON error_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.user_type = 'admin'
    )
  );

-- Policy: Anyone can insert error logs (for logging)
CREATE POLICY "Anyone can insert error logs" ON error_logs
  FOR INSERT
  WITH CHECK (true);

-- Policy: Only admins can update error logs (mark as resolved)
CREATE POLICY "Admin can update error logs" ON error_logs
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.user_type = 'admin'
    )
  );

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get error statistics
CREATE OR REPLACE FUNCTION get_error_stats(
  days_back INTEGER DEFAULT 7
)
RETURNS TABLE (
  error_type VARCHAR(50),
  count BIGINT,
  first_seen TIMESTAMPTZ,
  last_seen TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    el.error_type,
    COUNT(*)::BIGINT as count,
    MIN(el.created_at) as first_seen,
    MAX(el.created_at) as last_seen
  FROM error_logs el
  WHERE el.created_at >= NOW() - (days_back || ' days')::INTERVAL
  GROUP BY el.error_type
  ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get top error messages
CREATE OR REPLACE FUNCTION get_top_errors(
  error_limit INTEGER DEFAULT 10,
  days_back INTEGER DEFAULT 7
)
RETURNS TABLE (
  message TEXT,
  count BIGINT,
  error_type VARCHAR(50),
  last_seen TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    el.message,
    COUNT(*)::BIGINT as count,
    el.error_type,
    MAX(el.created_at) as last_seen
  FROM error_logs el
  WHERE el.created_at >= NOW() - (days_back || ' days')::INTERVAL
  GROUP BY el.message, el.error_type
  ORDER BY count DESC
  LIMIT error_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old error logs
CREATE OR REPLACE FUNCTION cleanup_old_error_logs(
  days_to_keep INTEGER DEFAULT 90
)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM error_logs
  WHERE created_at < NOW() - (days_to_keep || ' days')::INTERVAL
  AND resolved = true;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check if table was created successfully
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'error_logs'
ORDER BY ordinal_position;

-- Check indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'error_logs'
ORDER BY indexname;

-- Sample query: Recent errors
SELECT 
  id,
  error_type,
  message,
  url,
  user_email,
  created_at
FROM error_logs
ORDER BY created_at DESC
LIMIT 10;

-- Sample query: Error statistics for last 7 days
SELECT * FROM get_error_stats(7);

-- Sample query: Top 10 errors
SELECT * FROM get_top_errors(10, 7);

-- ============================================
-- EXAMPLE USAGE
-- ============================================

/*
-- Insert test error
INSERT INTO error_logs (error_type, message, url, user_agent)
VALUES (
  'runtime_error',
  'Test error message',
  'https://example.com/test',
  'Mozilla/5.0...'
);

-- Get stats
SELECT * FROM get_error_stats(7);

-- Get top errors
SELECT * FROM get_top_errors(10, 7);

-- Mark error as resolved
UPDATE error_logs
SET 
  resolved = true,
  resolved_at = NOW(),
  resolved_by = 'admin-user-id',
  resolution_notes = 'Fixed by updating component'
WHERE id = 'error-id';

-- Clean up old resolved errors
SELECT cleanup_old_error_logs(90);
*/

