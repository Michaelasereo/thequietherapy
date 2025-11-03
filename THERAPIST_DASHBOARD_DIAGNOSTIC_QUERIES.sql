-- ============================================================================
-- THERAPIST DASHBOARD DIAGNOSTIC QUERIES
-- ============================================================================
-- Run these queries immediately to diagnose why therapist-created sessions
-- aren't showing up in the dashboard
-- ============================================================================

-- 1. COMPREHENSIVE SESSION ANALYSIS
-- Shows all sessions for a therapist with detailed information
-- Replace '<YOUR_THERAPIST_ID>' with actual therapist ID from users table
-- ============================================================================
SELECT 
    id,
    user_id,
    therapist_id,
    status,
    start_time,
    end_time,
    duration_minutes,
    created_at,
    updated_at,
    created_by,
    EXTRACT(HOUR FROM start_time) as start_hour,
    EXTRACT(TZ FROM start_time) as timezone,
    CASE 
        WHEN status = 'pending_approval' THEN 'PENDING'
        WHEN status = 'scheduled' THEN 'SCHEDULED'
        WHEN status = 'in_progress' THEN 'IN_PROGRESS'
        WHEN status = 'completed' THEN 'COMPLETED'
        ELSE 'OTHER'
    END as session_type
FROM sessions 
WHERE therapist_id = '<YOUR_THERAPIST_ID>'
ORDER BY created_at DESC
LIMIT 20;

-- ============================================================================
-- 2. SESSION OWNERSHIP VERIFICATION
-- Compares therapist IDs between user-created and therapist-created sessions
-- ============================================================================
SELECT 
    'user_created' as source,
    therapist_id,
    COUNT(*) as session_count,
    array_agg(status) as statuses
FROM sessions 
WHERE (created_by = 'user' OR created_by IS NULL)
  AND therapist_id = '<YOUR_THERAPIST_ID>'
GROUP BY therapist_id

UNION ALL

SELECT 
    'therapist_created' as source,
    therapist_id, 
    COUNT(*) as session_count,
    array_agg(status) as statuses
FROM sessions 
WHERE created_by = 'therapist'
  AND therapist_id = '<YOUR_THERAPIST_ID>'
GROUP BY therapist_id;

-- ============================================================================
-- 3. THERAPIST ID RESOLUTION CHECK
-- Verifies therapist_id consistency across tables
-- Replace '<YOUR_USER_ID>' with actual user ID from auth session
-- ============================================================================
SELECT 
    'users' as table_name,
    id as user_id,
    email,
    full_name,
    user_type,
    NULL::uuid as therapist_profile_id
FROM users 
WHERE id = '<YOUR_USER_ID>'
  AND user_type = 'therapist'

UNION ALL

SELECT 
    'therapists' as table_name,
    user_id,
    NULL as email,
    name as full_name,
    NULL as user_type,
    id as therapist_profile_id
FROM therapists
WHERE user_id = '<YOUR_USER_ID>';

-- ============================================================================
-- 4. SESSION STATUS DISTRIBUTION
-- Shows how many sessions exist in each status for this therapist
-- ============================================================================
SELECT 
    status,
    COUNT(*) as count,
    COUNT(CASE WHEN created_by = 'therapist' THEN 1 END) as therapist_created,
    COUNT(CASE WHEN created_by = 'user' OR created_by IS NULL THEN 1 END) as user_created,
    MIN(created_at) as oldest_session,
    MAX(created_at) as newest_session
FROM sessions 
WHERE therapist_id = '<YOUR_THERAPIST_ID>'
GROUP BY status
ORDER BY count DESC;

-- ============================================================================
-- 5. USER RELATION INTEGRITY CHECK
-- Identifies sessions with missing or invalid user relations
-- ============================================================================
SELECT 
    s.id as session_id,
    s.status,
    s.user_id as session_user_id,
    s.therapist_id,
    s.created_by,
    s.created_at,
    u.id as actual_user_id,
    u.full_name,
    CASE 
        WHEN u.id IS NULL THEN 'MISSING USER'
        WHEN u.id != s.user_id THEN 'USER ID MISMATCH'
        ELSE 'VALID'
    END as relation_status
FROM sessions s
LEFT JOIN users u ON u.id = s.user_id
WHERE s.therapist_id = '<YOUR_THERAPIST_ID>'
ORDER BY s.created_at DESC
LIMIT 20;

-- ============================================================================
-- 6. RECENT SESSION ANALYSIS
-- Shows the most recent sessions with full details
-- ============================================================================
SELECT 
    s.id,
    s.status,
    s.user_id,
    s.therapist_id,
    s.start_time,
    s.end_time,
    s.created_at,
    s.created_by,
    u.full_name as user_name,
    u.email as user_email,
    CASE 
        WHEN s.created_by = 'therapist' THEN 'Therapist Created'
        WHEN s.created_by = 'user' THEN 'User Created'
        ELSE 'Unknown'
    END as creator_type,
    CASE 
        WHEN s.status IN ('scheduled', 'in_progress', 'confirmed', 'pending_approval') 
        THEN 'Should Display'
        ELSE 'Filtered Out'
    END as display_status
