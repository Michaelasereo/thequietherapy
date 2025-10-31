-- ============================================
-- CONSISTENCY CHECK LOGS TABLE
-- ============================================
-- Purpose: Store daily consistency check results
-- Used by: Automated consistency check cron job
-- ============================================

CREATE TABLE IF NOT EXISTS consistency_check_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Check results
  total_therapists INTEGER NOT NULL,
  consistent INTEGER NOT NULL,
  inconsistent INTEGER NOT NULL,
  auto_fixed INTEGER DEFAULT 0,
  
  -- Issues found (JSON format)
  issues_found JSONB,
  
  -- Timestamps
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_consistency_logs_timestamp ON consistency_check_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_consistency_logs_created_at ON consistency_check_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_consistency_logs_inconsistent ON consistency_check_logs(inconsistent) WHERE inconsistent > 0;

-- Comments
COMMENT ON TABLE consistency_check_logs IS 'Stores daily consistency check results for monitoring';
COMMENT ON COLUMN consistency_check_logs.total_therapists IS 'Total number of therapists checked';
COMMENT ON COLUMN consistency_check_logs.consistent IS 'Number of consistent therapists';
COMMENT ON COLUMN consistency_check_logs.inconsistent IS 'Number of inconsistent therapists';
COMMENT ON COLUMN consistency_check_logs.auto_fixed IS 'Number of issues automatically fixed';
COMMENT ON COLUMN consistency_check_logs.issues_found IS 'Details of issues found (JSON)';

-- Sample queries

-- Get recent check results
SELECT 
  timestamp,
  total_therapists,
  consistent,
  inconsistent,
  auto_fixed,
  ROUND((consistent::DECIMAL / total_therapists::DECIMAL * 100), 2) as consistency_rate
FROM consistency_check_logs
ORDER BY timestamp DESC
LIMIT 30;

-- Get consistency trend
SELECT 
  DATE(timestamp) as check_date,
  AVG(ROUND((consistent::DECIMAL / total_therapists::DECIMAL * 100), 2)) as avg_consistency_rate,
  MAX(inconsistent) as max_inconsistencies,
  SUM(auto_fixed) as total_auto_fixed
FROM consistency_check_logs
WHERE timestamp >= NOW() - INTERVAL '30 days'
GROUP BY DATE(timestamp)
ORDER BY check_date DESC;

-- Get days with high inconsistencies
SELECT 
  timestamp,
  inconsistent,
  ROUND((inconsistent::DECIMAL / total_therapists::DECIMAL * 100), 2) as inconsistency_rate,
  auto_fixed
FROM consistency_check_logs
WHERE inconsistent > 10
ORDER BY inconsistent DESC
LIMIT 20;

