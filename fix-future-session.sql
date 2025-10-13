-- Fix the session that was scheduled for 2025 (it should be 2024)
-- Run this in Supabase SQL Editor

-- 1. Update the session to be scheduled for tomorrow (2024-10-13 instead of 2025-10-13)
UPDATE sessions 
SET 
  scheduled_date = '2024-10-13',
  start_time = (scheduled_date || ' ' || scheduled_time)::TIMESTAMP WITH TIME ZONE
WHERE 
  id = '6009ecebb36' 
  AND scheduled_date = '2025-10-13';

-- 2. Verify the update
SELECT 
  id,
  scheduled_date,
  scheduled_time,
  start_time,
  status,
  title,
  CASE 
    WHEN scheduled_date >= CURRENT_DATE THEN '✅ FUTURE'
    ELSE '❌ PAST'
  END as is_future
FROM sessions 
WHERE id = '6009ecebb36';

-- 3. Check all upcoming sessions for this patient and therapist
SELECT 
  s.id,
  s.scheduled_date,
  s.scheduled_time,
  s.status,
  s.title,
  u.full_name as patient_name,
  t.full_name as therapist_name
FROM sessions s
LEFT JOIN users u ON s.user_id = u.id
LEFT JOIN users t ON s.therapist_id = t.id
WHERE 
  s.status = 'scheduled'
  AND s.scheduled_date >= CURRENT_DATE
ORDER BY s.scheduled_date, s.scheduled_time;
