-- =============================================
-- EMERGENCY DATABASE FIXES
-- Critical constraints and indexes to prevent system failures
-- =============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- CRITICAL CONSTRAINT: Prevent Double Bookings
-- =============================================
-- This is the most important fix - prevents multiple users from booking same slot
CREATE UNIQUE INDEX IF NOT EXISTS unique_therapist_session_slot 
ON sessions (therapist_id, scheduled_date, scheduled_time) 
WHERE status IN ('scheduled', 'confirmed', 'in_progress');

-- =============================================
-- THERAPIST VERIFICATION AUDIT TRAIL
-- =============================================
-- Add missing audit columns for therapist verification
ALTER TABLE therapist_profiles 
ADD COLUMN IF NOT EXISTS verification_audit_trail JSONB,
ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS verification_documents JSONB;

-- Create verification audit table
CREATE TABLE IF NOT EXISTS therapist_verification_audit (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    therapist_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- 'verified', 'rejected', 'suspended', 'reactivated'
    performed_by UUID NOT NULL REFERENCES users(id),
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reason TEXT,
    documents JSONB,
    metadata JSONB
);

-- Index for audit queries
CREATE INDEX IF NOT EXISTS idx_verification_audit_therapist 
ON therapist_verification_audit(therapist_id, performed_at DESC);

-- =============================================
-- FINANCIAL AUDIT SYSTEM
-- =============================================
-- Create comprehensive earnings transaction table
CREATE TABLE IF NOT EXISTS earnings_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    therapist_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN (
        'session_completion', 'platform_fee', 'adjustment', 'bonus', 'refund', 'payout'
    )),
    amount_kobo INTEGER NOT NULL, -- Amount in kobo (smallest currency unit)
    currency VARCHAR(3) DEFAULT 'NGN',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed', 'reversed')),
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    calculated_by UUID REFERENCES users(id),
    payout_date TIMESTAMP WITH TIME ZONE,
    audit_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for financial queries
CREATE INDEX IF NOT EXISTS idx_earnings_therapist_date 
ON earnings_transactions(therapist_id, calculated_at DESC);
CREATE INDEX IF NOT EXISTS idx_earnings_session 
ON earnings_transactions(session_id);
CREATE INDEX IF NOT EXISTS idx_earnings_status 
ON earnings_transactions(status, payout_date);

-- =============================================
-- THERAPIST STATE MANAGEMENT
-- =============================================
-- Create therapist state table for proper lifecycle management
CREATE TABLE IF NOT EXISTS therapist_states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    therapist_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    current_status TEXT NOT NULL CHECK (current_status IN (
        'onboarding', 'pending_verification', 'active', 'suspended', 'offboarded'
    )),
    previous_status TEXT,
    status_changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status_changed_by UUID REFERENCES users(id),
    reason TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for state queries
CREATE INDEX IF NOT EXISTS idx_therapist_states_therapist 
ON therapist_states(therapist_id, status_changed_at DESC);

-- =============================================
-- AVAILABILITY SYSTEM CLEANUP
-- =============================================
-- Add missing constraints to availability tables
DO $$
BEGIN
    -- Add time range constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_valid_time_range' 
        AND conrelid = 'therapist_availability'::regclass
    ) THEN
        ALTER TABLE therapist_availability 
        ADD CONSTRAINT check_valid_time_range 
        CHECK (end_time > start_time);
    END IF;
    
    -- Add weekly availability constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_weekly_availability_json' 
        AND conrelid = 'availability_weekly_schedules'::regclass
    ) THEN
        ALTER TABLE availability_weekly_schedules 
        ADD CONSTRAINT check_weekly_availability_json 
        CHECK (weekly_availability IS NOT NULL);
    END IF;
END $$;

