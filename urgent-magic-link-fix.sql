-- =============================================
-- URGENT MAGIC LINK FIXES
-- Fix missing tables causing magic link failures
-- =============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- FIX 1: RATE LIMIT ATTEMPTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS rate_limit_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    attempt_type TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    attempted_at TIMESTAMPTZ DEFAULT NOW(),
    success BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for rate limiting queries
CREATE INDEX IF NOT EXISTS idx_rate_limit_attempts_email_type 
ON rate_limit_attempts(email, attempt_type, attempted_at);

-- =============================================
-- FIX 2: AUDIT LOGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for audit queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action 
ON audit_logs(user_id, action, created_at DESC);

-- =============================================
-- FIX 3: MAGIC LINKS TABLE WITH MISSING COLUMNS
-- =============================================
-- First check if magic_links table exists, if not create it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'magic_links'
    ) THEN
        CREATE TABLE magic_links (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email TEXT NOT NULL,
            token TEXT UNIQUE NOT NULL,
            type TEXT NOT NULL,
            auth_type TEXT NOT NULL,
            expires_at TIMESTAMPTZ NOT NULL,
            used_at TIMESTAMPTZ,
            is_used BOOLEAN DEFAULT false,
            metadata JSONB,
            created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
            updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
        );
    ELSE
        -- Add missing columns to existing magic_links table
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'magic_links' AND column_name = 'updated_at'
        ) THEN
            ALTER TABLE magic_links ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'magic_links' AND column_name = 'is_used'
        ) THEN
            ALTER TABLE magic_links ADD COLUMN is_used BOOLEAN DEFAULT false;
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'magic_links' AND column_name = 'used_at'
        ) THEN
            ALTER TABLE magic_links ADD COLUMN used_at TIMESTAMPTZ;
        END IF;
    END IF;
END $$;

-- Index for magic links
CREATE INDEX IF NOT EXISTS idx_magic_links_token ON magic_links(token);
CREATE INDEX IF NOT EXISTS idx_magic_links_email_type ON magic_links(email, type, auth_type);

-- =============================================
-- FIX 4: AUTH SESSIONS TABLE (if missing)
-- =============================================
CREATE TABLE IF NOT EXISTS auth_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    session_token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for sessions
CREATE INDEX IF NOT EXISTS idx_auth_sessions_token ON auth_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_user ON auth_sessions(user_id);

-- =============================================
-- COMPLETION MESSAGE
-- =============================================
DO $$
BEGIN
    RAISE NOTICE '=============================================';
    RAISE NOTICE 'URGENT MAGIC LINK FIXES APPLIED SUCCESSFULLY';
    RAISE NOTICE '=============================================';
    RAISE NOTICE 'Fixed tables:';
    RAISE NOTICE '- rate_limit_attempts';
    RAISE NOTICE '- audit_logs';
    RAISE NOTICE '- magic_links (with updated_at column)';
    RAISE NOTICE '- auth_sessions';
    RAISE NOTICE '=============================================';
    RAISE NOTICE 'Magic link system should now work properly';
    RAISE NOTICE '=============================================';
END $$;
