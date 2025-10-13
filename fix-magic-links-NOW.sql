-- ================================================
-- FIX MAGIC LINKS - Run this in Supabase NOW!
-- ================================================

-- Fix the auth_type constraint to allow all user types
BEGIN;

-- Drop the old constraint
ALTER TABLE magic_links DROP CONSTRAINT IF EXISTS magic_links_auth_type_check;

-- Add new constraint with correct values
ALTER TABLE magic_links 
ADD CONSTRAINT magic_links_auth_type_check 
CHECK (auth_type IN ('individual', 'therapist', 'partner', 'admin'));

-- Clean up any invalid magic links
DELETE FROM magic_links WHERE auth_type NOT IN ('individual', 'therapist', 'partner', 'admin');

-- Clean up expired magic links to speed up queries
DELETE FROM magic_links WHERE expires_at < NOW();

-- Ensure auth_type column exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'magic_links' AND column_name = 'auth_type'
    ) THEN
        ALTER TABLE magic_links 
        ADD COLUMN auth_type VARCHAR(50);
    END IF;
END $$;

-- Make sure we have proper indexes for speed
CREATE INDEX IF NOT EXISTS idx_magic_links_token_active ON magic_links(token) WHERE used_at IS NULL AND expires_at > NOW();
CREATE INDEX IF NOT EXISTS idx_magic_links_email_active ON magic_links(email) WHERE used_at IS NULL AND expires_at > NOW();

COMMIT;

-- Verify the fix
SELECT 
  'MAGIC LINKS STATUS' as check,
  COUNT(*) as total_links,
  COUNT(CASE WHEN expires_at > NOW() AND used_at IS NULL THEN 1 END) as active_links,
  COUNT(CASE WHEN expires_at < NOW() THEN 1 END) as expired_links
FROM magic_links;

-- Check constraint is correct
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'magic_links'::regclass 
AND conname = 'magic_links_auth_type_check';

SELECT '✅ Magic links table fixed and optimized!' as status;

