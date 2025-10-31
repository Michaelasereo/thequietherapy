-- =============================================
-- FIX BOOKING CONFLICT DETECTION
-- Fixes the check_booking_conflict function to properly compare timestamps
-- =============================================

-- Create or replace the conflict detection function with proper timestamp comparison
CREATE OR REPLACE FUNCTION check_booking_conflict(
    p_therapist_id UUID,
    p_session_date DATE,
    p_start_time TIME,
    p_end_time TIME
) RETURNS BOOLEAN AS $$
DECLARE
    conflict_count INTEGER;
    p_start_timestamp TIMESTAMP WITH TIME ZONE;
    p_end_timestamp TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Convert DATE and TIME to proper TIMESTAMP WITH TIME ZONE
    p_start_timestamp := (p_session_date || ' ' || p_start_time)::TIMESTAMP WITH TIME ZONE;
    p_end_timestamp := (p_session_date || ' ' || p_end_time)::TIMESTAMP WITH TIME ZONE;
    
    -- Check for existing sessions that overlap using proper timestamp comparison
    SELECT COUNT(*) INTO conflict_count
    FROM sessions s
    WHERE s.therapist_id = p_therapist_id
    AND s.status IN ('scheduled', 'confirmed', 'in_progress')
    -- Check for time overlap: session overlaps if start < end AND end > start
    AND s.start_time < p_end_timestamp 
    AND s.end_time > p_start_timestamp;
    
    RETURN conflict_count > 0;
END;
$$ LANGUAGE plpgsql;

-- Add comment for documentation
COMMENT ON FUNCTION check_booking_conflict IS 'Checks for booking conflicts using proper timestamp comparison';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION check_booking_conflict TO authenticated;

-- Test the function
DO $$
DECLARE
    test_result BOOLEAN;
BEGIN
    -- This should return false if there are no conflicts
    SELECT check_booking_conflict(
        '00000000-0000-0000-0000-000000000000'::UUID,
        CURRENT_DATE,
        '10:00'::TIME,
        '11:00'::TIME
    ) INTO test_result;
    
    RAISE NOTICE 'Conflict check test result: %', test_result;
END $$;

