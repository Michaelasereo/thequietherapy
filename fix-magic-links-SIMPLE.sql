-- ================================================
-- FIX MAGIC LINKS - SIMPLE VERSION (No errors!)
-- Run this in Supabase NOW!
-- ================================================

BEGIN;

-- Clean up expired magic links (speeds up queries!)
DELETE FROM magic_links WHERE expires_at < NOW();

-- Add simple, fast indexes (no predicates)
CREATE INDEX IF NOT EXISTS idx_magic_links_token ON magic_links(token);
CREATE INDEX IF NOT EXISTS idx_magic_links_email ON magic_links(email);
CREATE INDEX IF NOT EXISTS idx_magic_links_expires ON magic_links(expires_at);
CREATE INDEX IF NOT EXISTS idx_magic_links_used ON magic_links(used_at);

-- Fix the auth_type constraint
ALTER TABLE magic_links DROP CONSTRAINT IF EXISTS magic_links_auth_type_check;
ALTER TABLE magic_links 
ADD CONSTRAINT magic_links_auth_type_check 
CHECK (auth_type IN ('individual', 'therapist', 'partner', 'admin'));

COMMIT;

-- Verify
SELECT 
  'MAGIC LINKS FIXED!' as status,
  COUNT(*) as total_links,
  COUNT(CASE WHEN expires_at > NOW() AND used_at IS NULL THEN 1 END) as active_links
FROM magic_links;

SELECT '✅ Done! Magic links should be much faster now!' as result;

