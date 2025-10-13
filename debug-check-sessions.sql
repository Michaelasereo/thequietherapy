-- Run this in Supabase SQL Editor to see what sessions exist

-- 1. Check all sessions created today
SELECT 
  id,
  user_id,
  therapist_id,
  scheduled_date,
  scheduled_time,
  start_time,
  status,
  title,
  created_at
FROM sessions
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- 2. Check sessions with status = 'scheduled'
SELECT 
  id,
  user_id,
  therapist_id,
  scheduled_date,
  scheduled_time,
  start_time,
  status,
  title,
  created_at
FROM sessions
WHERE status = 'scheduled'
ORDER BY scheduled_date DESC, scheduled_time DESC
LIMIT 10;

-- 3. Check today's date (to compare with scheduled_date)
SELECT 
  NOW() as current_timestamp,
  CURRENT_DATE as current_date,
  CURRENT_DATE::text as current_date_text;

-- 4. Check for any sessions scheduled in the future
SELECT 
  id,
  user_id,
  therapist_id,
  scheduled_date,
  scheduled_date::text as scheduled_date_text,
  CURRENT_DATE::text as today_text,
  CASE 
    WHEN scheduled_date >= CURRENT_DATE THEN '✅ FUTURE'
    ELSE '❌ PAST'
  END as is_future,
  scheduled_time,
  status,
  title
FROM sessions
WHERE status = 'scheduled'
ORDER BY scheduled_date DESC
LIMIT 10;

