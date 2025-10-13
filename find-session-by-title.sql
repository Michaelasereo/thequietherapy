-- Find the session by title since we don't have the full UUID
-- Run this in Supabase SQL Editor

-- 1. Find the session by title (since we know it's "Follow-up Session - adenike")
SELECT 
  id,
  user_id as patient_id,
  therapist_id,
  scheduled_date,
  scheduled_time,
  status,
  title,
  created_at
FROM sessions 
WHERE title = 'Follow-up Session - adenike'
ORDER BY created_at DESC
LIMIT 1;

-- 2. Once we have the full session ID, test the dashboard query
-- (Copy the patient_id from above and use it in the next query)
SELECT 
  id,
  scheduled_date,
  scheduled_time,
  status,
  title,
  user_id,
  CASE 
    WHEN scheduled_date >= CURRENT_DATE THEN '✅ SHOULD SHOW'
    ELSE '❌ FILTERED OUT'
  END as query_result
FROM sessions
WHERE title = 'Follow-up Session - adenike'
  AND status = 'scheduled'
  AND scheduled_date >= CURRENT_DATE
ORDER BY scheduled_date ASC, scheduled_time ASC;

-- 3. Check date comparison
SELECT 
  CURRENT_DATE as today_date,
  '2025-10-13' as session_date,
  CURRENT_DATE::text as today_text,
  '2025-10-13'::date as session_date_typed,
  CASE 
    WHEN '2025-10-13'::date >= CURRENT_DATE THEN '✅ SHOULD MATCH'
    ELSE '❌ DOES NOT MATCH'
  END as date_comparison;

-- 4. Test with the actual patient_id (replace with the patient_id from query 1)
-- SELECT 
--   id,
--   scheduled_date,
--   scheduled_time,
--   status,
--   title
-- FROM sessions
-- WHERE user_id = 'FULL_PATIENT_UUID_HERE'
--   AND status = 'scheduled'
--   AND scheduled_date >= CURRENT_DATE
-- ORDER BY scheduled_date ASC, scheduled_time ASC
-- LIMIT 1;
