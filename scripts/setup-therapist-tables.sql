-- =====================================================
-- THERAPIST DATA SCHEMA SETUP
-- Copy and paste this entire file into your Supabase SQL editor
-- 
-- NOTE: This script creates NEW tables for therapist functionality.
-- The following tables already exist and are SKIPPED:
-- - session_notes (from patient tables setup)
-- - therapist_documents (from enrollment setup)
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- THERAPIST EARNINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS therapist_earnings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    therapist_id UUID NOT NULL REFERENCES global_users(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES global_sessions(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    platform_fee_percentage DECIMAL(5,2) DEFAULT 15.00, -- Default 15% platform fee
    platform_fee_amount DECIMAL(10,2) NOT NULL,
    net_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'NGN',
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'paid')),
    payment_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- THERAPIST TRANSACTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS therapist_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    therapist_id UUID NOT NULL REFERENCES global_users(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('session_earnings', 'payout', 'refund', 'adjustment')),
    amount DECIMAL(10,2) NOT NULL,
    description TEXT NOT NULL,
    reference_id UUID, -- Links to session_id, payout_id, etc.
    reference_type VARCHAR(50), -- 'session', 'payout', etc.
    balance_before DECIMAL(10,2) NOT NULL,
    balance_after DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- SESSION NOTES TABLE (ALREADY EXISTS - SKIPPING)
-- =====================================================
-- Note: session_notes table already exists from patient tables setup
-- This table is shared between patient and therapist flows

-- =====================================================
-- SESSION RATINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS session_ratings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES global_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES global_users(id) ON DELETE CASCADE,
    therapist_id UUID NOT NULL REFERENCES global_users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    is_anonymous BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(session_id, user_id) -- One rating per session per user
);

