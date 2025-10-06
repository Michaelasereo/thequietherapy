-- PRICING SYSTEM DATABASE SCHEMA
-- Implements "First Hit Free" + Pay-as-you-go with bulk discounts
-- Free sessions: 25 minutes | Paid sessions: 35 minutes

-- =====================================================
-- 1. USER PURCHASES TABLE
-- Tracks all package purchases (including free signup credit)
-- =====================================================
CREATE TABLE user_purchases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    package_type TEXT NOT NULL CHECK (package_type IN ('signup_free', 'single', 'bronze', 'silver', 'gold')),
    sessions_credited INTEGER NOT NULL, -- e.g., 1, 3, 5, 8
    amount_paid INTEGER NOT NULL DEFAULT 0, -- in kobo (₦5000 = 500000, free = 0)
    session_duration_minutes INTEGER NOT NULL DEFAULT 25, -- 25 for free, 35 for paid
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =====================================================
-- 2. USER SESSION CREDITS TABLE (Wallet System)
-- Each credit represents one bookable session
-- =====================================================
CREATE TABLE user_session_credits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    purchase_id UUID REFERENCES user_purchases(id) ON DELETE CASCADE NOT NULL,
    session_id UUID REFERENCES sessions(id) ON DELETE SET NULL, -- NULL = available, NOT NULL = used
    session_duration_minutes INTEGER NOT NULL, -- 25 or 35 minutes
    is_free_credit BOOLEAN NOT NULL DEFAULT false,
    used_at TIMESTAMPTZ, -- NULL means available, timestamp means used
    expires_at TIMESTAMPTZ, -- Optional: credits can expire (e.g., 6 months)
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =====================================================
-- 3. PACKAGE DEFINITIONS TABLE
-- Defines available packages and pricing
-- =====================================================
CREATE TABLE package_definitions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    package_type TEXT NOT NULL UNIQUE CHECK (package_type IN ('signup_free', 'single', 'bronze', 'silver', 'gold')),
    name TEXT NOT NULL,
    description TEXT,
    sessions_included INTEGER NOT NULL,
    price_kobo INTEGER NOT NULL, -- Price in kobo (₦5000 = 500000)
    session_duration_minutes INTEGER NOT NULL,
    savings_kobo INTEGER DEFAULT 0, -- How much user saves vs single sessions
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =====================================================
-- 4. INSERT DEFAULT PACKAGE DEFINITIONS
-- =====================================================
INSERT INTO package_definitions (package_type, name, description, sessions_included, price_kobo, session_duration_minutes, savings_kobo, sort_order) VALUES
('signup_free', 'Welcome Session', 'Your first session is completely free', 1, 0, 25, 0, 1),
('single', 'Pay-As-You-Go', 'Single therapy session', 1, 500000, 35, 0, 2),
('bronze', 'Bronze Pack', 'Perfect for getting started', 3, 1350000, 35, 150000, 3),
('silver', 'Silver Pack', 'Great value for regular therapy', 5, 2000000, 35, 500000, 4),
('gold', 'Gold Pack', 'Best value for committed healing', 8, 2800000, 35, 1200000, 5);

-- =====================================================
-- 5. UPDATE SESSIONS TABLE
-- Add columns to track credit usage and session type
-- =====================================================
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS credit_used_id UUID REFERENCES user_session_credits(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_free_session BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS actual_duration_minutes INTEGER, -- Track actual session length
ADD COLUMN IF NOT EXISTS planned_duration_minutes INTEGER NOT NULL DEFAULT 35; -- 25 for free, 35 for paid

-- =====================================================
-- 6. UPDATE USERS TABLE
-- Track free session usage
-- =====================================================
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS has_used_free_session BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS free_credits_granted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS total_sessions_completed INTEGER NOT NULL DEFAULT 0;

-- =====================================================
-- 7. PARTNER CREDITS TABLE
-- Partners also get free credits for their employees
-- =====================================================
CREATE TABLE partner_credits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    partner_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL, -- Partner company
    employee_email TEXT NOT NULL,
    employee_name TEXT,
    credits_allocated INTEGER NOT NULL DEFAULT 1, -- How many free sessions
    credits_used INTEGER NOT NULL DEFAULT 0,
    allocated_by UUID REFERENCES users(id), -- Which partner admin allocated
    allocated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMPTZ -- Partner credits can have expiration
);

-- =====================================================
-- 8. INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX idx_user_purchases_user_id ON user_purchases(user_id);
CREATE INDEX idx_user_purchases_package_type ON user_purchases(package_type);

CREATE INDEX idx_user_session_credits_user_id ON user_session_credits(user_id);
CREATE INDEX idx_user_session_credits_available ON user_session_credits(user_id) WHERE used_at IS NULL;
CREATE INDEX idx_user_session_credits_purchase ON user_session_credits(purchase_id);

CREATE INDEX idx_sessions_credit_used ON sessions(credit_used_id) WHERE credit_used_id IS NOT NULL;
CREATE INDEX idx_sessions_free ON sessions(user_id, is_free_session);

CREATE INDEX idx_partner_credits_partner ON partner_credits(partner_id);
CREATE INDEX idx_partner_credits_email ON partner_credits(employee_email);

