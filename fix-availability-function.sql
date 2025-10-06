-- Fix the generate_availability_slots function to include is_available column
-- This fixes the error: column od.is_available does not exist

CREATE OR REPLACE FUNCTION generate_availability_slots(
    p_therapist_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE (
    date DATE,
    day_of_week INTEGER,
    start_time TIME,
    end_time TIME,
    session_duration INTEGER,
    session_type VARCHAR(20),
    max_sessions INTEGER,
    is_override BOOLEAN,
    reason VARCHAR(100)
) AS $$
BEGIN
    RETURN QUERY
    WITH date_series AS (
        SELECT generate_series(p_start_date, p_end_date, '1 day'::interval)::date as date
    ),
    daily_data AS (
        SELECT 
            ds.date,
            EXTRACT(dow FROM ds.date)::integer as day_of_week
        FROM date_series ds
    ),
    template_data AS (
        SELECT 
            dd.date,
            dd.day_of_week,
            at.start_time,
            at.end_time,
            at.session_duration,
            at.session_type,
            at.max_sessions,
            false as is_override,
            NULL::varchar(100) as reason
        FROM daily_data dd
        LEFT JOIN availability_templates at ON dd.day_of_week = at.day_of_week 
            AND at.therapist_id = p_therapist_id 
            AND at.is_active = true
    ),
    override_data AS (
        SELECT 
            dd.date,
            dd.day_of_week,
            ao.start_time,
            ao.end_time,
            ao.session_duration,
            ao.session_type,
            ao.max_sessions,
            true as is_override,
            ao.reason,
            ao.is_available
        FROM daily_data dd
        LEFT JOIN availability_overrides ao ON dd.date = ao.override_date 
            AND ao.therapist_id = p_therapist_id
    )
    SELECT 
        COALESCE(od.date, td.date) as date,
        COALESCE(od.day_of_week, td.day_of_week) as day_of_week,
        COALESCE(od.start_time, td.start_time) as start_time,
        COALESCE(od.end_time, td.end_time) as end_time,
        COALESCE(od.session_duration, td.session_duration) as session_duration,
        COALESCE(od.session_type, td.session_type) as session_type,
        COALESCE(od.max_sessions, td.max_sessions) as max_sessions,
        COALESCE(od.is_override, false) as is_override,
        od.reason
    FROM template_data td
    FULL OUTER JOIN override_data od ON td.date = od.date
    WHERE 
        -- Only return slots where therapist is available
        (od.is_available IS NULL AND td.start_time IS NOT NULL) OR 
        (od.is_available = true AND od.start_time IS NOT NULL)
    ORDER BY date, start_time;
END;
$$ LANGUAGE plpgsql;
