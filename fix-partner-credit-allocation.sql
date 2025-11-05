-- Fix Partner Credit Allocation System
-- This script fixes critical issues in the credit allocation system
-- Run this in your Supabase SQL Editor

-- =====================================================
-- 1. FIX allocate_partner_credit() FUNCTION
-- Adds credit balance check, atomic update, and bulk insert
-- =====================================================

CREATE OR REPLACE FUNCTION allocate_partner_credit(
    p_partner_id UUID,
    p_employee_email TEXT,
    p_employee_name TEXT DEFAULT NULL,
    p_credits_count INTEGER DEFAULT 1,
    p_expires_days INTEGER DEFAULT 90
)
RETURNS BOOLEAN AS $$
DECLARE
    partner_credits_available INTEGER;
    partner_exists BOOLEAN;
BEGIN
    -- Get and lock partner's credit balance (prevents race conditions)
    SELECT credits, true INTO partner_credits_available, partner_exists
    FROM users 
    WHERE id = p_partner_id 
    AND user_type = 'partner' 
    AND is_active = true
    FOR UPDATE;
    
    -- Check if partner exists
    IF NOT partner_exists THEN
        RETURN false;
    END IF;
    
    -- Check if partner has enough credits
    IF partner_credits_available IS NULL OR partner_credits_available < p_credits_count THEN
        RETURN false;
    END IF;
    
    -- Bulk insert credits (more efficient than loop)
    INSERT INTO partner_credits (
        partner_id,
        employee_email,
        employee_name,
        credits_allocated,
        credits_used,
        session_duration_minutes,
        status,
        allocated_by,
        allocated_at,
        expires_at
    )
    SELECT 
        p_partner_id,
        p_employee_email,
        p_employee_name,
        1,
        0,
        25, -- Partner credits are 25-minute sessions
        'active',
        p_partner_id,
        NOW(),
        CASE WHEN p_expires_days > 0 THEN NOW() + (p_expires_days || ' days')::INTERVAL ELSE NULL END
    FROM generate_series(1, p_credits_count);
    
    -- Update partner balance atomically
    UPDATE users 
    SET credits = credits - p_credits_count 
    WHERE id = p_partner_id;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 2. ADD DATABASE CONSTRAINTS AND INDEXES
-- =====================================================

-- Add unique constraint on email per partner for partner_members
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_email_per_partner'
    ) THEN
        ALTER TABLE partner_members 
        ADD CONSTRAINT unique_email_per_partner 
        UNIQUE (partner_id, email);
    END IF;
END $$;

-- Add index on email for faster lookups in partner_members
CREATE INDEX IF NOT EXISTS idx_partner_members_email 
ON partner_members(email);

-- Add index on partner_id and email for partner_members
CREATE INDEX IF NOT EXISTS idx_partner_members_partner_email 
ON partner_members(partner_id, email);

-- Add index on employee_email and status for partner_credits (credit lookup)
CREATE INDEX IF NOT EXISTS idx_partner_credits_lookup 
ON partner_credits(employee_email, status, expires_at) 
WHERE status = 'active';

-- Add index on partner_id and status for partner_credits
CREATE INDEX IF NOT EXISTS idx_partner_credits_partner_status 
ON partner_credits(partner_id, status);

-- Add index on partner_id for credits in users table
CREATE INDEX IF NOT EXISTS idx_users_partner_credits 
ON users(credits) 
WHERE user_type = 'partner';

-- =====================================================
-- 3. VERIFICATION
-- =====================================================

-- Verify function exists
SELECT 
    proname as function_name,
    pg_get_function_arguments(oid) as arguments
FROM pg_proc 
WHERE proname = 'allocate_partner_credit';

-- Show indexes created
SELECT 
    tablename,
    indexname
FROM pg_indexes
WHERE tablename IN ('partner_members', 'partner_credits', 'users')
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

SELECT 'Partner credit allocation system fixed successfully!' as status;

