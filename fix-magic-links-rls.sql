-- Fix Magic Links RLS Policies
-- This script fixes the Row Level Security policies for the magic_links table

-- First, let's check the current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'magic_links';

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view their own magic links" ON magic_links;
DROP POLICY IF EXISTS "Service role can manage magic links" ON magic_links;
DROP POLICY IF EXISTS "Allow magic link creation" ON magic_links;
DROP POLICY IF EXISTS "Allow magic link verification" ON magic_links;

-- Create comprehensive policies for magic_links table

-- Policy 1: Allow service role to do everything (for backend operations)
CREATE POLICY "Service role can manage magic links" ON magic_links
  FOR ALL USING (auth.role() = 'service_role');

-- Policy 2: Allow authenticated users to view their own magic links
CREATE POLICY "Users can view their own magic links" ON magic_links
  FOR SELECT USING (
    auth.role() = 'authenticated' AND 
    email = (auth.jwt() ->> 'email')
  );

-- Policy 3: Allow magic link creation (for login/signup flows)
CREATE POLICY "Allow magic link creation" ON magic_links
  FOR INSERT WITH CHECK (
    auth.role() IN ('anon', 'authenticated', 'service_role')
  );

-- Policy 4: Allow magic link verification (for login flows)
CREATE POLICY "Allow magic link verification" ON magic_links
  FOR UPDATE USING (
    auth.role() IN ('anon', 'authenticated', 'service_role')
  );

-- Policy 5: Allow magic link cleanup (for expired links)
CREATE POLICY "Allow magic link cleanup" ON magic_links
  FOR DELETE USING (
    auth.role() IN ('anon', 'authenticated', 'service_role') OR
    expires_at < NOW()
  );

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'magic_links'
ORDER BY policyname;

-- Test the table access
SELECT 'magic_links table accessible' as status, COUNT(*) as row_count FROM magic_links;
