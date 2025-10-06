-- Performance Optimization: Add Missing Database Indexes
-- These indexes will significantly improve query performance as the platform scales

-- =============================================
-- SESSIONS TABLE INDEXES
-- =============================================

-- Index for therapist dashboard queries (therapist_id + status + start_time)
CREATE INDEX IF NOT EXISTS idx_sessions_therapist_status_time 
ON sessions (therapist_id, status, start_time DESC);

-- Index for user dashboard queries (user_id + status + start_time)
CREATE INDEX IF NOT EXISTS idx_sessions_user_status_time 
ON sessions (user_id, status, start_time DESC);

-- Index for availability checking (therapist_id + start_time range queries)
CREATE INDEX IF NOT EXISTS idx_sessions_therapist_time_range 
ON sessions (therapist_id, start_time, end_time) 
WHERE status IN ('scheduled', 'confirmed', 'in_progress');

-- Index for user session history queries
CREATE INDEX IF NOT EXISTS idx_sessions_user_created_at 
ON sessions (user_id, created_at DESC);

-- Index for session status filtering
CREATE INDEX IF NOT EXISTS idx_sessions_status 
ON sessions (status);

-- =============================================
-- USER_SESSIONS TABLE INDEXES  
-- =============================================

-- Index for session token lookups (critical for auth performance)
CREATE INDEX IF NOT EXISTS idx_user_sessions_token 
ON user_sessions (session_token) 
WHERE expires_at > NOW();

-- Index for user session cleanup
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_expires 
ON user_sessions (user_id, expires_at);

-- Index for expired session cleanup
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires 
ON user_sessions (expires_at) 
WHERE expires_at < NOW();

-- =============================================
-- THERAPIST_AVAILABILITY TABLE INDEXES
-- =============================================

-- Index for availability queries (therapist_id + day_of_week + time range)
CREATE INDEX IF NOT EXISTS idx_therapist_availability_schedule 
ON therapist_availability (therapist_id, day_of_week, start_time, end_time) 
WHERE is_available = true;

-- Index for day-specific availability queries
CREATE INDEX IF NOT EXISTS idx_therapist_availability_day 
ON therapist_availability (day_of_week, is_available);

-- =============================================
-- THERAPIST_PROFILES TABLE INDEXES
-- =============================================

-- Index for therapist search and filtering
CREATE INDEX IF NOT EXISTS idx_therapist_profiles_verification 
ON therapist_profiles (verification_status, availability_status) 
WHERE verification_status = 'verified';

-- Index for specialization searches (if using text search)
CREATE INDEX IF NOT EXISTS idx_therapist_profiles_specializations 
ON therapist_profiles USING GIN (specializations);

-- =============================================
-- USERS TABLE INDEXES
-- =============================================

-- Index for user type and status filtering
CREATE INDEX IF NOT EXISTS idx_users_type_status 
ON users (user_type, is_active, is_verified);

-- Index for email lookups (already unique, but add covering index)
CREATE INDEX IF NOT EXISTS idx_users_email_type 
ON users (email, user_type);

-- Index for session token expiry cleanup
CREATE INDEX IF NOT EXISTS idx_users_session_expires 
ON users (session_expires_at) 
WHERE session_expires_at IS NOT NULL;

-- =============================================
-- MAGIC_LINKS TABLE INDEXES
-- =============================================

-- Index for magic link token lookups
CREATE INDEX IF NOT EXISTS idx_magic_links_token_auth_type 
ON magic_links (token, auth_type) 
WHERE used_at IS NULL AND expires_at > NOW();

-- Index for cleanup of expired/used magic links
CREATE INDEX IF NOT EXISTS idx_magic_links_expires_used 
ON magic_links (expires_at, used_at);

-- =============================================
-- PAYMENTS TABLE INDEXES (if exists)
-- =============================================

-- Index for user payment history
CREATE INDEX IF NOT EXISTS idx_payments_user_status 
ON payments (user_id, status, created_at DESC) 
WHERE status IN ('completed', 'pending');

-- Index for session payment lookups
CREATE INDEX IF NOT EXISTS idx_payments_session 
ON payments (session_id, status) 
WHERE session_id IS NOT NULL;

-- =============================================
-- SESSION_NOTES TABLE INDEXES (if exists)
-- =============================================

-- Index for therapist session notes queries
CREATE INDEX IF NOT EXISTS idx_session_notes_therapist 
ON session_notes (therapist_id, created_at DESC);

-- Index for user session notes queries  
CREATE INDEX IF NOT EXISTS idx_session_notes_user 
ON session_notes (user_id, created_at DESC);

-- Index for session-specific notes
CREATE INDEX IF NOT EXISTS idx_session_notes_session 
ON session_notes (session_id);

-- =============================================
-- COMPOSITE INDEXES FOR COMPLEX QUERIES
-- =============================================

-- Index for therapist dashboard "today's sessions" query
-- Note: Using expression index for date extraction
CREATE INDEX IF NOT EXISTS idx_sessions_therapist_today 
ON sessions (therapist_id, status, start_time) 
WHERE status IN ('scheduled', 'in_progress');

-- Index for user "upcoming sessions" query
CREATE INDEX IF NOT EXISTS idx_sessions_user_upcoming 
ON sessions (user_id, start_time) 
WHERE status = 'scheduled' AND start_time > NOW();

-- =============================================
-- PARTIAL INDEXES FOR SPECIFIC USE CASES
-- =============================================

-- Index only active therapists for search
CREATE INDEX IF NOT EXISTS idx_users_active_therapists 
ON users (id, full_name, email) 
WHERE user_type = 'therapist' AND is_active = true AND is_verified = true;

-- Index only active individual users
CREATE INDEX IF NOT EXISTS idx_users_active_individuals 
ON users (id, email, full_name) 
WHERE user_type = 'individual' AND is_active = true;

-- =============================================
-- ANALYZE TABLES FOR QUERY PLANNER
-- =============================================

-- Update table statistics for optimal query planning
ANALYZE users;
ANALYZE sessions;
ANALYZE therapist_profiles;
ANALYZE therapist_availability;
ANALYZE user_sessions;
ANALYZE magic_links;

-- Add comments for documentation
COMMENT ON INDEX idx_sessions_therapist_status_time IS 'Optimizes therapist dashboard session queries';
COMMENT ON INDEX idx_sessions_user_status_time IS 'Optimizes user dashboard session queries';
COMMENT ON INDEX idx_user_sessions_token IS 'Critical for authentication performance';
COMMENT ON INDEX idx_therapist_availability_schedule IS 'Optimizes availability checking queries';
COMMENT ON INDEX idx_users_type_status IS 'Optimizes user filtering and search queries';
