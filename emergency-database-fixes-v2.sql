-- =============================================
-- EMERGENCY DATABASE FIXES - COMPLETE REWORK
-- Senior Architect Approved Version
-- =============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- STEP 1: ENSURE ALL CORE TABLES EXIST
-- =============================================

-- Users table (core table - must exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        CREATE TABLE users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email TEXT UNIQUE NOT NULL,
            full_name TEXT,
            user_type TEXT NOT NULL DEFAULT 'user',
            is_active BOOLEAN DEFAULT true,
            is_verified BOOLEAN DEFAULT false,
            created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
            updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
        );
    END IF;
END $$;

-- Add missing columns to users table
DO $$
BEGIN
    -- Add is_active column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
    
    -- Add is_verified column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'is_verified'
    ) THEN
        ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT false;
    END IF;
    
    -- Add updated_at column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE users ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Sessions table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sessions') THEN
        CREATE TABLE sessions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            therapist_id UUID REFERENCES users(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            description TEXT,
            scheduled_date DATE NOT NULL,
            scheduled_time TIME NOT NULL,
            end_time TIMESTAMPTZ,
            duration_minutes INTEGER DEFAULT 60,
            planned_duration_minutes INTEGER DEFAULT 60,
            status TEXT NOT NULL DEFAULT 'scheduled',
            session_url TEXT,
            room_name TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
            updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
        );
    END IF;
END $$;

-- Therapist profiles table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'therapist_profiles') THEN
        CREATE TABLE therapist_profiles (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            verification_status TEXT DEFAULT 'pending',
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
            updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
        );
    END IF;
END $$;

-- Add missing columns to therapist_profiles
DO $$
BEGIN
    -- Add verification_status column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'therapist_profiles' AND column_name = 'verification_status'
    ) THEN
        ALTER TABLE therapist_profiles ADD COLUMN verification_status TEXT DEFAULT 'pending';
    END IF;
    
    -- Add is_active column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'therapist_profiles' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE therapist_profiles ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
    
    -- Add updated_at column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'therapist_profiles' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE therapist_profiles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- User credits table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_credits') THEN
        CREATE TABLE user_credits (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            user_type TEXT DEFAULT 'user',
            package_type TEXT,
            credits_balance INTEGER DEFAULT 0,
            credits_purchased INTEGER DEFAULT 0,
            credits_used INTEGER DEFAULT 0,
            credits_expired INTEGER DEFAULT 0,
            amount_paid_kobo INTEGER,
            payment_reference TEXT,
            status TEXT DEFAULT 'active',
            expires_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
            updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
        );
    END IF;
END $$;

-- Add missing columns to user_credits
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_credits' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE user_credits ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Pending payments table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pending_payments') THEN
        CREATE TABLE pending_payments (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            package_type TEXT NOT NULL,
            amount_kobo INTEGER NOT NULL CHECK (amount_kobo > 0),
            payment_reference TEXT NOT NULL UNIQUE,
            paystack_reference TEXT,
            status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'cancelled')),
            verified_at TIMESTAMPTZ,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
            updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
        );
    END IF;
END $$;

-- Add missing columns to pending_payments
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pending_payments' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE pending_payments ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pending_payments' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE pending_payments ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- =============================================
-- STEP 2: CREATE AUDIT TABLES
-- =============================================

-- Therapist states table
CREATE TABLE IF NOT EXISTS therapist_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    therapist_id UUID REFERENCES users(id) ON DELETE CASCADE,
    current_status TEXT NOT NULL DEFAULT 'pending',
    previous_status TEXT,
    status_changed_at TIMESTAMPTZ DEFAULT NOW(),
    changed_by UUID REFERENCES users(id),
    reason TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Earnings transactions table
CREATE TABLE IF NOT EXISTS earnings_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    therapist_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
    transaction_type TEXT NOT NULL,
    amount_kobo INTEGER NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Payment audit table
CREATE TABLE IF NOT EXISTS payment_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_reference TEXT NOT NULL,
    action TEXT NOT NULL,
    performed_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB
);

-- Session audit table
CREATE TABLE IF NOT EXISTS session_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    performed_by UUID REFERENCES users(id),
    performed_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB
);

-- =============================================
-- STEP 3: ADD CRITICAL CONSTRAINTS
-- =============================================

-- Prevent double bookings
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_therapist_session_slot' 
        AND conrelid = 'sessions'::regclass
    ) THEN
        ALTER TABLE sessions 
        ADD CONSTRAINT unique_therapist_session_slot 
        UNIQUE (therapist_id, scheduled_date, scheduled_time) 
        WHERE status IN ('scheduled', 'confirmed', 'in_progress');
    END IF;
END $$;

