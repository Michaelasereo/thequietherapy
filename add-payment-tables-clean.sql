-- ADD PAYMENT TRACKING TABLES (CLEAN VERSION)
-- Run this after the main pricing system schema

-- =====================================================
-- PENDING PAYMENTS TABLE
-- Tracks payment attempts and their status
-- =====================================================
CREATE TABLE IF NOT EXISTS pending_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    package_type TEXT NOT NULL,
    amount_kobo INTEGER NOT NULL,
    payment_reference TEXT NOT NULL UNIQUE,
    paystack_reference TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'cancelled')),
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for pending payments
CREATE INDEX IF NOT EXISTS idx_pending_payments_user ON pending_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_pending_payments_reference ON pending_payments(payment_reference);
CREATE INDEX IF NOT EXISTS idx_pending_payments_paystack_ref ON pending_payments(paystack_reference);
CREATE INDEX IF NOT EXISTS idx_pending_payments_status ON pending_payments(status);

-- =====================================================
-- UPDATE USER_PURCHASE_HISTORY VIEW (SAFE RECREATION)
-- =====================================================
DROP VIEW IF EXISTS user_purchase_history;
CREATE VIEW user_purchase_history AS
SELECT 
    up.*,
    pd.name as package_name,
    pd.description as package_description,
    pp.payment_reference,
    pp.paystack_reference,
    pp.verified_at as payment_verified_at,
    COUNT(usc.id) as credits_created,
    COUNT(CASE WHEN usc.used_at IS NOT NULL THEN 1 END) as credits_used
FROM user_purchases up
JOIN package_definitions pd ON up.package_type = pd.package_type
LEFT JOIN pending_payments pp ON pp.user_id = up.user_id 
    AND pp.package_type = up.package_type 
    AND pp.status = 'success'
    AND pp.verified_at IS NOT NULL
LEFT JOIN user_session_credits usc ON up.id = usc.purchase_id
GROUP BY up.id, pd.name, pd.description, pp.payment_reference, pp.paystack_reference, pp.verified_at
ORDER BY up.created_at DESC;

-- =====================================================
-- FUNCTION TO CLEANUP OLD PENDING PAYMENTS
-- =====================================================
CREATE OR REPLACE FUNCTION cleanup_old_pending_payments()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM pending_payments 
    WHERE status IN ('failed', 'cancelled', 'pending')
    AND created_at < NOW() - INTERVAL '24 hours';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION TO GET USER PAYMENT HISTORY
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_payment_history(p_user_id UUID, p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
    purchase_id UUID,
    package_type TEXT,
    package_name TEXT,
    amount_paid INTEGER,
    sessions_credited INTEGER,
    credits_used INTEGER,
    payment_reference TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        uph.id,
        uph.package_type,
        uph.package_name,
        uph.amount_paid,
        uph.sessions_credited,
        uph.credits_used,
        uph.payment_reference,
        uph.created_at
    FROM user_purchase_history uph
    WHERE uph.user_id = p_user_id
    ORDER BY uph.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PARTNER EMPLOYEE CREDITS SYSTEM
-- =====================================================

-- Update partner_credits table structure (safe column additions)
ALTER TABLE partner_credits 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired', 'revoked')),
ADD COLUMN IF NOT EXISTS session_duration_minutes INTEGER NOT NULL DEFAULT 25,
ADD COLUMN IF NOT EXISTS used_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES sessions(id) ON DELETE SET NULL;

-- Function to allocate partner credits to employee
CREATE OR REPLACE FUNCTION allocate_partner_credit(
    p_partner_id UUID,
    p_employee_email TEXT,
    p_employee_name TEXT DEFAULT NULL,
    p_credits_count INTEGER DEFAULT 1,
    p_expires_days INTEGER DEFAULT 90
)
RETURNS BOOLEAN AS $$
DECLARE
    credit_record UUID;
    i INTEGER;
BEGIN
    -- Verify partner exists and is active
    IF NOT EXISTS (
        SELECT 1 FROM users 
        WHERE id = p_partner_id 
        AND user_type = 'partner' 
        AND is_active = true
    ) THEN
        RETURN false;
    END IF;

    -- Create credit allocations
    FOR i IN 1..p_credits_count LOOP
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
        ) VALUES (
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
        );
    END LOOP;

    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to use partner credit
CREATE OR REPLACE FUNCTION use_partner_credit(
    p_employee_email TEXT,
    p_session_id UUID
)
RETURNS UUID AS $$
DECLARE
    credit_id UUID;
BEGIN
    -- Find an available partner credit
    SELECT id INTO credit_id
    FROM partner_credits
    WHERE employee_email = p_employee_email
    AND status = 'active'
    AND (expires_at IS NULL OR expires_at > NOW())
    ORDER BY allocated_at ASC
    LIMIT 1;

    IF credit_id IS NULL THEN
        RETURN NULL;
    END IF;

    -- Mark credit as used
    UPDATE partner_credits
    SET 
        status = 'used',
        used_at = NOW(),
        session_id = p_session_id,
        credits_used = 1
    WHERE id = credit_id;

    RETURN credit_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Verify tables exist
SELECT 
    'Tables verified!' as status,
    COUNT(*) as table_count
FROM pg_tables 
WHERE tablename IN (
    'user_purchases',
    'user_session_credits', 
    'package_definitions',
    'partner_credits',
    'pending_payments'
);

-- Check package definitions
SELECT 
    'Package definitions verified!' as status,
    COUNT(*) as package_count
FROM package_definitions 
WHERE is_active = true;

-- Check functions exist
SELECT 
    'Functions verified!' as status,
    COUNT(*) as function_count
FROM pg_proc 
WHERE proname IN (
    'grant_signup_credit',
    'get_available_credits',
    'use_credit',
    'allocate_partner_credit',
    'use_partner_credit',
    'cleanup_old_pending_payments'
);

COMMENT ON TABLE pending_payments IS 'Tracks payment attempts through Paystack';

SELECT 'Payment system tables added successfully!' as final_status;