-- =====================================================
-- SESSION ATTACHMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS session_attachments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES global_sessions(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES global_users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- THERAPIST CLIENT RELATIONSHIPS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS therapist_client_relationships (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    therapist_id UUID NOT NULL REFERENCES global_users(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES global_users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated')),
    start_date DATE NOT NULL,
    end_date DATE,
    total_sessions INTEGER DEFAULT 0,
    last_session_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(therapist_id, client_id)
);

-- =====================================================
-- CLIENT NOTES TABLE (PRIVATE THERAPIST NOTES)
-- =====================================================
CREATE TABLE IF NOT EXISTS client_notes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    therapist_id UUID NOT NULL REFERENCES global_users(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES global_users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    note_type VARCHAR(50) DEFAULT 'general' CHECK (note_type IN ('general', 'assessment', 'progress', 'treatment_plan', 'crisis')),
    is_important BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- CLIENT GOALS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS client_goals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    therapist_id UUID NOT NULL REFERENCES global_users(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES global_users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    goal_type VARCHAR(50) DEFAULT 'short_term' CHECK (goal_type IN ('short_term', 'long_term', 'crisis_management')),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'achieved', 'abandoned', 'modified')),
    target_date DATE,
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- THERAPIST VERIFICATION REQUESTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS therapist_verification_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    therapist_id UUID NOT NULL REFERENCES global_users(id) ON DELETE CASCADE,
    request_type VARCHAR(50) NOT NULL CHECK (request_type IN ('initial', 'renewal', 'update')),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected')),
    mdcn_code VARCHAR(100),
    specialization TEXT[],
    languages TEXT[],
    experience_years INTEGER,
    education TEXT,
    license_expiry_date DATE,
    admin_notes TEXT,
    reviewed_by UUID REFERENCES global_users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- THERAPIST DOCUMENTS TABLE (ENHANCED - ALREADY EXISTS)
-- =====================================================
-- Note: therapist_documents table already exists from enrollment setup
-- This table is shared between enrollment and therapist flows
-- The existing table may need to be enhanced with verification fields

-- =====================================================
-- THERAPIST ANALYTICS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS therapist_analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    therapist_id UUID NOT NULL REFERENCES global_users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_sessions INTEGER DEFAULT 0,
    completed_sessions INTEGER DEFAULT 0,
    cancelled_sessions INTEGER DEFAULT 0,
    total_earnings DECIMAL(10,2) DEFAULT 0,
    net_earnings DECIMAL(10,2) DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0,
    total_ratings INTEGER DEFAULT 0,
    new_clients INTEGER DEFAULT 0,
    active_clients INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(therapist_id, date)
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_therapist_earnings_therapist_id ON therapist_earnings(therapist_id);
CREATE INDEX IF NOT EXISTS idx_therapist_earnings_session_id ON therapist_earnings(session_id);
CREATE INDEX IF NOT EXISTS idx_therapist_earnings_status ON therapist_earnings(status);
CREATE INDEX IF NOT EXISTS idx_therapist_transactions_therapist_id ON therapist_transactions(therapist_id);
CREATE INDEX IF NOT EXISTS idx_therapist_transactions_type ON therapist_transactions(transaction_type);
-- Note: session_notes indexes already exist from patient tables setup
CREATE INDEX IF NOT EXISTS idx_session_ratings_session_id ON session_ratings(session_id);
CREATE INDEX IF NOT EXISTS idx_session_ratings_therapist_id ON session_ratings(therapist_id);
CREATE INDEX IF NOT EXISTS idx_session_attachments_session_id ON session_attachments(session_id);
CREATE INDEX IF NOT EXISTS idx_therapist_client_relationships_therapist_id ON therapist_client_relationships(therapist_id);
CREATE INDEX IF NOT EXISTS idx_therapist_client_relationships_client_id ON therapist_client_relationships(client_id);
CREATE INDEX IF NOT EXISTS idx_client_notes_therapist_id ON client_notes(therapist_id);
CREATE INDEX IF NOT EXISTS idx_client_notes_client_id ON client_notes(client_id);
CREATE INDEX IF NOT EXISTS idx_client_goals_therapist_id ON client_goals(therapist_id);
CREATE INDEX IF NOT EXISTS idx_client_goals_client_id ON client_goals(client_id);
CREATE INDEX IF NOT EXISTS idx_therapist_verification_requests_therapist_id ON therapist_verification_requests(therapist_id);
CREATE INDEX IF NOT EXISTS idx_therapist_verification_requests_status ON therapist_verification_requests(status);
-- Note: therapist_documents indexes already exist from enrollment setup
CREATE INDEX IF NOT EXISTS idx_therapist_analytics_therapist_id ON therapist_analytics(therapist_id);
CREATE INDEX IF NOT EXISTS idx_therapist_analytics_date ON therapist_analytics(date);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE therapist_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapist_transactions ENABLE ROW LEVEL SECURITY;
-- Note: session_notes RLS already enabled from patient tables setup
ALTER TABLE session_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapist_client_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapist_verification_requests ENABLE ROW LEVEL SECURITY;
-- Note: therapist_documents RLS already enabled from enrollment setup
ALTER TABLE therapist_analytics ENABLE ROW LEVEL SECURITY;

-- Therapist Earnings Policies
CREATE POLICY "Therapists can view their own earnings" ON therapist_earnings
    FOR SELECT USING (therapist_id = auth.uid());

CREATE POLICY "Admins can view all earnings" ON therapist_earnings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM global_users
            WHERE global_users.user_id = auth.uid()
            AND global_users.user_type = 'admin'
        )
    );

-- Therapist Transactions Policies
CREATE POLICY "Therapists can view their own transactions" ON therapist_transactions
    FOR SELECT USING (therapist_id = auth.uid());

CREATE POLICY "Admins can view all transactions" ON therapist_transactions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM global_users
            WHERE global_users.user_id = auth.uid()
            AND global_users.user_type = 'admin'
        )
    );

-- Session Notes Policies (ALREADY EXIST - SKIPPING)
-- Note: session_notes policies already exist from patient tables setup
-- These policies are shared between patient and therapist flows

-- Session Ratings Policies
CREATE POLICY "Users can create ratings" ON session_ratings
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Therapists can view their ratings" ON session_ratings
    FOR SELECT USING (therapist_id = auth.uid());

CREATE POLICY "Users can view ratings" ON session_ratings
    FOR SELECT USING (true);

-- Session Attachments Policies
CREATE POLICY "Users can upload attachments" ON session_attachments
    FOR INSERT WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Users can view session attachments" ON session_attachments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM global_sessions
            WHERE global_sessions.id = session_attachments.session_id
            AND (global_sessions.user_id = auth.uid() OR global_sessions.therapist_id = auth.uid())
        )
    );

-- Therapist Client Relationships Policies
CREATE POLICY "Therapists can manage their client relationships" ON therapist_client_relationships
    FOR ALL USING (therapist_id = auth.uid());

CREATE POLICY "Users can view their therapist relationships" ON therapist_client_relationships
    FOR SELECT USING (client_id = auth.uid());

-- Client Notes Policies (Private to therapists)
CREATE POLICY "Therapists can manage their client notes" ON client_notes
    FOR ALL USING (therapist_id = auth.uid());

