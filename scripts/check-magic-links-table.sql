-- Check and Create Magic Links Table
-- This script ensures the magic_links table exists with the correct structure

-- 1. Check if magic_links table exists
SELECT 
    'MAGIC LINKS TABLE STATUS' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'magic_links' AND table_schema = 'public'
        )
        THEN '✅ Magic links table exists'
        ELSE '❌ Magic links table does not exist - creating it now'
    END as status;

-- 2. Create magic_links table if it doesn't exist
CREATE TABLE IF NOT EXISTS magic_links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('booking', 'login', 'signup')),
    auth_type VARCHAR(50) CHECK (auth_type IN ('individual', 'therapist', 'partner', 'admin')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_magic_links_token ON magic_links(token);
CREATE INDEX IF NOT EXISTS idx_magic_links_email ON magic_links(email);
CREATE INDEX IF NOT EXISTS idx_magic_links_expires_at ON magic_links(expires_at);

-- 4. Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_magic_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_magic_links_updated_at ON magic_links;
CREATE TRIGGER trigger_update_magic_links_updated_at
    BEFORE UPDATE ON magic_links
    FOR EACH ROW
    EXECUTE FUNCTION update_magic_links_updated_at();

-- 5. Verify table creation
SELECT 
    'MAGIC LINKS TABLE VERIFICATION' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'magic_links' AND table_schema = 'public'
        )
        THEN '✅ Magic links table created/verified successfully'
        ELSE '❌ Magic links table creation failed'
    END as status;

-- 6. Show table structure
SELECT 
    'MAGIC LINKS TABLE STRUCTURE' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'magic_links' AND table_schema = 'public'
ORDER BY ordinal_position;
