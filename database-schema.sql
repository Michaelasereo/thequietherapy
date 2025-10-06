-- TRPI Therapy Platform - Complete Database Schema
-- Optimized for scalability, performance, and maintainability

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- USERS TABLE (Core user management
-- =============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    user_type VARCHAR(50) NOT NULL CHECK (user_type IN ('individual', 'therapist', 'admin', 'partner')),
    phone VARCHAR(50),
    country VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    email_verified_at TIMESTAMP WITH TIME ZONE,
    credits INTEGER DEFAULT 0,
    package_type VARCHAR(50) DEFAULT 'free' CHECK (package_type IN ('free', 'basic', 'premium', 'enterprise')),
    session_token VARCHAR(255),
    session_expires_at TIMESTAMP WITH TIME ZONE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- THERAPIST PROFILES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS therapist_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    specializations TEXT[], -- Array of specializations
    bio TEXT,
    session_rate DECIMAL(10,2) DEFAULT 0.00, -- Rate per session in local currency
    languages TEXT[], -- Array of languages spoken
    qualifications TEXT[], -- Array of qualifications/certifications
    experience_years INTEGER DEFAULT 0,
    profile_image_url VARCHAR(500),
    verification_status VARCHAR(50) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    availability_status VARCHAR(50) DEFAULT 'available' CHECK (availability_status IN ('available', 'busy', 'offline')),
    total_sessions INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- =============================================
-- THERAPIST AVAILABILITY TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS therapist_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    therapist_id UUID REFERENCES users(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 1=Monday, etc.
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT true,
    timezone VARCHAR(50) DEFAULT 'UTC',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- SESSIONS TABLE (Core session management)
-- =============================================
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    therapist_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    duration INTEGER DEFAULT 60, -- Duration in minutes
    session_type VARCHAR(50) DEFAULT 'video' CHECK (session_type IN ('video', 'audio', 'chat', 'in_person')),
    status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
    notes TEXT,
    session_url VARCHAR(500), -- Daily.co room URL
    room_name VARCHAR(255), -- Daily.co room name
        -- Recording removed for HIPAA compliance
    price DECIMAL(10,2), -- Session price
    currency VARCHAR(3) DEFAULT 'NGN',
    payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed')),
    cancellation_reason TEXT,
    cancelled_by UUID REFERENCES users(id),
    cancelled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- SESSION NOTES TABLE (Post-session documentation)
-- =============================================
CREATE TABLE IF NOT EXISTS session_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    therapist_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notes TEXT NOT NULL,
    mood_before VARCHAR(50),
    mood_after VARCHAR(50),
    key_insights TEXT[],
    action_items TEXT[],
    next_session_goals TEXT[],
    is_private BOOLEAN DEFAULT false, -- If true, only therapist can see
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- PATIENT BIODATA TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS patient_biodata (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    age INTEGER,
    gender VARCHAR(50),
    marital_status VARCHAR(50),
    occupation VARCHAR(255),
    education_level VARCHAR(100),
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(50),
    emergency_contact_relationship VARCHAR(100),
    medical_conditions TEXT[],
    current_medications TEXT[],
    allergies TEXT[],
    previous_therapy_experience BOOLEAN DEFAULT false,
    therapy_goals TEXT[],
    preferred_therapist_gender VARCHAR(50),
    preferred_communication_style VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- =============================================
-- NOTIFICATIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('session_reminder', 'session_cancelled', 'payment_due', 'system', 'promotion')),
    is_read BOOLEAN DEFAULT false,
    action_url VARCHAR(500),
    scheduled_for TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- PAYMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'NGN',
    payment_method VARCHAR(50) NOT NULL,
    payment_provider VARCHAR(50) NOT NULL, -- 'paystack', 'stripe', etc.
    provider_transaction_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
    metadata JSONB, -- Store provider-specific data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- REVIEWS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    therapist_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    is_anonymous BOOLEAN DEFAULT false,
    is_approved BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(session_id, user_id)
);

-- =============================================
-- PERFORMANCE INDEXES
-- =============================================

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_session_token ON users(session_token);

-- Therapist profiles indexes
CREATE INDEX IF NOT EXISTS idx_therapist_profiles_user_id ON therapist_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_therapist_profiles_verification_status ON therapist_profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_therapist_profiles_availability_status ON therapist_profiles(availability_status);
CREATE INDEX IF NOT EXISTS idx_therapist_profiles_specializations ON therapist_profiles USING GIN(specializations);

-- Therapist availability indexes
CREATE INDEX IF NOT EXISTS idx_therapist_availability_therapist_id ON therapist_availability(therapist_id);
CREATE INDEX IF NOT EXISTS idx_therapist_availability_day_time ON therapist_availability(day_of_week, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_therapist_availability_is_available ON therapist_availability(is_available);

-- Sessions table indexes (critical for performance)
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_therapist_id ON sessions(therapist_id);
CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_user_therapist ON sessions(user_id, therapist_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date_status ON sessions(DATE(start_time), status);
CREATE INDEX IF NOT EXISTS idx_sessions_upcoming ON sessions(start_time, status) WHERE status IN ('scheduled', 'confirmed');

-- Session notes indexes
CREATE INDEX IF NOT EXISTS idx_session_notes_session_id ON session_notes(session_id);
CREATE INDEX IF NOT EXISTS idx_session_notes_therapist_id ON session_notes(therapist_id);
CREATE INDEX IF NOT EXISTS idx_session_notes_user_id ON session_notes(user_id);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled_for ON notifications(scheduled_for);

-- Payments indexes
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_session_id ON payments(session_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_provider_transaction_id ON payments(provider_transaction_id);

-- Reviews indexes
CREATE INDEX IF NOT EXISTS idx_reviews_therapist_id ON reviews(therapist_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_session_id ON reviews(session_id);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapist_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapist_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_biodata ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Therapist profiles policies
CREATE POLICY "Anyone can view verified therapist profiles" ON therapist_profiles
    FOR SELECT USING (verification_status = 'verified');

CREATE POLICY "Therapists can manage their own profile" ON therapist_profiles
    FOR ALL USING (auth.uid() = user_id);

-- Sessions policies
CREATE POLICY "Users can view their own sessions" ON sessions
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() = therapist_id);

CREATE POLICY "Users can create sessions for themselves" ON sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Participants can update session status" ON sessions
    FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = therapist_id);

-- Session notes policies
CREATE POLICY "Therapists can manage session notes" ON session_notes
    FOR ALL USING (auth.uid() = therapist_id);

CREATE POLICY "Users can view non-private session notes" ON session_notes
    FOR SELECT USING (auth.uid() = user_id AND NOT is_private);

-- Patient biodata policies
CREATE POLICY "Users can manage their own biodata" ON patient_biodata
    FOR ALL USING (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Payments policies
CREATE POLICY "Users can view their own payments" ON payments
    FOR SELECT USING (auth.uid() = user_id);

-- Reviews policies
CREATE POLICY "Users can view approved reviews" ON reviews
    FOR SELECT USING (is_approved = true);

CREATE POLICY "Users can create reviews for their sessions" ON reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_therapist_profiles_updated_at BEFORE UPDATE ON therapist_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_therapist_availability_updated_at BEFORE UPDATE ON therapist_availability
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_session_notes_updated_at BEFORE UPDATE ON session_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patient_biodata_updated_at BEFORE UPDATE ON patient_biodata
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update therapist statistics
CREATE OR REPLACE FUNCTION update_therapist_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- Update total sessions count
        UPDATE therapist_profiles 
        SET total_sessions = (
            SELECT COUNT(*) 
            FROM sessions 
            WHERE therapist_id = NEW.therapist_id 
            AND status = 'completed'
        )
        WHERE user_id = NEW.therapist_id;
        
        -- Update average rating
        UPDATE therapist_profiles 
        SET average_rating = (
            SELECT COALESCE(AVG(rating), 0) 
            FROM reviews 
            WHERE therapist_id = NEW.therapist_id 
            AND is_approved = true
        )
        WHERE user_id = NEW.therapist_id;
        
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update therapist stats when sessions are completed
CREATE TRIGGER update_therapist_stats_on_session_complete
    AFTER INSERT OR UPDATE ON sessions
    FOR EACH ROW
    WHEN (NEW.status = 'completed')
    EXECUTE FUNCTION update_therapist_stats();

-- Trigger to update therapist stats when reviews are added
CREATE TRIGGER update_therapist_stats_on_review
    AFTER INSERT OR UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_therapist_stats();

-- =============================================
-- SAMPLE DATA (for development/testing)
-- =============================================

-- Insert sample therapists (only for development)
INSERT INTO users (id, email, full_name, user_type, is_verified, is_active) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'dr.emily@trpi.com', 'Dr. Emily White', 'therapist', true, true),
    ('550e8400-e29b-41d4-a716-446655440002', 'john.davis@trpi.com', 'John Davis', 'therapist', true, true),
    ('550e8400-e29b-41d4-a716-446655440003', 'dr.sarah@trpi.com', 'Dr. Sarah Johnson', 'therapist', true, true)
ON CONFLICT (id) DO NOTHING;

-- Insert therapist profiles
INSERT INTO therapist_profiles (user_id, specializations, bio, session_rate, verification_status) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', ARRAY['Cognitive Behavioral Therapy', 'Anxiety Disorders'], 'Experienced therapist specializing in anxiety and depression treatment.', 12000.00, 'verified'),
    ('550e8400-e29b-41d4-a716-446655440002', ARRAY['Trauma Therapy', 'PTSD'], 'Specialist in trauma processing and PTSD treatment.', 15000.00, 'verified'),
    ('550e8400-e29b-41d4-a716-446655440003', ARRAY['Family Therapy', 'Relationship Counseling'], 'Expert in family dynamics and relationship counseling.', 13000.00, 'verified')
ON CONFLICT (user_id) DO NOTHING;

-- Insert sample availability
INSERT INTO therapist_availability (therapist_id, day_of_week, start_time, end_time) VALUES
    -- Dr. Emily White (Monday-Friday, 9 AM - 5 PM)
    ('550e8400-e29b-41d4-a716-446655440001', 1, '09:00:00', '17:00:00'),
    ('550e8400-e29b-41d4-a716-446655440001', 2, '09:00:00', '17:00:00'),
    ('550e8400-e29b-41d4-a716-446655440001', 3, '09:00:00', '17:00:00'),
    ('550e8400-e29b-41d4-a716-446655440001', 4, '09:00:00', '17:00:00'),
    ('550e8400-e29b-41d4-a716-446655440001', 5, '09:00:00', '17:00:00'),
    -- John Davis (Monday-Friday, 10 AM - 6 PM)
    ('550e8400-e29b-41d4-a716-446655440002', 1, '10:00:00', '18:00:00'),
    ('550e8400-e29b-41d4-a716-446655440002', 2, '10:00:00', '18:00:00'),
    ('550e8400-e29b-41d4-a716-446655440002', 3, '10:00:00', '18:00:00'),
    ('550e8400-e29b-41d4-a716-446655440002', 4, '10:00:00', '18:00:00'),
    ('550e8400-e29b-41d4-a716-446655440002', 5, '10:00:00', '18:00:00'),
    -- Dr. Sarah Johnson (Monday-Friday, 8 AM - 4 PM)
    ('550e8400-e29b-41d4-a716-446655440003', 1, '08:00:00', '16:00:00'),
    ('550e8400-e29b-41d4-a716-446655440003', 2, '08:00:00', '16:00:00'),
    ('550e8400-e29b-41d4-a716-446655440003', 3, '08:00:00', '16:00:00'),
    ('550e8400-e29b-41d4-a716-446655440003', 4, '08:00:00', '16:00:00'),
    ('550e8400-e29b-41d4-a716-446655440003', 5, '08:00:00', '16:00:00')
ON CONFLICT DO NOTHING;

-- =============================================
-- PERFORMANCE OPTIMIZATION VIEWS
-- =============================================

-- View for therapist dashboard data
CREATE OR REPLACE VIEW therapist_dashboard_view AS
SELECT 
    u.id,
    u.full_name,
    u.email,
    tp.specializations,
    tp.session_rate,
    tp.average_rating,
    tp.total_sessions,
    tp.verification_status,
    tp.availability_status,
    COUNT(CASE WHEN s.start_time::date = CURRENT_DATE AND s.status IN ('scheduled', 'confirmed') THEN 1 END) as today_sessions,
    COUNT(CASE WHEN s.start_time >= CURRENT_DATE AND s.start_time < CURRENT_DATE + INTERVAL '7 days' AND s.status IN ('scheduled', 'confirmed') THEN 1 END) as week_sessions
FROM users u
JOIN therapist_profiles tp ON u.id = tp.user_id
LEFT JOIN sessions s ON u.id = s.therapist_id
WHERE u.user_type = 'therapist' AND u.is_active = true
GROUP BY u.id, u.full_name, u.email, tp.specializations, tp.session_rate, tp.average_rating, tp.total_sessions, tp.verification_status, tp.availability_status;

-- View for user dashboard data
CREATE OR REPLACE VIEW user_dashboard_view AS
SELECT 
    u.id,
    u.full_name,
    u.email,
    u.credits,
    u.package_type,
    COUNT(CASE WHEN s.status = 'completed' THEN 1 END) as total_sessions,
    COUNT(CASE WHEN s.start_time >= CURRENT_DATE AND s.status IN ('scheduled', 'confirmed') THEN 1 END) as upcoming_sessions,
    MAX(s.start_time) as last_session_date
FROM users u
LEFT JOIN sessions s ON u.id = s.user_id
WHERE u.user_type = 'individual' AND u.is_active = true
GROUP BY u.id, u.full_name, u.email, u.credits, u.package_type;

-- =============================================
-- ANALYTICS VIEWS (for reporting and insights)
-- =============================================

-- Daily session statistics
CREATE OR REPLACE VIEW daily_session_stats AS
SELECT 
    DATE(start_time) as session_date,
    COUNT(*) as total_sessions,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_sessions,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_sessions,
    COUNT(CASE WHEN status = 'no_show' THEN 1 END) as no_show_sessions,
    AVG(duration) as avg_duration
FROM sessions
WHERE start_time >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(start_time)
ORDER BY session_date DESC;

-- Therapist performance view
CREATE OR REPLACE VIEW therapist_performance AS
SELECT 
    u.id as therapist_id,
    u.full_name as therapist_name,
    tp.specializations,
    COUNT(s.id) as total_sessions,
    COUNT(CASE WHEN s.status = 'completed' THEN 1 END) as completed_sessions,
    COUNT(CASE WHEN s.status = 'cancelled' THEN 1 END) as cancelled_sessions,
    ROUND(AVG(r.rating), 2) as avg_rating,
    COUNT(r.id) as total_reviews,
    SUM(s.price) as total_revenue
FROM users u
JOIN therapist_profiles tp ON u.id = tp.user_id
LEFT JOIN sessions s ON u.id = s.therapist_id
LEFT JOIN reviews r ON s.id = r.session_id
WHERE u.user_type = 'therapist'
GROUP BY u.id, u.full_name, tp.specializations
ORDER BY completed_sessions DESC;

-- Comments for documentation
COMMENT ON TABLE users IS 'Core user management table for all user types';
COMMENT ON TABLE therapist_profiles IS 'Extended profile information for therapists';
COMMENT ON TABLE therapist_availability IS 'Weekly availability schedule for therapists';
COMMENT ON TABLE sessions IS 'Therapy sessions between users and therapists';
COMMENT ON TABLE session_notes IS 'Post-session notes and documentation';
COMMENT ON TABLE patient_biodata IS 'Patient medical and personal information';
COMMENT ON TABLE notifications IS 'System notifications and reminders';
COMMENT ON TABLE payments IS 'Payment transactions and billing';
COMMENT ON TABLE reviews IS 'Session reviews and ratings';

-- Vacuum and analyze for optimal performance
VACUUM ANALYZE;
