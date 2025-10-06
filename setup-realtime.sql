-- Setup Supabase Real-time for TRPI App
-- Run this in your Supabase SQL editor to enable real-time subscriptions

-- Enable real-time for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE session_notes;
ALTER PUBLICATION supabase_realtime ADD TABLE user_credits;
ALTER PUBLICATION supabase_realtime ADD TABLE users;
ALTER PUBLICATION supabase_realtime ADD TABLE therapists;
ALTER PUBLICATION supabase_realtime ADD TABLE patient_biodata;

-- If the publication doesn't exist, create it
CREATE PUBLICATION supabase_realtime FOR ALL TABLES;

-- Enable Row Level Security (RLS) for real-time to work properly
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapists ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_biodata ENABLE ROW LEVEL SECURITY;

-- Create policies for real-time access
-- Sessions: Users can only see their own sessions
CREATE POLICY "Users can view own sessions" ON sessions
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = therapist_id);

-- Session notes: Users can only see their own notes
CREATE POLICY "Users can view own session notes" ON session_notes
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = therapist_id);

-- User credits: Users can only see their own credits
CREATE POLICY "Users can view own credits" ON user_credits
  FOR SELECT USING (auth.uid() = user_id);

-- Users: Users can see their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Therapists: Users can see therapist profiles
CREATE POLICY "Users can view therapist profiles" ON therapists
  FOR SELECT USING (true);

-- Patient biodata: Users can only see their own biodata
CREATE POLICY "Users can view own biodata" ON patient_biodata
  FOR SELECT USING (auth.uid() = user_id);

-- Grant necessary permissions for real-time
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Verify real-time is working
SELECT * FROM pg_publication WHERE pubname = 'supabase_realtime';
