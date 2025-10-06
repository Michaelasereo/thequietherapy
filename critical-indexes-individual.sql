-- CRITICAL INDEXES - Run these individually to avoid transaction issues
-- Copy and paste each command separately into your database tool

-- ==============================================
-- STEP 1: Authentication Index (MOST CRITICAL)
-- ==============================================
-- This is the most important index for your security fix
CREATE INDEX CONCURRENTLY idx_user_sessions_token ON user_sessions (session_token) WHERE expires_at > NOW();

-- ==============================================
-- STEP 2: Session Booking Indexes (HIGH PRIORITY)
-- ==============================================
-- For therapist dashboard performance
CREATE INDEX CONCURRENTLY idx_sessions_therapist_status_time ON sessions (therapist_id, status, start_time DESC);

-- For user dashboard performance  
CREATE INDEX CONCURRENTLY idx_sessions_user_status_time ON sessions (user_id, status, start_time DESC);

-- ==============================================
-- STEP 3: Availability Checking (HIGH PRIORITY)
-- ==============================================
-- Prevents double-booking and improves booking speed
CREATE INDEX CONCURRENTLY idx_sessions_therapist_time_range ON sessions (therapist_id, start_time, end_time) WHERE status IN ('scheduled', 'confirmed', 'in_progress');

-- ==============================================
-- STEP 4: User Type Filtering (MEDIUM PRIORITY)
-- ==============================================
-- For user searches and filtering
CREATE INDEX CONCURRENTLY idx_users_type_status ON users (user_type, is_active, is_verified);

-- ==============================================
-- STEP 5: Magic Link Performance (MEDIUM PRIORITY)
-- ==============================================
-- For authentication flow performance
CREATE INDEX CONCURRENTLY idx_magic_links_token_auth_type ON magic_links (token, auth_type) WHERE used_at IS NULL AND expires_at > NOW();

-- ==============================================
-- STEP 6: Therapist Availability (MEDIUM PRIORITY)
-- ==============================================
-- For availability checking performance
CREATE INDEX CONCURRENTLY idx_therapist_availability_schedule ON therapist_availability (therapist_id, day_of_week, start_time, end_time) WHERE is_available = true;

-- ==============================================
-- VERIFICATION QUERY
-- ==============================================
-- Run this after each index to verify it was created
SELECT indexname, indexdef FROM pg_indexes WHERE indexname LIKE 'idx_%' ORDER BY indexname;