-- Client Goals Policies
CREATE POLICY "Therapists can manage client goals" ON client_goals
    FOR ALL USING (therapist_id = auth.uid());

CREATE POLICY "Users can view their goals" ON client_goals
    FOR SELECT USING (client_id = auth.uid());

-- Therapist Verification Requests Policies
CREATE POLICY "Therapists can manage their verification requests" ON therapist_verification_requests
    FOR ALL USING (therapist_id = auth.uid());

CREATE POLICY "Admins can manage verification requests" ON therapist_verification_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM global_users
            WHERE global_users.user_id = auth.uid()
            AND global_users.user_type = 'admin'
        )
    );

-- Therapist Documents Policies (ALREADY EXIST - SKIPPING)
-- Note: therapist_documents policies already exist from enrollment setup
-- These policies are shared between enrollment and therapist flows

-- Therapist Analytics Policies
CREATE POLICY "Therapists can view their analytics" ON therapist_analytics
    FOR SELECT USING (therapist_id = auth.uid());

CREATE POLICY "Admins can view all analytics" ON therapist_analytics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM global_users
            WHERE global_users.user_id = auth.uid()
            AND global_users.user_type = 'admin'
        )
    );

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to calculate and record therapist earnings for a session
CREATE OR REPLACE FUNCTION calculate_therapist_earnings(
    p_session_id UUID,
    p_platform_fee_percentage DECIMAL DEFAULT 15.00
)
RETURNS therapist_earnings AS $$
DECLARE
    v_session global_sessions;
    v_earnings therapist_earnings;
    v_platform_fee_amount DECIMAL(10,2);
    v_net_amount DECIMAL(10,2);
BEGIN
    -- Get session details
    SELECT * INTO v_session FROM global_sessions WHERE id = p_session_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Session not found';
    END IF;
    
    -- Calculate earnings
    v_platform_fee_amount := (v_session.cost * p_platform_fee_percentage) / 100;
    v_net_amount := v_session.cost - v_platform_fee_amount;
    
    -- Insert earnings record
    INSERT INTO therapist_earnings (
        therapist_id,
        session_id,
        amount,
        platform_fee_percentage,
        platform_fee_amount,
        net_amount
    ) VALUES (
        v_session.therapist_id,
        p_session_id,
        v_session.cost,
        p_platform_fee_percentage,
        v_platform_fee_amount,
        v_net_amount
    ) RETURNING * INTO v_earnings;
    
    -- Add transaction record
    INSERT INTO therapist_transactions (
        therapist_id,
        transaction_type,
        amount,
        description,
        reference_id,
        reference_type,
        balance_before,
        balance_after
    ) VALUES (
        v_session.therapist_id,
        'session_earnings',
        v_net_amount,
        'Earnings from session ' || p_session_id,
        p_session_id,
        'session',
        0, -- Will be calculated based on previous transactions
        0  -- Will be calculated based on previous transactions
    );
    
    RETURN v_earnings;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add session rating
CREATE OR REPLACE FUNCTION add_session_rating(
    p_session_id UUID,
    p_rating INTEGER,
    p_review TEXT DEFAULT NULL,
    p_is_anonymous BOOLEAN DEFAULT false
)
RETURNS session_ratings AS $$
DECLARE
    v_session global_sessions;
    v_rating session_ratings;
BEGIN
    -- Get session details
    SELECT * INTO v_session FROM global_sessions WHERE id = p_session_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Session not found';
    END IF;
    
    -- Check if user is the one who had the session
    IF v_session.user_id != auth.uid() THEN
        RAISE EXCEPTION 'You can only rate sessions you participated in';
    END IF;
    
    -- Insert rating
    INSERT INTO session_ratings (
        session_id,
        user_id,
        therapist_id,
        rating,
        review,
        is_anonymous
    ) VALUES (
        p_session_id,
        auth.uid(),
        v_session.therapist_id,
        p_rating,
        p_review,
        p_is_anonymous
    )
    ON CONFLICT (session_id, user_id) DO UPDATE SET
        rating = EXCLUDED.rating,
        review = EXCLUDED.review,
        is_anonymous = EXCLUDED.is_anonymous,
        updated_at = NOW()
    RETURNING * INTO v_rating;
    
    RETURN v_rating;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get therapist dashboard statistics
