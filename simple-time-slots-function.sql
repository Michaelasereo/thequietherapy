-- Simpler version that generates 25-minute time slots
-- Each slot is 25 minutes with 5 minutes buffer between slots

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
    reason VARCHAR(100)
) AS $$
DECLARE
    current_date DATE;
    current_time TIME;
    slot_start TIME;
    slot_end TIME;
    therapist_start TIME;
    therapist_end TIME;
    day_of_week INTEGER;
    session_duration INTEGER := 25; -- 25 minutes per session
    buffer_time INTEGER := 5; -- 5 minutes buffer between sessions
    total_slot_time INTEGER := 30; -- 25 + 5 = 30 minutes total per slot
BEGIN
    -- Loop through each date in the range
    FOR current_date IN p_start_date..p_end_date LOOP
        day_of_week := EXTRACT(dow FROM current_date)::integer;
        
        -- Get therapist's availability for this day
        SELECT start_time, end_time 
        INTO therapist_start, therapist_end
        FROM availability_templates 
        WHERE therapist_id = p_therapist_id 
        AND day_of_week = EXTRACT(dow FROM current_date)::integer
        AND is_active = true;
        
        -- If no template found, check for override
        IF therapist_start IS NULL THEN
            SELECT start_time, end_time 
            INTO therapist_start, therapist_end
            FROM availability_overrides 
            WHERE therapist_id = p_therapist_id 
            AND override_date = current_date
            AND is_available = true;
        END IF;
        
        -- If we have availability, generate time slots
        IF therapist_start IS NOT NULL AND therapist_end IS NOT NULL THEN
            current_time := therapist_start;
            
            -- Generate slots while we have time
            WHILE current_time + (session_duration || ' minutes')::interval <= therapist_end LOOP
                slot_start := current_time;
                slot_end := current_time + (session_duration || ' minutes')::interval;
                
                -- Return this slot
                date := current_date;
                day_of_week := EXTRACT(dow FROM current_date)::integer;
                start_time := slot_start;
                end_time := slot_end;
                session_duration := 25;
                session_type := 'individual';
                max_sessions := 1;
                is_override := false;
                reason := NULL;
                
                RETURN NEXT;
                
                -- Move to next slot (25 min session + 5 min buffer = 30 min total)
                current_time := current_time + (total_slot_time || ' minutes')::interval;
            END LOOP;
        END IF;
    END LOOP;
    
    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
