-- Create session notes table
CREATE TABLE IF NOT EXISTS session_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    notes TEXT,
    therapist_notes TEXT,
    patient_notes TEXT,
    soap_notes JSONB,
    transcript TEXT,
    ai_generated BOOLEAN DEFAULT FALSE,
    ai_notes_generated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(session_id)
);

-- Create session feedback table
CREATE TABLE IF NOT EXISTS session_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    therapist_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    technical_quality INTEGER CHECK (technical_quality >= 1 AND technical_quality <= 5),
    therapist_quality INTEGER CHECK (therapist_quality >= 1 AND therapist_quality <= 5),
    comments TEXT,
    would_recommend BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(session_id, user_id)
);

-- Ensure all columns exist (for existing tables)
ALTER TABLE session_feedback 
ADD COLUMN IF NOT EXISTS technical_quality INTEGER CHECK (technical_quality >= 1 AND technical_quality <= 5),
ADD COLUMN IF NOT EXISTS therapist_quality INTEGER CHECK (therapist_quality >= 1 AND therapist_quality <= 5),
ADD COLUMN IF NOT EXISTS would_recommend BOOLEAN DEFAULT FALSE;

-- Create session chat table
CREATE TABLE IF NOT EXISTS session_chat (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sender_name TEXT NOT NULL,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('patient', 'therapist')),
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add rating columns to users table for therapists
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS rating DECIMAL(3,1) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS therapist_quality_rating DECIMAL(3,1) DEFAULT 0.0;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_session_notes_session_id ON session_notes(session_id);
CREATE INDEX IF NOT EXISTS idx_session_feedback_session_id ON session_feedback(session_id);
CREATE INDEX IF NOT EXISTS idx_session_feedback_therapist_id ON session_feedback(therapist_id);
CREATE INDEX IF NOT EXISTS idx_session_chat_session_id ON session_chat(session_id);
CREATE INDEX IF NOT EXISTS idx_session_chat_created_at ON session_chat(created_at);

-- Create updated_at trigger for session_notes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_session_notes_updated_at ON session_notes;
CREATE TRIGGER update_session_notes_updated_at 
    BEFORE UPDATE ON session_notes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies for session_notes
ALTER TABLE session_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own session notes" ON session_notes;
CREATE POLICY "Users can view their own session notes" ON session_notes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM sessions 
            WHERE sessions.id = session_notes.session_id 
            AND (sessions.user_id = auth.uid() OR sessions.therapist_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can insert their own session notes" ON session_notes;
CREATE POLICY "Users can insert their own session notes" ON session_notes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM sessions 
            WHERE sessions.id = session_notes.session_id 
            AND (sessions.user_id = auth.uid() OR sessions.therapist_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can update their own session notes" ON session_notes;
CREATE POLICY "Users can update their own session notes" ON session_notes
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM sessions 
            WHERE sessions.id = session_notes.session_id 
            AND (sessions.user_id = auth.uid() OR sessions.therapist_id = auth.uid())
        )
    );

-- Add RLS policies for session_feedback
ALTER TABLE session_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own session feedback" ON session_feedback;
CREATE POLICY "Users can view their own session feedback" ON session_feedback
    FOR SELECT USING (
        user_id = auth.uid() OR therapist_id = auth.uid()
    );

DROP POLICY IF EXISTS "Users can insert their own session feedback" ON session_feedback;
CREATE POLICY "Users can insert their own session feedback" ON session_feedback
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND 
        EXISTS (
            SELECT 1 FROM sessions 
            WHERE sessions.id = session_feedback.session_id 
            AND sessions.user_id = auth.uid()
        )
    );

-- Add RLS policies for session_chat
ALTER TABLE session_chat ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view session chat for their sessions" ON session_chat;
CREATE POLICY "Users can view session chat for their sessions" ON session_chat
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM sessions 
            WHERE sessions.id = session_chat.session_id 
            AND (sessions.user_id = auth.uid() OR sessions.therapist_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can insert chat messages for their sessions" ON session_chat;
CREATE POLICY "Users can insert chat messages for their sessions" ON session_chat
    FOR INSERT WITH CHECK (
        sender_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM sessions 
            WHERE sessions.id = session_chat.session_id 
            AND (sessions.user_id = auth.uid() OR sessions.therapist_id = auth.uid())
        )
    );

-- Grant necessary permissions
GRANT ALL ON session_notes TO authenticated;
GRANT ALL ON session_feedback TO authenticated;
GRANT ALL ON session_chat TO authenticated;

-- Add helpful comments
COMMENT ON TABLE session_notes IS 'Stores session notes including AI-generated SOAP notes and transcripts';
COMMENT ON TABLE session_feedback IS 'Stores user feedback for completed sessions';
COMMENT ON TABLE session_chat IS 'Stores chat messages during video sessions';

COMMENT ON COLUMN session_notes.soap_notes IS 'JSON object containing subjective, objective, assessment, and plan sections';
COMMENT ON COLUMN session_notes.transcript IS 'AI-generated transcript from session recording';
COMMENT ON COLUMN session_feedback.rating IS 'Overall session rating from 1-5 stars';
COMMENT ON COLUMN session_feedback.technical_quality IS 'Technical quality rating for video/audio from 1-5 stars';
COMMENT ON COLUMN session_feedback.therapist_quality IS 'Therapist quality rating from 1-5 stars';
COMMENT ON COLUMN users.rating IS 'Average rating for therapist based on session feedback';
COMMENT ON COLUMN users.therapist_quality_rating IS 'Average therapist quality rating based on session feedback';
