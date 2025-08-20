-- Create session_processing_queue table
CREATE TABLE IF NOT EXISTS session_processing_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  recording_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(session_id, recording_id)
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_session_processing_queue_status ON session_processing_queue(status);
CREATE INDEX IF NOT EXISTS idx_session_processing_queue_created_at ON session_processing_queue(created_at);

-- Create session_processing_errors table if it doesn't exist
CREATE TABLE IF NOT EXISTS session_processing_errors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  recording_id TEXT NOT NULL,
  error_message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for session_processing_errors
CREATE INDEX IF NOT EXISTS idx_session_processing_errors_session_id ON session_processing_errors(session_id);
CREATE INDEX IF NOT EXISTS idx_session_processing_errors_created_at ON session_processing_errors(created_at);

-- Add RLS policies
ALTER TABLE session_processing_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_processing_errors ENABLE ROW LEVEL SECURITY;

-- Policy for session_processing_queue (only service role can access)
CREATE POLICY "Service role can manage session_processing_queue" ON session_processing_queue
  FOR ALL USING (auth.role() = 'service_role');

-- Policy for session_processing_errors (only service role can access)
CREATE POLICY "Service role can manage session_processing_errors" ON session_processing_errors
  FOR ALL USING (auth.role() = 'service_role');
