# Database Setup Guide for Video Features

## 🎯 **Overview**

This guide provides the SQL commands needed to set up the database tables for the video features, including session notes, processing queues, and error tracking.

## 🔒 **Compliance Notice**

**IMPORTANT: Daily.co Raw Recording Disabled for Compliance**

- ✅ **Browser MediaRecorder**: All audio recording is done locally in the browser
- ✅ **No Raw Audio Storage**: No raw audio files stored on Daily.co servers
- ✅ **Local Processing**: Audio processing happens locally before transcription
- ✅ **Transcripts Only**: Only text transcripts are stored in our database
- ✅ **NDPR Compliant**: Better compliance with Nigerian data protection laws

**Data Flow:**
1. **Browser Recording** → MediaRecorder captures audio locally
2. **Local Processing** → Audio processed in browser (no external storage)
3. **Transcription** → Only audio sent to OpenAI Whisper for text conversion
4. **Storage** → Only transcripts stored in our database
5. **Cleanup** → Raw audio deleted from browser after processing

This approach ensures maximum privacy and compliance with data protection regulations.

## 📋 **Required Tables**

### **1. Session Notes Table**

This table stores AI-generated session notes and transcriptions:

```sql
-- Create session_notes table if it doesn't exist
CREATE TABLE IF NOT EXISTS session_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  therapist_id UUID REFERENCES users(id),
  user_id UUID REFERENCES users(id),
  notes TEXT,
  mood_rating INTEGER DEFAULT 5,
  progress_notes TEXT,
  homework_assigned TEXT,
  next_session_focus TEXT,
  ai_generated BOOLEAN DEFAULT false,
  transcript TEXT,
  soap_subjective TEXT,
  soap_objective TEXT,
  soap_assessment TEXT,
  soap_plan TEXT,
  therapeutic_insights JSONB,
  recording_id TEXT,
  processing_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_session_notes_session_id ON session_notes(session_id);
CREATE INDEX IF NOT EXISTS idx_session_notes_therapist_id ON session_notes(therapist_id);
CREATE INDEX IF NOT EXISTS idx_session_notes_user_id ON session_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_session_notes_ai_generated ON session_notes(ai_generated);
CREATE INDEX IF NOT EXISTS idx_session_notes_created_at ON session_notes(created_at);
```

### **2. Session Processing Queue Table**

This table manages the queue for AI processing:

```sql
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

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_session_processing_queue_status ON session_processing_queue(status);
CREATE INDEX IF NOT EXISTS idx_session_processing_queue_created_at ON session_processing_queue(created_at);
```

### **3. Session Processing Errors Table**

This table tracks processing errors for debugging:

```sql
-- Create session_processing_errors table
CREATE TABLE IF NOT EXISTS session_processing_errors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  recording_id TEXT NOT NULL,
  error_message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_session_processing_errors_session_id ON session_processing_errors(session_id);
CREATE INDEX IF NOT EXISTS idx_session_processing_errors_created_at ON session_processing_errors(created_at);
```

### **4. Sessions Table (if not exists)**

This table stores session information:

```sql
-- Create sessions table if it doesn't exist
CREATE TABLE IF NOT EXISTS sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  therapist_id UUID REFERENCES users(id),
  daily_room_name TEXT,
  daily_room_recording_id TEXT,
  daily_room_recording_url TEXT,
  recording_duration INTEGER,
  recording_status TEXT DEFAULT 'not_started',
  recording_error TEXT,
  status TEXT DEFAULT 'scheduled',
  scheduled_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_therapist_id ON sessions(therapist_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at);
```

### **5. Users Table (if not exists)**

This table stores user information:

```sql
-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  user_type TEXT DEFAULT 'individual',
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  credits INTEGER DEFAULT 0,
  package_type TEXT DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
```

## 🔐 **Row Level Security (RLS) Policies**

### **Session Notes RLS**

```sql
-- Enable RLS on session_notes
ALTER TABLE session_notes ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own session notes
CREATE POLICY "Users can view their own session notes" ON session_notes
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = therapist_id);

-- Policy for therapists to manage session notes
CREATE POLICY "Therapists can manage session notes" ON session_notes
  FOR ALL USING (auth.uid() = therapist_id);

-- Policy for service role to manage all session notes
CREATE POLICY "Service role can manage session notes" ON session_notes
  FOR ALL USING (auth.role() = 'service_role');
```

### **Processing Queue RLS**

```sql
-- Enable RLS on session_processing_queue
ALTER TABLE session_processing_queue ENABLE ROW LEVEL SECURITY;

-- Policy for service role to manage processing queue
CREATE POLICY "Service role can manage session_processing_queue" ON session_processing_queue
  FOR ALL USING (auth.role() = 'service_role');
```

### **Processing Errors RLS**

