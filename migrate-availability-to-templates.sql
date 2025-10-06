-- Migration Script: Convert Old Availability to New Template System
-- This script migrates data from the old therapist_availability table to the new template-based system
-- Run this AFTER creating the new schema tables

-- =============================================
-- STEP 1: MIGRATE EXISTING AVAILABILITY TO TEMPLATES
-- =============================================

-- Insert availability templates from existing therapist_availability records
INSERT INTO availability_templates (
    therapist_id,
    day_of_week,
    start_time,
    end_time,
    session_duration,
    session_type,
    max_sessions,
    is_active,
    created_at,
    updated_at
)
SELECT 
    ta.therapist_id,
    ta.day_of_week,
    ta.start_time,
    ta.end_time,
    60 as session_duration, -- Default to 60 minutes
    'individual' as session_type, -- Default to individual sessions
    8 as max_sessions, -- Default to 8 sessions per day
    ta.is_available,
    ta.created_at,
    ta.updated_at
FROM therapist_availability ta
WHERE ta.is_available = true
ON CONFLICT (therapist_id, day_of_week) DO UPDATE SET
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    session_duration = EXCLUDED.session_duration,
    session_type = EXCLUDED.session_type,
    max_sessions = EXCLUDED.max_sessions,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- =============================================
-- STEP 2: CREATE OVERRIDES FOR SPECIFIC DATE AVAILABILITY
-- =============================================

-- If you have any specific date availability in the old system, migrate it to overrides
-- This is a placeholder - adjust based on your old data structure
-- INSERT INTO availability_overrides (
--     therapist_id,
--     override_date,
--     is_available,
--     start_time,
--     end_time,
--     session_duration,
--     session_type,
--     max_sessions,
--     reason,
--     created_at,
--     updated_at
-- )
-- SELECT 
--     ta.therapist_id,
--     ta.date, -- Assuming you have a date column
--     ta.is_available,
--     ta.start_time,
--     ta.end_time,
--     60 as session_duration,
--     'individual' as session_type,
--     1 as max_sessions,
--     'Migrated from old system' as reason,
--     ta.created_at,
--     ta.updated_at
-- FROM therapist_availability ta
-- WHERE ta.date IS NOT NULL -- Only migrate records with specific dates
-- ON CONFLICT (therapist_id, override_date) DO UPDATE SET
--     is_available = EXCLUDED.is_available,
--     start_time = EXCLUDED.start_time,
--     end_time = EXCLUDED.end_time,
--     session_duration = EXCLUDED.session_duration,
--     session_type = EXCLUDED.session_type,
--     max_sessions = EXCLUDED.max_sessions,
--     reason = EXCLUDED.reason,
--     updated_at = NOW();

-- =============================================
-- STEP 3: VERIFY MIGRATION
-- =============================================

-- Check migration results
SELECT 
    'Migration Summary' as status,
    (SELECT COUNT(*) FROM therapist_availability WHERE is_available = true) as old_availability_records,
    (SELECT COUNT(*) FROM availability_templates) as new_template_records,
    (SELECT COUNT(*) FROM availability_overrides) as new_override_records;

-- Show sample migrated data
SELECT 
    'Sample Templates' as type,
    at.therapist_id,
    at.day_of_week,
    at.start_time,
    at.end_time,
    at.session_duration,
    at.is_active
FROM availability_templates at
ORDER BY at.therapist_id, at.day_of_week
LIMIT 10;

-- Show therapists with migrated availability
SELECT 
    'Therapists with Templates' as type,
    u.full_name,
    u.email,
    COUNT(at.id) as template_count
FROM users u
LEFT JOIN availability_templates at ON u.id = at.therapist_id
WHERE u.user_type = 'therapist'
GROUP BY u.id, u.full_name, u.email
HAVING COUNT(at.id) > 0
ORDER BY template_count DESC;

-- =============================================
-- STEP 4: CLEANUP (OPTIONAL - RUN AFTER TESTING)
-- =============================================

-- Uncomment these lines ONLY after you've verified the migration works correctly
-- and you're ready to remove the old table

-- -- Create a backup of the old table first
-- CREATE TABLE therapist_availability_backup AS 
-- SELECT * FROM therapist_availability;

-- -- Drop the old table (ONLY after confirming everything works)
-- -- DROP TABLE therapist_availability;

-- =============================================
-- STEP 5: UPDATE APPLICATION CODE
-- =============================================

-- After running this migration, update your application to:
-- 1. Use the new /api/therapist/availability/template endpoints for weekly schedules
-- 2. Use the new /api/therapist/availability/override endpoints for date exceptions
-- 3. Use the new /api/therapist/availability/generate endpoint to get available slots
-- 4. Update frontend components to use the new API structure

-- =============================================
-- SUCCESS MESSAGE
-- =============================================

SELECT 
    'Migration completed successfully!' as status,
    'Old availability data has been migrated to the new template system' as message,
    'Next: Update your application code to use the new APIs' as next_step;
