-- Updated availability function that generates individual time slots
-- Each slot is 25 minutes with buffer time between slots

DROP FUNCTION IF EXISTS generate_availability_slots(UUID, DATE, DATE);

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
    reason VARCHAR(100),
    is_available BOOLEAN,
    slot_number INTEGER
) AS $$
BEGIN
    -- Input validation
    IF p_start_date > p_end_date THEN
        RAISE EXCEPTION 'Start date must be before end date';
    END IF;

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
            NULL::varchar(100) as reason,
            true as is_available
        FROM daily_data dd
        LEFT JOIN availability_templates at ON dd.day_of_week = at.day_of_week 
            AND at.therapist_id = p_therapist_id 
            AND at.is_active = true
        WHERE at.start_time IS NOT NULL AND at.end_time IS NOT NULL
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
        WHERE ao.id IS NOT NULL
    ),
    combined_data AS (
        SELECT 
            COALESCE(od.date, td.date) as date,
            COALESCE(od.day_of_week, td.day_of_week) as day_of_week,
            COALESCE(od.start_time, td.start_time) as start_time,
            COALESCE(od.end_time, td.end_time) as end_time,
            COALESCE(od.session_duration, td.session_duration) as session_duration,
            COALESCE(od.session_type, td.session_type) as session_type,
            COALESCE(od.max_sessions, td.max_sessions) as max_sessions,
            COALESCE(od.is_override, false) as is_override,
            od.reason,
            COALESCE(od.is_available, td.is_available) as is_available
        FROM template_data td
        FULL OUTER JOIN override_data od ON td.date = od.date
    ),
    -- Generate individual time slots
    time_slots AS (
        SELECT 
            cd.date,
            cd.day_of_week,
            cd.session_duration,
            cd.session_type,
            cd.max_sessions,
            cd.is_override,
            cd.reason,
            cd.is_available,
            -- Generate slots every 30 minutes (25 min session + 5 min buffer)
            (cd.start_time + (slot_interval * interval '30 minutes'))::time as slot_start_time,
            (cd.start_time + (slot_interval * interval '30 minutes') + interval '25 minutes')::time as slot_end_time,
            slot_interval + 1 as slot_number
        FROM combined_data cd,
        LATERAL generate_series(0, 
            -- Calculate how many 30-minute slots fit in the available time
            EXTRACT(EPOCH FROM (cd.end_time - cd.start_time))::integer / (30 * 60) - 1
        ) as slot_interval
        WHERE 
            cd.is_available = true 
            AND cd.start_time IS NOT NULL 
            AND cd.end_time IS NOT NULL
            AND cd.start_time < cd.end_time
            -- Make sure the slot doesn't exceed the end time
            AND (cd.start_time + (slot_interval * interval '30 minutes') + interval '25 minutes')::time <= cd.end_time
    )
    SELECT 
        ts.date,
        ts.day_of_week,
        ts.slot_start_time as start_time,
        ts.slot_end_time as end_time,
        ts.session_duration,
        ts.session_type,
        ts.max_sessions,
        ts.is_override,
        ts.reason,
        ts.is_available,
        ts.slot_number
    FROM time_slots ts
    ORDER BY ts.date, ts.slot_start_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
