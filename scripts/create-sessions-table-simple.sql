-- Simplified Sessions Table - No Complex Dependencies
-- This approach avoids direct DB dependencies for easier debugging

-- Create sessions table (simplified)
CREATE TABLE IF NOT EXISTS sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    therapist_id UUID NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    duration INTEGER DEFAULT 60,
    session_type VARCHAR(50) DEFAULT 'video',
    status VARCHAR(50) DEFAULT 'scheduled',
    notes TEXT,
    session_url VARCHAR(500),
    recording_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create therapist availability table (simplified)
CREATE TABLE IF NOT EXISTS therapist_availability (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    therapist_id UUID NOT NULL,
    day_of_week INTEGER NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Basic indexes only
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_therapist_id ON sessions(therapist_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_therapist_availability_therapist_id ON therapist_availability(therapist_id);

-- Add basic constraints later if needed
-- ALTER TABLE sessions ADD CONSTRAINT fk_sessions_user_id FOREIGN KEY (user_id) REFERENCES users(id);
-- ALTER TABLE sessions ADD CONSTRAINT fk_sessions_therapist_id FOREIGN KEY (therapist_id) REFERENCES users(id);
-- ALTER TABLE therapist_availability ADD CONSTRAINT fk_availability_therapist_id FOREIGN KEY (therapist_id) REFERENCES users(id);
