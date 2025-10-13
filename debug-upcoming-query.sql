-- Debug the exact query that the dashboard uses to find upcoming sessions
-- Replace 'YOUR_PATIENT_ID' with the actual patient ID from your session

-- 1. Get the patient ID from the session we created
SELECT 
  user_id as patient_id,
  therapist_id,
  scheduled_date,
  scheduled_time,
  status,
  title
FROM sessions 
WHERE id = '6009ecebb36';

-- 2. Test the exact query the dashboard uses (replace USER_ID with the patient_id from above)
-- This is the exact query from /api/sessions/upcoming
SELECT 
  id,
  scheduled_date,
  scheduled_time,
  duration_minutes,
  status,
  title,
  therapist_id,
  user_id,
  CASE 
    WHEN scheduled_date >= CURRENT_DATE THEN '✅ SHOULD SHOW'
    ELSE '❌ FILTERED OUT'
  END as query_result
FROM sessions
WHERE user_id = 'REPLACE_WITH_PATIENT_ID'  -- Replace this with the actual user_id
  AND status = 'scheduled'
  AND scheduled_date >= CURRENT_DATE  -- This is the key filter
ORDER BY scheduled_date ASC, scheduled_time ASC
LIMIT 1;

-- 3. Check what CURRENT_DATE returns
SELECT 
  CURRENT_DATE as today_date,
  '2025-10-13' as session_date,
  CASE 
    WHEN '2025-10-13' >= CURRENT_DATE THEN '✅ SHOULD MATCH'
    ELSE '❌ DOES NOT MATCH'
  END as date_comparison;

-- 4. Check all sessions for this patient (no date filter)
SELECT 
  id,
  user_id,
  scheduled_date,
  scheduled_time,
  status,
  title,
  created_at
FROM sessions
WHERE user_id = 'REPLACE_WITH_PATIENT_ID'  -- Replace this
ORDER BY created_at DESC;
