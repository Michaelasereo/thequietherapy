-- Performance Optimization: Add Missing Database Indexes (Production Version)
-- This version handles transaction limitations properly
-- 
-- IMPORTANT: Run these commands individually or use a tool that doesn't wrap in transactions
-- If using psql, run with: psql -d your_database -f add-performance-indexes-production.sql
-- If using a GUI tool, copy and paste each section separately

-- =============================================
-- CRITICAL INDEXES (Run these first - one by one if needed)
-- =============================================

-- Authentication performance (CRITICAL)
-- Run this first as it's essential for app performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_token 
ON user_sessions (session_token) 
WHERE expires_at > NOW();

-- Session booking queries (CRITICAL)
CREATE INDEX IF NOT EXISTS idx_sessions_therapist_status_time 
ON sessions (therapist_id, status, start_time DESC);

CREATE INDEX IF NOT EXISTS idx_sessions_user_status_time 
ON sessions (user_id, status, start_time DESC);

-- =============================================
-- SESSIONS TABLE INDEXES
-- =============================================

-- Availability checking (prevents double-booking)
CREATE INDEX IF NOT EXISTS idx_sessions_therapist_time_range 
ON sessions (therapist_id, start_time, end_time) 
WHERE status IN ('scheduled', 'confirmed', 'in_progress');

-- User session history
CREATE INDEX IF NOT EXISTS idx_sessions_user_created_at 
ON sessions (user_id, created_at DESC);

-- Session status filtering
CREATE INDEX IF NOT EXISTS idx_sessions_status 
ON sessions (status);

-- =============================================
-- USER_SESSIONS TABLE INDEXES  
-- =============================================

-- User session management
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_expires 
ON user_sessions (user_id, expires_at);

-- Cleanup expired sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires 
ON user_sessions (expires_at) 
WHERE expires_at < NOW();

-- =============================================
-- THERAPIST_AVAILABILITY TABLE INDEXES
-- =============================================

-- Availability queries
CREATE INDEX IF NOT EXISTS idx_therapist_availability_schedule 
ON therapist_availability (therapist_id, day_of_week, start_time, end_time) 
WHERE is_available = true;

-- Day-specific availability
CREATE INDEX IF NOT EXISTS idx_therapist_availability_day 
ON therapist_availability (day_of_week, is_available);

-- =============================================
-- THERAPIST_PROFILES TABLE INDEXES
-- =============================================

-- Therapist search and filtering
CREATE INDEX IF NOT EXISTS idx_therapist_profiles_verification 
ON therapist_profiles (verification_status, availability_status) 
WHERE verification_status = 'verified';

-- =============================================
-- USERS TABLE INDEXES
-- =============================================

-- User type and status filtering
CREATE INDEX IF NOT EXISTS idx_users_type_status 
ON users (user_type, is_active, is_verified);

-- Email lookups with type
CREATE INDEX IF NOT EXISTS idx_users_email_type 
ON users (email, user_type);

-- =============================================
-- MAGIC_LINKS TABLE INDEXES
-- =============================================

-- Magic link token lookups
CREATE INDEX IF NOT EXISTS idx_magic_links_token_auth_type 
ON magic_links (token, auth_type) 
WHERE used_at IS NULL AND expires_at > NOW();

-- Cleanup expired/used magic links
CREATE INDEX IF NOT EXISTS idx_magic_links_expires_used 
ON magic_links (expires_at, used_at);

-- =============================================
-- ADDITIONAL PERFORMANCE INDEXES
-- =============================================

-- Active therapists for search
CREATE INDEX IF NOT EXISTS idx_users_active_therapists 
ON users (id, full_name, email) 
WHERE user_type = 'therapist' AND is_active = true AND is_verified = true;

-- Active individual users
CREATE INDEX IF NOT EXISTS idx_users_active_individuals 
ON users (id, email, full_name) 
WHERE user_type = 'individual' AND is_active = true;

-- Upcoming sessions for users
CREATE INDEX IF NOT EXISTS idx_sessions_user_upcoming 
ON sessions (user_id, start_time) 
WHERE status = 'scheduled';

-- Today's sessions for therapists
CREATE INDEX IF NOT EXISTS idx_sessions_therapist_today 
ON sessions (therapist_id, status, start_time);

-- =============================================
-- CONDITIONAL INDEXES (if tables exist)
-- =============================================

-- Session notes (if table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'session_notes') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_session_notes_therapist ON session_notes (therapist_id, created_at DESC)';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_session_notes_user ON session_notes (user_id, created_at DESC)';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_session_notes_session ON session_notes (session_id)';
    END IF;
END $$;

-- Payments (if table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'payments') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_payments_user_status ON payments (user_id, status, created_at DESC) WHERE status IN (''completed'', ''pending'')';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_payments_session ON payments (session_id, status) WHERE session_id IS NOT NULL';
    END IF;
END $$;

-- =============================================
-- UPDATE TABLE STATISTICS
-- =============================================

-- Update statistics for query planner
ANALYZE users;
ANALYZE sessions;
ANALYZE user_sessions;
ANALYZE magic_links;

-- Conditional analyze for optional tables
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'therapist_profiles') THEN
        ANALYZE therapist_profiles;
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'therapist_availability') THEN
        ANALYZE therapist_availability;
    END IF;
END $$;

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Check which indexes were created successfully
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Check index sizes
SELECT 
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes 
WHERE indexname LIKE 'idx_%'
ORDER BY pg_relation_size(indexrelid) DESC;
