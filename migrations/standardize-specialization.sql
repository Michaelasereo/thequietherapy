-- ============================================
-- MIGRATION: Standardize Specialization Field
-- ============================================
-- Purpose: Fix specialization type mismatch between tables
-- Issue: therapist_enrollments uses TEXT, therapist_profiles uses TEXT[]
-- Solution: Standardize both to TEXT[]
-- ============================================

-- STEP 1: Check current state
-- ============================================
DO $$
BEGIN
  RAISE NOTICE 'Checking current specialization field types...';
END $$;

SELECT 
  table_name,
  column_name,
  data_type,
  udt_name
FROM information_schema.columns
WHERE column_name IN ('specialization', 'specializations')
  AND table_name IN ('therapist_enrollments', 'therapist_profiles')
ORDER BY table_name, column_name;

-- STEP 2: Add new specializations column to therapist_enrollments
-- ============================================
DO $$
BEGIN
  -- Add new column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'therapist_enrollments' 
    AND column_name = 'specializations'
  ) THEN
    ALTER TABLE therapist_enrollments 
    ADD COLUMN specializations TEXT[];
    
    RAISE NOTICE '✅ Added specializations column to therapist_enrollments';
  ELSE
    RAISE NOTICE '⚠️ specializations column already exists in therapist_enrollments';
  END IF;
END $$;

-- STEP 3: Migrate data from specialization (TEXT) to specializations (TEXT[])
-- ============================================
DO $$
DECLARE
  rows_updated INTEGER;
BEGIN
  RAISE NOTICE 'Migrating specialization data...';
  
  -- Convert TEXT to TEXT[] array
  UPDATE therapist_enrollments 
  SET specializations = CASE 
    WHEN specialization IS NOT NULL AND specialization != '' 
    THEN ARRAY[specialization]::TEXT[]
    ELSE '{}'::TEXT[]
  END
  WHERE specializations IS NULL;
  
  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  RAISE NOTICE '✅ Migrated % rows', rows_updated;
END $$;

-- STEP 4: Verify migration
-- ============================================
DO $$
DECLARE
  total_rows INTEGER;
  migrated_rows INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_rows 
  FROM therapist_enrollments;
  
  SELECT COUNT(*) INTO migrated_rows 
  FROM therapist_enrollments 
  WHERE specializations IS NOT NULL;
  
  RAISE NOTICE 'Verification: Total rows: %, Migrated rows: %', total_rows, migrated_rows;
  
  IF total_rows != migrated_rows THEN
    RAISE WARNING '⚠️ Not all rows migrated! Check data manually.';
  ELSE
    RAISE NOTICE '✅ All rows migrated successfully';
  END IF;
END $$;

-- STEP 5: Sample data check
-- ============================================
SELECT 
  email,
  specialization as old_field,
  specializations as new_field,
  CASE 
    WHEN specialization IS NOT NULL AND specializations IS NOT NULL THEN '✅ Migrated'
    WHEN specialization IS NULL AND specializations IS NULL THEN '⚪ Empty'
    ELSE '❌ Issue'
  END as status
FROM therapist_enrollments
ORDER BY created_at DESC
LIMIT 10;

-- STEP 6: Drop old column (ONLY AFTER VERIFICATION!)
-- ============================================
-- ⚠️ UNCOMMENT ONLY AFTER VERIFYING MIGRATION SUCCESS
/*
DO $$
BEGIN
  -- Check if old column exists
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'therapist_enrollments' 
    AND column_name = 'specialization'
  ) THEN
    -- Drop the old column
    ALTER TABLE therapist_enrollments 
    DROP COLUMN specialization;
    
    RAISE NOTICE '✅ Dropped old specialization column';
  ELSE
    RAISE NOTICE '⚠️ Old specialization column does not exist';
  END IF;
END $$;
*/

-- STEP 7: Update therapist_profiles to ensure consistency
-- ============================================
-- Verify therapist_profiles already uses TEXT[]
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'therapist_profiles' 
    AND column_name = 'specializations'
    AND data_type = 'ARRAY'
  ) THEN
    RAISE NOTICE '✅ therapist_profiles.specializations is already TEXT[]';
  ELSE
    RAISE WARNING '⚠️ therapist_profiles.specializations might need fixing';
  END IF;
END $$;

-- STEP 8: Sync specializations from enrollments to profiles
-- ============================================
DO $$
DECLARE
  rows_updated INTEGER;
BEGIN
  RAISE NOTICE 'Syncing specializations to therapist_profiles...';
  
  UPDATE therapist_profiles tp
  SET 
    specializations = te.specializations,
    updated_at = NOW()
  FROM therapist_enrollments te
  JOIN users u ON te.email = u.email AND u.user_type = 'therapist'
  WHERE tp.user_id = u.id
    AND (tp.specializations IS DISTINCT FROM te.specializations);
  
  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  RAISE NOTICE '✅ Synced specializations for % profiles', rows_updated;
END $$;

-- STEP 9: Create index for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_therapist_enrollments_specializations 
ON therapist_enrollments USING GIN (specializations);

CREATE INDEX IF NOT EXISTS idx_therapist_profiles_specializations 
ON therapist_profiles USING GIN (specializations);

-- STEP 10: Final verification report
-- ============================================
SELECT 
  '=== MIGRATION COMPLETE ===' as status,
  COUNT(*) as total_therapists,
  COUNT(CASE WHEN specializations IS NOT NULL THEN 1 END) as with_specializations,
  COUNT(CASE WHEN specializations IS NULL OR specializations = '{}' THEN 1 END) as without_specializations
FROM therapist_enrollments;

-- Check for inconsistencies between tables
SELECT 
  u.email,
  te.specializations as enrollment_spec,
  tp.specializations as profile_spec,
  CASE 
    WHEN te.specializations = tp.specializations THEN '✅ Consistent'
    ELSE '❌ Inconsistent'
  END as status
FROM users u
JOIN therapist_enrollments te ON te.email = u.email
LEFT JOIN therapist_profiles tp ON tp.user_id = u.id
WHERE u.user_type = 'therapist'
  AND (te.specializations IS DISTINCT FROM tp.specializations)
ORDER BY u.email
LIMIT 20;

-- ROLLBACK PLAN
-- ============================================
/*
-- If migration fails, rollback with:

-- 1. Re-add old column
ALTER TABLE therapist_enrollments 
ADD COLUMN specialization TEXT;

-- 2. Restore data from new column
UPDATE therapist_enrollments 
SET specialization = specializations[1]
WHERE array_length(specializations, 1) > 0;

-- 3. Drop new column
ALTER TABLE therapist_enrollments 
DROP COLUMN specializations;

RAISE NOTICE '✅ Rollback complete';
*/

-- NOTES
-- ============================================
/*
After running this migration:

1. Update all application code to use 'specializations' (plural)
2. Search and replace: 
   - 'specialization' → 'specializations' in queries
   - Handle TEXT[] instead of TEXT in forms
3. Update API endpoints that query specializations
4. Update frontend components that display specializations
5. Test thoroughly before dropping old column

Key files to update:
- app/therapist/enroll/page.tsx
- app/therapist/profile/actions.ts
- app/api/therapists/route.ts
- components/therapist-card.tsx
- Any forms that handle specializations
*/

