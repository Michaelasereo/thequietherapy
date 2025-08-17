-- Setup Magic Links Table for Authentication
-- Run this in your Supabase SQL Editor

-- Create magic_links table for tracking magic link requests
CREATE TABLE IF NOT EXISTS magic_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  token TEXT NOT NULL UNIQUE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('booking', 'login', 'signup')),
  auth_type VARCHAR(50) NOT NULL CHECK (auth_type IN ('individual', 'therapist', 'partner', 'admin')),
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB -- Store additional data like first_name for booking flow
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_magic_links_email ON magic_links(email);
CREATE INDEX IF NOT EXISTS idx_magic_links_token ON magic_links(token);
CREATE INDEX IF NOT EXISTS idx_magic_links_type ON magic_links(type);
CREATE INDEX IF NOT EXISTS idx_magic_links_auth_type ON magic_links(auth_type);
CREATE INDEX IF NOT EXISTS idx_magic_links_expires_at ON magic_links(expires_at);

-- Enable Row Level Security
ALTER TABLE magic_links ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own magic links" ON magic_links;
DROP POLICY IF EXISTS "Service role can manage magic links" ON magic_links;

-- Create policies for magic_links
CREATE POLICY "Users can view their own magic links" ON magic_links
  FOR SELECT USING (email = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "Service role can manage magic links" ON magic_links
  FOR ALL USING (auth.role() = 'service_role');

-- Function to clean up expired magic links
CREATE OR REPLACE FUNCTION cleanup_expired_magic_links()
RETURNS void AS $$
BEGIN
  DELETE FROM magic_links WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Verify the table was created
SELECT 'magic_links' as table_name, COUNT(*) as row_count FROM magic_links;
