-- Run this in Supabase SQL Editor to check which columns are required
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default,
  CASE 
    WHEN is_nullable = 'NO' AND column_default IS NULL THEN '⚠️ REQUIRED - NO DEFAULT'
    WHEN is_nullable = 'NO' AND column_default IS NOT NULL THEN '✓ Required with default'
    ELSE '○ Optional'
  END as requirement_status
FROM information_schema.columns 
WHERE table_name = 'sessions' 
  AND table_schema = 'public'
ORDER BY 
  CASE WHEN is_nullable = 'NO' AND column_default IS NULL THEN 1 ELSE 2 END,
  ordinal_position;

