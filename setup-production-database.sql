-- ============================================================
-- PRODUCTION DATABASE SETUP FOR SIGNUP
-- Run this in Supabase SQL Editor to fix signup errors
-- ============================================================

-- 1. Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
DROP POLICY IF EXISTS "Service role full access to audit_logs" ON audit_logs;
CREATE POLICY "Service role full access to audit_logs"
  ON audit_logs FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- 2. Verify/create magic_links table
CREATE TABLE IF NOT EXISTS magic_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  auth_type TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_magic_links_email ON magic_links(email);
CREATE INDEX IF NOT EXISTS idx_magic_links_token ON magic_links(token);
CREATE INDEX IF NOT EXISTS idx_magic_links_expires ON magic_links(expires_at);

-- Enable RLS
ALTER TABLE magic_links ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
DROP POLICY IF EXISTS "Service role full access to magic_links" ON magic_links;
CREATE POLICY "Service role full access to magic_links"
  ON magic_links FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- 3. Ensure users table has proper RLS for service role
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow service role to read users
DROP POLICY IF EXISTS "Service role can read users" ON users;
CREATE POLICY "Service role can read users"
  ON users FOR SELECT TO service_role
  USING (true);

-- Allow service role to insert users  
DROP POLICY IF EXISTS "Service role can insert users" ON users;
CREATE POLICY "Service role can insert users"
  ON users FOR INSERT TO service_role
  WITH CHECK (true);

-- Allow service role to update users
DROP POLICY IF EXISTS "Service role can update users" ON users;
CREATE POLICY "Service role can update users"
  ON users FOR UPDATE TO service_role
  USING (true) WITH CHECK (true);

-- 4. Verification: Check all tables exist and are accessible
SELECT 
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'users'
  ) THEN '✅ users' ELSE '❌ users MISSING' END as users_table,
  
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'magic_links'
  ) THEN '✅ magic_links' ELSE '❌ magic_links MISSING' END as magic_links_table,
  
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'audit_logs'
  ) THEN '✅ audit_logs' ELSE '❌ audit_logs MISSING' END as audit_logs_table;

-- 5. Show current counts
SELECT 
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM magic_links) as total_magic_links,
  (SELECT COUNT(*) FROM audit_logs) as total_audit_logs;

