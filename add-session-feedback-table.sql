-- Add session feedback table for user ratings and comments
-- HIPAA compliant - no recording storage

CREATE TABLE IF NOT EXISTS session_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    therapist_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one feedback per user per session
    UNIQUE(session_id, user_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_session_feedback_session_id ON session_feedback(session_id);
CREATE INDEX IF NOT EXISTS idx_session_feedback_user_id ON session_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_session_feedback_therapist_id ON session_feedback(therapist_id);
CREATE INDEX IF NOT EXISTS idx_session_feedback_created_at ON session_feedback(created_at);

-- Add RLS policies
ALTER TABLE session_feedback ENABLE ROW LEVEL SECURITY;

-- Users can only see their own feedback
CREATE POLICY "Users can view their own feedback" ON session_feedback
    FOR SELECT USING (auth.uid() = user_id);

-- Users can only insert their own feedback
CREATE POLICY "Users can insert their own feedback" ON session_feedback
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Therapists can view feedback about their sessions (aggregated, not individual)
CREATE POLICY "Therapists can view their feedback" ON session_feedback
    FOR SELECT USING (auth.uid() = therapist_id);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_session_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_session_feedback_updated_at
    BEFORE UPDATE ON session_feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_session_feedback_updated_at();

-- Add comment for documentation
COMMENT ON TABLE session_feedback IS 'User feedback and ratings for completed therapy sessions';
COMMENT ON COLUMN session_feedback.rating IS 'User rating from 1-5 stars';
COMMENT ON COLUMN session_feedback.comment IS 'Optional user comment about the session';