FROM sessions s
LEFT JOIN users u ON u.id = s.user_id
WHERE s.therapist_id = '<YOUR_THERAPIST_ID>'
ORDER BY s.created_at DESC
LIMIT 10;

-- ============================================================================
-- 7. THERAPIST PROFILE VS SESSIONS ID COMPARISON
-- Checks if therapist_id in sessions matches user_id or therapist profile id
-- ============================================================================
SELECT 
    'Therapist Profile' as source,
    t.id as therapist_profile_id,
    t.user_id,
    t.name
FROM therapists t
WHERE t.user_id = '<YOUR_USER_ID>'

UNION ALL

SELECT 
    'Sessions Table' as source,
    NULL::uuid as therapist_profile_id,
    s.therapist_id as user_id,
    NULL as name
FROM sessions s
WHERE s.therapist_id = '<YOUR_USER_ID>'
GROUP BY s.therapist_id
LIMIT 1;

-- ============================================================================
-- 8. TIMESTAMP ANALYSIS
-- Checks for timezone or timestamp issues
-- ============================================================================
SELECT 
    id,
    status,
    start_time,
    end_time,
    created_at,
    EXTRACT(EPOCH FROM (end_time - start_time))/60 as calculated_duration_minutes,
    duration_minutes as stored_duration_minutes,
    CASE 
        WHEN EXTRACT(EPOCH FROM (end_time - start_time))/60 != duration_minutes 
        THEN 'DURATION MISMATCH'
        ELSE 'OK'
    END as duration_check,
    CASE 
        WHEN start_time IS NULL THEN 'MISSING START_TIME'
        WHEN end_time IS NULL THEN 'MISSING END_TIME'
        ELSE 'OK'
    END as timestamp_check
FROM sessions 
WHERE therapist_id = '<YOUR_THERAPIST_ID>'
  AND (start_time IS NULL OR end_time IS NULL OR 
       EXTRACT(EPOCH FROM (end_time - start_time))/60 != duration_minutes)
ORDER BY created_at DESC;

-- ============================================================================
-- 9. SESSION CREATION FLOW COMPARISON
-- Compares sessions created through different flows
-- ============================================================================
SELECT 
    CASE 
        WHEN created_by = 'therapist' THEN 'Therapist Created'
        WHEN created_by = 'user' OR created_by IS NULL THEN 'User Created'
        ELSE 'Unknown'
    END as creation_source,
    status,
    COUNT(*) as count,
    AVG(EXTRACT(EPOCH FROM (end_time - start_time))/60) as avg_duration_minutes,
    MIN(created_at) as first_created,
    MAX(created_at) as last_created
FROM sessions 
WHERE therapist_id = '<YOUR_THERAPIST_ID>'
GROUP BY creation_source, status
ORDER BY creation_source, count DESC;

-- ============================================================================
-- 10. MISSING DATA CHECK
-- Identifies sessions with missing critical fields
-- ============================================================================
SELECT 
    id,
    status,
    CASE 
        WHEN start_time IS NULL THEN 'Missing start_time'
        WHEN end_time IS NULL THEN 'Missing end_time'
        WHEN user_id IS NULL THEN 'Missing user_id'
        WHEN therapist_id IS NULL THEN 'Missing therapist_id'
        WHEN status IS NULL THEN 'Missing status'
        ELSE 'All fields present'
    END as missing_fields,
    created_at,
    created_by
FROM sessions 
WHERE therapist_id = '<YOUR_THERAPIST_ID>'
  AND (
    start_time IS NULL OR 
    end_time IS NULL OR 
    user_id IS NULL OR 
    therapist_id IS NULL OR 
    status IS NULL
  )
ORDER BY created_at DESC;

-- ============================================================================
-- USAGE INSTRUCTIONS:
-- ============================================================================
-- 1. Replace '<YOUR_THERAPIST_ID>' with your actual therapist user ID
--    (Get this from: SELECT id FROM users WHERE email = 'your-email@example.com' AND user_type = 'therapist')
--
-- 2. Replace '<YOUR_USER_ID>' with your actual user ID from auth session
--    (This should be the same as therapist_id if you're using user_id as therapist_id)
--
-- 3. Run queries in order, starting with Query 1 (Comprehensive Session Analysis)
--
-- 4. Compare results:
--    - Query 2: Check if therapist_id matches between user and therapist created sessions
--    - Query 3: Verify therapist_id resolution across tables
--    - Query 5: Check for missing user relations
--    - Query 6: See which sessions should display vs filtered out
--
-- 5. Key things to look for:
--    - Missing sessions in Query 1
--    - Status distribution issues in Query 4
--    - Missing user relations in Query 5
--    - Timestamp issues in Query 8
--    - Missing data in Query 10
-- ============================================================================

