-- Add Partner Columns to Users Table
-- This script adds partner-specific columns to the users table for complete partner onboarding

-- 1. Add company_name column (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'company_name') THEN
        ALTER TABLE users ADD COLUMN company_name VARCHAR(255);
        RAISE NOTICE 'Added company_name column to users table';
    ELSE
        RAISE NOTICE 'company_name column already exists';
    END IF;
END $$;

-- 2. Add organization_type column (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'organization_type') THEN
        ALTER TABLE users ADD COLUMN organization_type VARCHAR(100);
        RAISE NOTICE 'Added organization_type column to users table';
    ELSE
        RAISE NOTICE 'organization_type column already exists';
    END IF;
END $$;

-- 3. Add contact_person column (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'contact_person') THEN
        ALTER TABLE users ADD COLUMN contact_person VARCHAR(255);
        RAISE NOTICE 'Added contact_person column to users table';
    ELSE
        RAISE NOTICE 'contact_person column already exists';
    END IF;
END $$;

-- 4. Add phone column (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'phone') THEN
        ALTER TABLE users ADD COLUMN phone VARCHAR(20);
        RAISE NOTICE 'Added phone column to users table';
    ELSE
        RAISE NOTICE 'phone column already exists';
    END IF;
END $$;

-- 5. Add address column (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'address') THEN
        ALTER TABLE users ADD COLUMN address TEXT;
        RAISE NOTICE 'Added address column to users table';
    ELSE
        RAISE NOTICE 'address column already exists';
    END IF;
END $$;

-- 6. Add notify_purchases column (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'notify_purchases') THEN
        ALTER TABLE users ADD COLUMN notify_purchases BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added notify_purchases column to users table';
    ELSE
        RAISE NOTICE 'notify_purchases column already exists';
    END IF;
END $$;

-- 7. Add notify_usage column (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'notify_usage') THEN
        ALTER TABLE users ADD COLUMN notify_usage BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added notify_usage column to users table';
    ELSE
        RAISE NOTICE 'notify_usage column already exists';
    END IF;
END $$;

-- 8. Add api_key column (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'api_key') THEN
        ALTER TABLE users ADD COLUMN api_key VARCHAR(255);
        RAISE NOTICE 'Added api_key column to users table';
    ELSE
        RAISE NOTICE 'api_key column already exists';
    END IF;
END $$;

-- 9. Add partner_credits column for partner credit balance (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'partner_credits') THEN
        ALTER TABLE users ADD COLUMN partner_credits INTEGER DEFAULT 0;
        RAISE NOTICE 'Added partner_credits column to users table';
    ELSE
        RAISE NOTICE 'partner_credits column already exists';
    END IF;
END $$;

-- 10. Add partner_status column for partner account status (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'partner_status') THEN
        ALTER TABLE users ADD COLUMN partner_status VARCHAR(50) DEFAULT 'active' CHECK (partner_status IN ('active', 'suspended', 'pending'));
        RAISE NOTICE 'Added partner_status column to users table';
    ELSE
        RAISE NOTICE 'partner_status column already exists';
    END IF;
END $$;

-- 11. Create indexes for better performance on partner columns
CREATE INDEX IF NOT EXISTS idx_users_company_name ON users(company_name);
CREATE INDEX IF NOT EXISTS idx_users_organization_type ON users(organization_type);
CREATE INDEX IF NOT EXISTS idx_users_partner_status ON users(partner_status);

-- 12. Verify all partner columns were added
SELECT 
    'VERIFICATION' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN (
    'company_name', 'organization_type', 'contact_person', 'phone', 
    'address', 'notify_purchases', 'notify_usage', 'api_key', 
    'partner_credits', 'partner_status'
)
ORDER BY column_name;

-- 13. Summary of partner columns
SELECT 
    'PARTNER COLUMNS SUMMARY' as check_type,
    COUNT(*) as total_partner_columns,
    CASE 
        WHEN COUNT(*) >= 10 
        THEN '✅ All partner columns added successfully' 
        ELSE '⚠️ Some partner columns may be missing' 
    END as status
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN (
    'company_name', 'organization_type', 'contact_person', 'phone', 
    'address', 'notify_purchases', 'notify_usage', 'api_key', 
    'partner_credits', 'partner_status'
);