-- =============================================
-- SESSION MANAGEMENT IMPROVEMENTS
-- =============================================
-- Add missing foreign key constraints
DO $$
BEGIN
    -- Add user foreign key constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_sessions_user' 
        AND conrelid = 'sessions'::regclass
    ) THEN
        ALTER TABLE sessions 
        ADD CONSTRAINT fk_sessions_user 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add therapist foreign key constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_sessions_therapist' 
        AND conrelid = 'sessions'::regclass
    ) THEN
        ALTER TABLE sessions 
        ADD CONSTRAINT fk_sessions_therapist 
        FOREIGN KEY (therapist_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add session audit table
CREATE TABLE IF NOT EXISTS session_audit (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- 'created', 'confirmed', 'started', 'completed', 'cancelled'
    performed_by UUID REFERENCES users(id),
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    old_status TEXT,
    new_status TEXT,
    metadata JSONB
);

-- Index for session audit
CREATE INDEX IF NOT EXISTS idx_session_audit_session 
ON session_audit(session_id, performed_at DESC);

-- =============================================
-- PAYMENT SYSTEM IMPROVEMENTS
-- =============================================
-- Note: Table creation and constraints are handled in the TABLE STRUCTURE VERIFICATION section below

-- Add payment audit table
CREATE TABLE IF NOT EXISTS payment_audit (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_reference TEXT NOT NULL,
    action TEXT NOT NULL, -- 'initiated', 'webhook_received', 'verified', 'failed'
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    paystack_data JSONB,
    user_id UUID REFERENCES users(id),
    amount_kobo INTEGER,
    metadata JSONB
);

-- Index for payment audit
CREATE INDEX IF NOT EXISTS idx_payment_audit_reference 
ON payment_audit(payment_reference, performed_at DESC);

-- =============================================
-- PERFORMANCE INDEXES
-- =============================================
-- Critical indexes for query performance
CREATE INDEX IF NOT EXISTS idx_sessions_therapist_date 
ON sessions(therapist_id, scheduled_date DESC);

CREATE INDEX IF NOT EXISTS idx_sessions_user_date 
ON sessions(user_id, scheduled_date DESC);

CREATE INDEX IF NOT EXISTS idx_sessions_status_date 
ON sessions(status, scheduled_date DESC);

CREATE INDEX IF NOT EXISTS idx_users_type_active 
ON users(user_type, is_active, is_verified);

CREATE INDEX IF NOT EXISTS idx_therapist_profiles_verification 
ON therapist_profiles(verification_status, is_active);

-- =============================================
-- DATA VALIDATION FUNCTIONS
-- =============================================
-- Function to validate therapist can be booked
CREATE OR REPLACE FUNCTION can_therapist_be_booked(therapist_uuid UUID)
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
        AND ts.current_status = 'active'
        AND ts.status_changed_at = (
            SELECT MAX(status_changed_at) 
            FROM therapist_states ts2 
            WHERE ts2.therapist_id = u.id
        )
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get therapist current status
CREATE OR REPLACE FUNCTION get_therapist_status(therapist_uuid UUID)
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT current_status
        FROM therapist_states
        WHERE therapist_id = therapist_uuid
        ORDER BY status_changed_at DESC
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TABLE STRUCTURE VERIFICATION & FIXES
-- =============================================
-- Ensure all required tables have proper structure

DO $$
BEGIN
    -- Check and create pending_payments table if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'pending_payments'
    ) THEN
        CREATE TABLE pending_payments (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
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
        
        CREATE INDEX idx_pending_payments_user ON pending_payments(user_id);
        CREATE INDEX idx_pending_payments_reference ON pending_payments(payment_reference);
        CREATE INDEX idx_pending_payments_status ON pending_payments(status);
    END IF;
    
    -- Check and create package_definitions table if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'package_definitions'
    ) THEN
        CREATE TABLE package_definitions (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            package_type TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL,
            description TEXT,
            sessions_included INTEGER NOT NULL DEFAULT 1,
            price_kobo INTEGER NOT NULL DEFAULT 0,
            session_duration_minutes INTEGER NOT NULL DEFAULT 60,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
            updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
        );
    END IF;
    
    -- Check and create payments table if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'payments'
    ) THEN
        CREATE TABLE payments (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
            package_type TEXT NOT NULL,
            amount_kobo INTEGER NOT NULL,
            payment_reference TEXT NOT NULL UNIQUE,
            paystack_reference TEXT,
            status TEXT NOT NULL CHECK (status IN ('pending', 'success', 'failed', 'refunded')),
            payment_method TEXT,
            gateway_response JSONB,
            created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
        );
    END IF;
    
    -- Check and create user_credits table if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'user_credits'
    ) THEN
        CREATE TABLE user_credits (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
            user_type TEXT NOT NULL DEFAULT 'user',
            package_type TEXT,
            credits_balance INTEGER NOT NULL DEFAULT 0,
            credits_purchased INTEGER NOT NULL DEFAULT 0,
            credits_used INTEGER NOT NULL DEFAULT 0,
            credits_expired INTEGER NOT NULL DEFAULT 0,
            amount_paid_kobo INTEGER,
            payment_reference TEXT,
            status TEXT DEFAULT 'active',
            expires_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
            updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
        );
    END IF;
    
    -- Check and create availability_weekly_schedules table if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'availability_weekly_schedules'
    ) THEN
        CREATE TABLE availability_weekly_schedules (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            therapist_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
            template_name TEXT NOT NULL DEFAULT 'primary',
            weekly_availability JSONB NOT NULL,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
            updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
            UNIQUE(therapist_id, template_name)
        );
    END IF;
    
    -- Check and create availability_overrides table if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'availability_overrides'
    ) THEN
        CREATE TABLE availability_overrides (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            therapist_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
            override_date DATE NOT NULL,
            override_type TEXT NOT NULL CHECK (override_type IN ('unavailable', 'custom_hours')),
            start_time TIME,
            end_time TIME,
            reason TEXT,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
            updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
        );
    END IF;
END $$;

-- =============================================
-- ADD MISSING COLUMNS TO EXISTING TABLES
-- =============================================
-- Handle existing tables that might be missing columns