CREATE OR REPLACE FUNCTION get_therapist_dashboard_stats(p_therapist_id UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    v_total_earnings DECIMAL(10,2);
    v_total_sessions INTEGER;
    v_total_clients INTEGER;
    v_avg_rating DECIMAL(3,2);
    v_monthly_earnings DECIMAL(10,2);
    v_monthly_sessions INTEGER;
BEGIN
    -- Get total earnings
    SELECT COALESCE(SUM(net_amount), 0) INTO v_total_earnings
    FROM therapist_earnings 
    WHERE therapist_id = p_therapist_id;
    
    -- Get total sessions
    SELECT COUNT(*) INTO v_total_sessions
    FROM global_sessions 
    WHERE therapist_id = p_therapist_id;
    
    -- Get total unique clients
    SELECT COUNT(DISTINCT user_id) INTO v_total_clients
    FROM global_sessions 
    WHERE therapist_id = p_therapist_id;
    
    -- Get average rating
    SELECT COALESCE(AVG(rating), 0) INTO v_avg_rating
    FROM session_ratings 
    WHERE therapist_id = p_therapist_id;
    
    -- Get monthly earnings
    SELECT COALESCE(SUM(net_amount), 0) INTO v_monthly_earnings
    FROM therapist_earnings 
    WHERE therapist_id = p_therapist_id 
    AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW());
    
    -- Get monthly sessions
    SELECT COUNT(*) INTO v_monthly_sessions
    FROM global_sessions 
    WHERE therapist_id = p_therapist_id 
    AND DATE_TRUNC('month', start_time) = DATE_TRUNC('month', NOW());
    
    result := jsonb_build_object(
        'total_earnings', v_total_earnings,
        'total_sessions', v_total_sessions,
        'total_clients', v_total_clients,
        'average_rating', v_avg_rating,
        'monthly_earnings', v_monthly_earnings,
        'monthly_sessions', v_monthly_sessions
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get client profile for therapist
CREATE OR REPLACE FUNCTION get_client_profile_for_therapist(p_client_id UUID, p_therapist_id UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    -- Verify therapist has relationship with client
    IF NOT EXISTS (
        SELECT 1 FROM global_sessions 
        WHERE user_id = p_client_id 
        AND therapist_id = p_therapist_id
    ) THEN
        RAISE EXCEPTION 'No relationship found between therapist and client';
    END IF;
    
    result := jsonb_build_object(
        'client_info', (
            SELECT to_jsonb(gu.*) FROM global_users gu 
            WHERE gu.user_id = p_client_id
        ),
        'patient_data', (
            SELECT get_patient_profile(p_client_id)
        ),
        'sessions', (
            SELECT jsonb_agg(to_jsonb(gs.*)) 
            FROM global_sessions gs 
            WHERE gs.user_id = p_client_id 
            AND gs.therapist_id = p_therapist_id
            ORDER BY gs.start_time DESC
        ),
        'notes', (
            SELECT jsonb_agg(to_jsonb(cn.*)) 
            FROM client_notes cn 
            WHERE cn.client_id = p_client_id 
            AND cn.therapist_id = p_therapist_id
            ORDER BY cn.created_at DESC
        ),
        'goals', (
            SELECT jsonb_agg(to_jsonb(cg.*)) 
            FROM client_goals cg 
            WHERE cg.client_id = p_client_id 
            AND cg.therapist_id = p_therapist_id
            ORDER BY cg.created_at DESC
        )
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_therapist_earnings_updated_at
    BEFORE UPDATE ON therapist_earnings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Note: session_notes trigger already exists from patient tables setup

CREATE TRIGGER update_session_ratings_updated_at
    BEFORE UPDATE ON session_ratings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_therapist_client_relationships_updated_at
    BEFORE UPDATE ON therapist_client_relationships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_notes_updated_at
    BEFORE UPDATE ON client_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_goals_updated_at
    BEFORE UPDATE ON client_goals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_therapist_verification_requests_updated_at
    BEFORE UPDATE ON therapist_verification_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '✅ Therapist data schema setup completed successfully!';
    RAISE NOTICE '📋 Tables created: therapist_earnings, therapist_transactions, session_ratings, session_attachments, therapist_client_relationships, client_notes, client_goals, therapist_verification_requests, therapist_analytics';
    RAISE NOTICE '🔒 RLS policies configured for proper access control';
    RAISE NOTICE '⚙️ Functions created for earnings calculation, ratings, and client management';
    RAISE NOTICE '🔄 Triggers set up for automatic timestamp updates';
    RAISE NOTICE '💰 Manual payout tracking enabled - earnings calculated with platform fee percentage';
END $$;