-- =====================================================
-- 9. FUNCTIONS FOR CREDIT MANAGEMENT
-- =====================================================

-- Function to grant free signup credit
CREATE OR REPLACE FUNCTION grant_signup_credit(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    purchase_record UUID;
BEGIN
    -- Check if user already has free credit
    IF EXISTS (
        SELECT 1 FROM user_purchases 
        WHERE user_id = p_user_id AND package_type = 'signup_free'
    ) THEN
        RETURN false; -- Already granted
    END IF;

    -- Create purchase record
    INSERT INTO user_purchases (user_id, package_type, sessions_credited, amount_paid, session_duration_minutes)
    VALUES (p_user_id, 'signup_free', 1, 0, 25)
    RETURNING id INTO purchase_record;

    -- Create the credit
    INSERT INTO user_session_credits (user_id, purchase_id, session_duration_minutes, is_free_credit)
    VALUES (p_user_id, purchase_record, 25, true);

    -- Update user record
    UPDATE users 
    SET free_credits_granted_at = NOW() 
    WHERE id = p_user_id;

    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to get available credits for a user
CREATE OR REPLACE FUNCTION get_available_credits(p_user_id UUID)
RETURNS TABLE (
    credit_id UUID,
    session_duration_minutes INTEGER,
    is_free_credit BOOLEAN,
    expires_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        usc.id,
        usc.session_duration_minutes,
        usc.is_free_credit,
        usc.expires_at
    FROM user_session_credits usc
    WHERE usc.user_id = p_user_id 
    AND usc.used_at IS NULL 
    AND (usc.expires_at IS NULL OR usc.expires_at > NOW())
    ORDER BY usc.is_free_credit DESC, usc.created_at ASC; -- Use free credits first
END;
$$ LANGUAGE plpgsql;

-- Function to use a credit
CREATE OR REPLACE FUNCTION use_credit(p_credit_id UUID, p_session_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE user_session_credits 
    SET 
        session_id = p_session_id,
        used_at = NOW()
    WHERE id = p_credit_id 
    AND used_at IS NULL;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 10. TRIGGER TO AUTO-GRANT FREE CREDIT ON SIGNUP
-- =====================================================
CREATE OR REPLACE FUNCTION auto_grant_signup_credit()
RETURNS TRIGGER AS $$
BEGIN
    -- Grant free credit to new users (not admins/therapists)
    IF NEW.user_type = 'individual' THEN
        PERFORM grant_signup_credit(NEW.id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_grant_signup_credit
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION auto_grant_signup_credit();

-- =====================================================
-- 11. VIEWS FOR EASY QUERYING
-- =====================================================

-- View to see user's credit balance
CREATE VIEW user_credit_balance AS
SELECT 
    u.id as user_id,
    u.email,
    u.full_name,
    COUNT(usc.id) as total_credits,
    COUNT(CASE WHEN usc.is_free_credit THEN 1 END) as free_credits,
    COUNT(CASE WHEN NOT usc.is_free_credit THEN 1 END) as paid_credits,
    MIN(CASE WHEN usc.is_free_credit THEN usc.session_duration_minutes END) as free_duration,
    MIN(CASE WHEN NOT usc.is_free_credit THEN usc.session_duration_minutes END) as paid_duration
FROM users u
LEFT JOIN user_session_credits usc ON u.id = usc.user_id AND usc.used_at IS NULL
WHERE u.user_type = 'individual'
GROUP BY u.id, u.email, u.full_name;

-- View for purchase history
CREATE VIEW user_purchase_history AS
SELECT 
    up.*,
    pd.name as package_name,
    pd.description as package_description,
    COUNT(usc.id) as credits_created,
    COUNT(CASE WHEN usc.used_at IS NOT NULL THEN 1 END) as credits_used
FROM user_purchases up
JOIN package_definitions pd ON up.package_type = pd.package_type
LEFT JOIN user_session_credits usc ON up.id = usc.purchase_id
GROUP BY up.id, pd.name, pd.description
ORDER BY up.created_at DESC;

-- =====================================================
-- 12. SAMPLE QUERIES FOR TESTING
-- =====================================================

-- Check a user's available credits
-- SELECT * FROM get_available_credits('user-uuid-here');

-- See user's credit balance
-- SELECT * FROM user_credit_balance WHERE user_id = 'user-uuid-here';

-- Grant free credit manually (if needed)
-- SELECT grant_signup_credit('user-uuid-here');

-- See all package options
-- SELECT * FROM package_definitions WHERE is_active = true ORDER BY sort_order;

COMMENT ON TABLE user_purchases IS 'Tracks all package purchases including free signup credits';
COMMENT ON TABLE user_session_credits IS 'Individual session credits that act as a wallet system';
COMMENT ON TABLE package_definitions IS 'Defines available packages and their pricing';
COMMENT ON TABLE partner_credits IS 'Manages partner employee allocations';

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
SELECT 'Schema created successfully!' as status;
SELECT COUNT(*) as package_count FROM package_definitions;
SELECT package_type, name, sessions_included, price_kobo/10000.0 as price_naira FROM package_definitions ORDER BY sort_order;