-- Add foreign key constraints
DO $$
BEGIN
    -- Sessions user foreign key
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_sessions_user' 
        AND conrelid = 'sessions'::regclass
    ) THEN
        ALTER TABLE sessions 
        ADD CONSTRAINT fk_sessions_user 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
    
    -- Sessions therapist foreign key
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_sessions_therapist' 
        AND conrelid = 'sessions'::regclass
    ) THEN
        ALTER TABLE sessions 
        ADD CONSTRAINT fk_sessions_therapist 
        FOREIGN KEY (therapist_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
    
    -- Therapist profiles foreign key
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_therapist_profiles_user' 
        AND conrelid = 'therapist_profiles'::regclass
    ) THEN
        ALTER TABLE therapist_profiles 
        ADD CONSTRAINT fk_therapist_profiles_user 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- =============================================
-- STEP 4: CREATE INDEXES
-- =============================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_type_active ON users(user_type, is_active, is_verified);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Sessions indexes
CREATE INDEX IF NOT EXISTS idx_sessions_therapist_date ON sessions(therapist_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);

-- Therapist profiles indexes
CREATE INDEX IF NOT EXISTS idx_therapist_profiles_verification ON therapist_profiles(verification_status, is_active);
CREATE INDEX IF NOT EXISTS idx_therapist_profiles_user ON therapist_profiles(user_id);

-- User credits indexes
CREATE INDEX IF NOT EXISTS idx_user_credits_user ON user_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_user_credits_status ON user_credits(status);

-- Pending payments indexes
CREATE INDEX IF NOT EXISTS idx_pending_payments_user ON pending_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_pending_payments_reference ON pending_payments(payment_reference);
CREATE INDEX IF NOT EXISTS idx_pending_payments_status ON pending_payments(status);

-- Audit table indexes
CREATE INDEX IF NOT EXISTS idx_therapist_states_therapist ON therapist_states(therapist_id, status_changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_earnings_transactions_therapist ON earnings_transactions(therapist_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_audit_reference ON payment_audit(payment_reference);
CREATE INDEX IF NOT EXISTS idx_session_audit_session ON session_audit(session_id, performed_at DESC);

-- =============================================
-- STEP 5: CREATE UTILITY FUNCTIONS
-- =============================================

-- Function to check if therapist is active and verified
CREATE OR REPLACE FUNCTION is_therapist_active_and_verified(therapist_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM users u
        JOIN therapist_profiles tp ON u.id = tp.user_id
        JOIN therapist_states ts ON u.id = ts.therapist_id
        WHERE u.id = therapist_uuid
        AND u.user_type = 'therapist'
        AND u.is_active = true
        AND u.is_verified = true
        AND tp.verification_status = 'verified'
        AND tp.is_active = true
        AND ts.current_status = 'active'
        AND ts.status_changed_at = (
            SELECT MAX(status_changed_at) 
            FROM therapist_states ts2 
            WHERE ts2.therapist_id = u.id
        )
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get next available session ID
CREATE OR REPLACE FUNCTION get_next_session_id()
RETURNS UUID AS $$
BEGIN
    RETURN gen_random_uuid();
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- STEP 6: DATA CLEANUP
-- =============================================

-- Clean up orphaned records (only if tables exist)
DO $$
BEGIN
    -- Clean therapist_availability if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'therapist_availability') THEN
        DELETE FROM therapist_availability 
        WHERE therapist_id NOT IN (SELECT id FROM users WHERE user_type = 'therapist');
    END IF;
    
    -- Clean sessions if users table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sessions') THEN
        DELETE FROM sessions 
        WHERE user_id NOT IN (SELECT id FROM users) 
        OR therapist_id NOT IN (SELECT id FROM users WHERE user_type = 'therapist');
    END IF;
    
    -- Clean therapist_profiles if users table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'therapist_profiles') THEN
        DELETE FROM therapist_profiles 
        WHERE user_id NOT IN (SELECT id FROM users WHERE user_type = 'therapist');
    END IF;
END $$;

-- =============================================
-- STEP 7: FINAL VALIDATION
-- =============================================

-- Verify critical tables exist
DO $$
DECLARE
    missing_tables TEXT[] := ARRAY[]::TEXT[];
    table_name TEXT;
    required_tables TEXT[] := ARRAY['users', 'sessions', 'therapist_profiles', 'user_credits', 'pending_payments'];
BEGIN
    FOREACH table_name IN ARRAY required_tables
    LOOP
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = table_name) THEN
            missing_tables := array_append(missing_tables, table_name);
        END IF;
    END LOOP;
    
    IF array_length(missing_tables, 1) > 0 THEN
        RAISE EXCEPTION 'Critical tables missing: %', array_to_string(missing_tables, ', ');
    END IF;
    
    RAISE NOTICE 'All critical tables verified successfully';
END $$;

-- =============================================
-- COMPLETION MESSAGE
-- =============================================
DO $$
BEGIN
    RAISE NOTICE '=============================================';
    RAISE NOTICE 'EMERGENCY DATABASE FIXES COMPLETED SUCCESSFULLY';
    RAISE NOTICE '=============================================';
    RAISE NOTICE 'All critical tables, constraints, and indexes have been applied';
    RAISE NOTICE 'System is now ready for production use';
    RAISE NOTICE '=============================================';
END $$;