```sql
-- Enable RLS on session_processing_errors
ALTER TABLE session_processing_errors ENABLE ROW LEVEL SECURITY;

-- Policy for service role to manage processing errors
CREATE POLICY "Service role can manage session_processing_errors" ON session_processing_errors
  FOR ALL USING (auth.role() = 'service_role');
```

## 🚀 **Complete Setup Script**

You can run this complete script to set up all required tables:

```sql
-- Complete database setup for video features
-- Run this in your Supabase SQL editor

-- 1. Create users table (if not exists)
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  user_type TEXT DEFAULT 'individual',
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  credits INTEGER DEFAULT 0,
  package_type TEXT DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create sessions table (if not exists)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  therapist_id UUID REFERENCES users(id),
  daily_room_name TEXT,
  daily_room_recording_id TEXT,
  daily_room_recording_url TEXT,
  recording_duration INTEGER,
  recording_status TEXT DEFAULT 'not_started',
  recording_error TEXT,
  status TEXT DEFAULT 'scheduled',
  scheduled_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create session_notes table
CREATE TABLE IF NOT EXISTS session_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  therapist_id UUID REFERENCES users(id),
  user_id UUID REFERENCES users(id),
  notes TEXT,
  mood_rating INTEGER DEFAULT 5,
  progress_notes TEXT,
  homework_assigned TEXT,
  next_session_focus TEXT,
  ai_generated BOOLEAN DEFAULT false,
  transcript TEXT,
  soap_subjective TEXT,
  soap_objective TEXT,
  soap_assessment TEXT,
  soap_plan TEXT,
  therapeutic_insights JSONB,
  recording_id TEXT,
  processing_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create session_processing_queue table
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

-- 5. Create session_processing_errors table
CREATE TABLE IF NOT EXISTS session_processing_errors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  recording_id TEXT NOT NULL,
  error_message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_therapist_id ON sessions(therapist_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at);

CREATE INDEX IF NOT EXISTS idx_session_notes_session_id ON session_notes(session_id);
CREATE INDEX IF NOT EXISTS idx_session_notes_therapist_id ON session_notes(therapist_id);
CREATE INDEX IF NOT EXISTS idx_session_notes_user_id ON session_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_session_notes_ai_generated ON session_notes(ai_generated);
CREATE INDEX IF NOT EXISTS idx_session_notes_created_at ON session_notes(created_at);

CREATE INDEX IF NOT EXISTS idx_session_processing_queue_status ON session_processing_queue(status);
CREATE INDEX IF NOT EXISTS idx_session_processing_queue_created_at ON session_processing_queue(created_at);

CREATE INDEX IF NOT EXISTS idx_session_processing_errors_session_id ON session_processing_errors(session_id);
CREATE INDEX IF NOT EXISTS idx_session_processing_errors_created_at ON session_processing_errors(created_at);

-- 7. Enable RLS and create policies
ALTER TABLE session_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_processing_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_processing_errors ENABLE ROW LEVEL SECURITY;

-- Session notes policies
CREATE POLICY "Users can view their own session notes" ON session_notes
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = therapist_id);

CREATE POLICY "Therapists can manage session notes" ON session_notes
  FOR ALL USING (auth.uid() = therapist_id);

CREATE POLICY "Service role can manage session notes" ON session_notes
  FOR ALL USING (auth.role() = 'service_role');

-- Processing queue policies
CREATE POLICY "Service role can manage session_processing_queue" ON session_processing_queue
  FOR ALL USING (auth.role() = 'service_role');

-- Processing errors policies
CREATE POLICY "Service role can manage session_processing_errors" ON session_processing_errors
  FOR ALL USING (auth.role() = 'service_role');

-- 8. Success message
SELECT 'Database setup completed successfully!' as status;
```

## 🔍 **Verification**

After running the setup script, you can verify the tables were created correctly:

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'sessions', 'session_notes', 'session_processing_queue', 'session_processing_errors');

-- Check table structures
\d users
\d sessions
\d session_notes
\d session_processing_queue
\d session_processing_errors
```

## 📊 **Sample Data (Optional)**

You can insert sample data for testing:

```sql
-- Insert sample user
INSERT INTO users (email, full_name, user_type) 
VALUES ('test@example.com', 'Test User', 'individual')
ON CONFLICT (email) DO NOTHING;

-- Insert sample session
INSERT INTO sessions (user_id, status, daily_room_name)
SELECT id, 'scheduled', 'test-room-123'
FROM users 
WHERE email = 'test@example.com'
LIMIT 1;
```

## 🎯 **Next Steps**

After setting up the database:

1. **Test the API endpoints** using the test pages
2. **Verify transcription storage** by recording audio
3. **Check error tracking** by monitoring the processing_errors table
4. **Monitor performance** using the created indexes

Your database is now ready for the video features! 🚀
