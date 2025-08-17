-- Create Partners Table
-- This script creates the partners table that's expected by the application

-- 1. Create partners table if it doesn't exist
CREATE TABLE IF NOT EXISTS partners (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_name VARCHAR(255) NOT NULL,
    organization_type VARCHAR(50) NOT NULL CHECK (organization_type IN ('hospital', 'clinic', 'ngo', 'school', 'corporate', 'government')),
    contact_person VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    address TEXT NOT NULL,
    website VARCHAR(255),
    is_verified BOOLEAN DEFAULT false,
    verification_status VARCHAR(50) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create index on user_id for better performance
CREATE INDEX IF NOT EXISTS idx_partners_user_id ON partners(user_id);

-- 3. Create index on organization_name for search
CREATE INDEX IF NOT EXISTS idx_partners_organization_name ON partners(organization_name);

-- 4. Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_partners_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_partners_updated_at ON partners;
CREATE TRIGGER trigger_update_partners_updated_at
    BEFORE UPDATE ON partners
    FOR EACH ROW
    EXECUTE FUNCTION update_partners_updated_at();

-- 5. Verify table creation
SELECT 
    'PARTNERS TABLE STATUS' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'partners' AND table_schema = 'public'
        )
        THEN '✅ Partners table created successfully'
        ELSE '❌ Partners table creation failed'
    END as status;

-- 6. Show table structure
SELECT 
    'PARTNERS TABLE STRUCTURE' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'partners' AND table_schema = 'public'
ORDER BY ordinal_position;
