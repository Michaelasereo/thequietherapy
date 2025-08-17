-- Fix Magic Links Table - Add Missing auth_type Column
-- This script adds the missing auth_type column that the application expects

-- Add the auth_type column to magic_links table
ALTER TABLE magic_links 
ADD COLUMN IF NOT EXISTS auth_type VARCHAR(50) CHECK (auth_type IN ('individual', 'therapist', 'partner', 'admin'));

-- Create an index on the auth_type column for better performance
CREATE INDEX IF NOT EXISTS idx_magic_links_auth_type ON magic_links(auth_type);

-- Update existing records to have a default auth_type based on the type column
-- This is a migration for existing data
UPDATE magic_links 
SET auth_type = CASE 
    WHEN type = 'login' THEN 'individual'
    WHEN type = 'signup' THEN 'individual'
    WHEN type = 'booking' THEN 'individual'
    ELSE 'individual'
END
WHERE auth_type IS NULL;

-- Make auth_type NOT NULL after setting default values
ALTER TABLE magic_links 
ALTER COLUMN auth_type SET NOT NULL;

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'magic_links' 
AND column_name IN ('auth_type', 'type')
ORDER BY column_name;

-- Show sample data to verify
SELECT 
    id,
    email,
    token,
    type,
    auth_type,
    expires_at,
    created_at
FROM magic_links 
ORDER BY created_at DESC 
LIMIT 5;