DO $$
BEGIN
    -- Add missing columns to existing users table
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'users'
    ) THEN
        -- Add is_active column if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' 
            AND column_name = 'is_active'
        ) THEN
            ALTER TABLE users 
            ADD COLUMN is_active BOOLEAN DEFAULT true;
        END IF;
        
        -- Add is_verified column if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' 
            AND column_name = 'is_verified'
        ) THEN
            ALTER TABLE users 
            ADD COLUMN is_verified BOOLEAN DEFAULT false;
        END IF;
    END IF;
    
    -- Add missing columns to existing pending_payments table
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'pending_payments'
    ) THEN
        -- Add is_active column if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'pending_payments' 
            AND column_name = 'is_active'
        ) THEN
            ALTER TABLE pending_payments 
            ADD COLUMN is_active BOOLEAN DEFAULT true;
        END IF;
        
        -- Add updated_at column if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'pending_payments' 
            AND column_name = 'updated_at'
        ) THEN
            ALTER TABLE pending_payments 
            ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
        END IF;
        
        -- Add constraints if they don't exist
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'check_valid_amount' 
            AND conrelid = 'pending_payments'::regclass
        ) THEN
            ALTER TABLE pending_payments 
            ADD CONSTRAINT check_valid_amount 
            CHECK (amount_kobo > 0);
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'check_valid_status' 
            AND conrelid = 'pending_payments'::regclass
        ) THEN
            ALTER TABLE pending_payments 
            ADD CONSTRAINT check_valid_status 
            CHECK (status IN ('pending', 'success', 'failed', 'cancelled'));
        END IF;
    END IF;
    
    -- Add missing columns to existing therapist_profiles table
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'therapist_profiles'
    ) THEN
        -- Add is_active column if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'therapist_profiles' 
            AND column_name = 'is_active'
        ) THEN
            ALTER TABLE therapist_profiles 
            ADD COLUMN is_active BOOLEAN DEFAULT true;
        END IF;
        
        -- Add verification_status column if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'therapist_profiles' 
            AND column_name = 'verification_status'
        ) THEN
            ALTER TABLE therapist_profiles 
            ADD COLUMN verification_status TEXT DEFAULT 'pending';
        END IF;
    END IF;
    
    -- Add missing columns to existing user_credits table
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'user_credits'
    ) THEN
        -- Add updated_at column if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'user_credits' 
            AND column_name = 'updated_at'
        ) THEN
            ALTER TABLE user_credits 
            ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
        END IF;
    END IF;
END $$;

-- =============================================
-- EMERGENCY DATA CLEANUP
-- =============================================
-- Clean up orphaned records
DELETE FROM therapist_availability 
WHERE therapist_id NOT IN (SELECT id FROM users WHERE user_type = 'therapist');

DELETE FROM sessions 
WHERE therapist_id NOT IN (SELECT id FROM users WHERE user_type = 'therapist')
OR user_id NOT IN (SELECT id FROM users WHERE user_type = 'individual');

-- Update therapist profiles to have proper verification status
UPDATE therapist_profiles 
SET verification_status = 'pending'
WHERE verification_status IS NULL OR verification_status = '';

-- =============================================
-- GRANT PERMISSIONS
-- =============================================
-- Ensure proper permissions for application user
GRANT SELECT, INSERT, UPDATE ON therapist_verification_audit TO your_app_user;
GRANT SELECT, INSERT, UPDATE ON earnings_transactions TO your_app_user;
GRANT SELECT, INSERT, UPDATE ON therapist_states TO your_app_user;
GRANT SELECT, INSERT, UPDATE ON session_audit TO your_app_user;
GRANT SELECT, INSERT, UPDATE ON payment_audit TO your_app_user;

-- Grant function execution permissions
GRANT EXECUTE ON FUNCTION can_therapist_be_booked(UUID) TO your_app_user;
GRANT EXECUTE ON FUNCTION get_therapist_status(UUID) TO your_app_user;

-- =============================================
-- VERIFICATION
-- =============================================
-- Verify critical constraints are in place
SELECT 
    'Double booking prevention' as constraint_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'unique_therapist_session_slot'
    ) THEN 'EXISTS' ELSE 'MISSING' END as status;

SELECT 
    'Verification audit table' as table_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'therapist_verification_audit'
    ) THEN 'EXISTS' ELSE 'MISSING' END as status;

SELECT 
    'Earnings transactions table' as table_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'earnings_transactions'
    ) THEN 'EXISTS' ELSE 'MISSING' END as status;

-- =============================================
-- COMPLETION MESSAGE
-- =============================================
DO $$
BEGIN
    RAISE NOTICE 'Emergency database fixes completed successfully!';
    RAISE NOTICE 'Critical constraints added to prevent double bookings and ensure data integrity.';
    RAISE NOTICE 'Audit trails implemented for therapist verification and financial transactions.';
    RAISE NOTICE 'Next step: Run the therapist state machine implementation.';
END $$;
