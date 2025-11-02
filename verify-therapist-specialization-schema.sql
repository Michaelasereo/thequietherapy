-- ============================================
-- VERIFICATION & MIGRATION SCRIPT
-- Therapist Specializations & Client Preferences
-- ============================================
-- This script verifies and ensures the database schema
-- is ready for the new grouped specializations
-- ============================================

-- STEP 1: Check current therapist table structure
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'Checking therapist tables schema...';
  RAISE NOTICE '==========================================';
END $$;

SELECT 
  table_name,
  column_name,
  data_type,
  udt_name,
  is_nullable
FROM information_schema.columns
WHERE table_name IN ('therapist_enrollments', 'therapist_profiles')
  AND column_name IN ('specialization', 'specializations')
ORDER BY table_name, column_name;

-- STEP 2: Ensure specializations column exists in therapist_enrollments
-- ============================================
DO $$
DECLARE
  spec_type TEXT;
BEGIN
  -- Check if specializations (array) column exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'therapist_enrollments' 
    AND column_name = 'specializations'
    AND udt_name = '_text' -- TEXT[] array type
  ) THEN
    -- Add specializations column as TEXT[]
    ALTER TABLE therapist_enrollments 
    ADD COLUMN specializations TEXT[];
    
    RAISE NOTICE '✅ Added specializations (TEXT[]) column to therapist_enrollments';
    
    -- If specialization (singular) exists, migrate data
    IF EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'therapist_enrollments' 
      AND column_name = 'specialization'
    ) THEN
      -- Check if specialization column is TEXT or TEXT[]
      SELECT udt_name INTO spec_type
      FROM information_schema.columns
      WHERE table_name = 'therapist_enrollments'
        AND column_name = 'specialization';
      
      IF spec_type = 'text' THEN
        -- It's TEXT, so we need to convert to array
        -- First, handle empty/NULL values
        UPDATE therapist_enrollments 
        SET specializations = ARRAY[]::TEXT[]
        WHERE specializations IS NULL 
          AND (specialization IS NULL OR NULLIF(TRIM(specialization), '') IS NULL);
        
        -- Then, migrate valid TEXT values
        UPDATE therapist_enrollments 
        SET specializations = ARRAY[TRIM(specialization)]::TEXT[]
        WHERE specializations IS NULL 
          AND specialization IS NOT NULL 
          AND NULLIF(TRIM(specialization), '') IS NOT NULL;
          
      ELSIF spec_type = '_text' THEN
        -- It's already TEXT[], just copy it
        UPDATE therapist_enrollments 
        SET specializations = specialization::TEXT[]
        WHERE specializations IS NULL 
          AND specialization IS NOT NULL;
      END IF;
      
      RAISE NOTICE '✅ Migrated data from specialization (%) to specializations', spec_type;
    END IF;
  ELSE
    RAISE NOTICE 'ℹ️ specializations column already exists in therapist_enrollments';
  END IF;
END $$;

-- STEP 3: Ensure specializations column exists in therapist_profiles
-- ============================================
DO $$
DECLARE
  spec_type TEXT;
BEGIN
  -- Check if specializations (array) column exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'therapist_profiles' 
    AND column_name = 'specializations'
    AND udt_name = '_text' -- TEXT[] array type
  ) THEN
    -- Add specializations column as TEXT[]
    ALTER TABLE therapist_profiles 
    ADD COLUMN specializations TEXT[];
    
    RAISE NOTICE '✅ Added specializations (TEXT[]) column to therapist_profiles';
    
    -- If specialization (singular) exists, migrate data
    IF EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'therapist_profiles' 
      AND column_name = 'specialization'
    ) THEN
      -- Check if specialization column is TEXT or TEXT[]
      SELECT udt_name INTO spec_type
      FROM information_schema.columns
      WHERE table_name = 'therapist_profiles'
        AND column_name = 'specialization';
      
      IF spec_type = 'text' THEN
        -- It's TEXT, so we need to convert to array
        -- First, handle empty/NULL values
        UPDATE therapist_profiles 
        SET specializations = ARRAY[]::TEXT[]
        WHERE specializations IS NULL 
          AND (specialization IS NULL OR NULLIF(TRIM(specialization), '') IS NULL);
        
        -- Then, migrate valid TEXT values
        UPDATE therapist_profiles 
        SET specializations = ARRAY[TRIM(specialization)]::TEXT[]
        WHERE specializations IS NULL 
          AND specialization IS NOT NULL 
          AND NULLIF(TRIM(specialization), '') IS NOT NULL;
          
      ELSIF spec_type = '_text' THEN
        -- It's already TEXT[], just copy it
        UPDATE therapist_profiles 
        SET specializations = specialization::TEXT[]
        WHERE specializations IS NULL 
          AND specialization IS NOT NULL;
      END IF;
      
      RAISE NOTICE '✅ Migrated data from specialization (%) to specializations', spec_type;
    END IF;
  ELSE
    RAISE NOTICE 'ℹ️ specializations column already exists in therapist_profiles';
  END IF;
END $$;

-- STEP 4: Verify patient_biodata table has therapist_preference column
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'Checking patient_biodata table...';
  RAISE NOTICE '==========================================';
  
  -- Check if therapist_preference column exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'patient_biodata' 
    AND column_name = 'therapist_preference'
  ) THEN
    -- Add therapist_preference column as TEXT (can store JSON string)
    ALTER TABLE patient_biodata 
    ADD COLUMN therapist_preference TEXT;
    
    RAISE NOTICE '✅ Added therapist_preference column to patient_biodata';
  ELSE
    RAISE NOTICE 'ℹ️ therapist_preference column already exists in patient_biodata';
  END IF;
  
  -- Verify it's TEXT type (no constraints needed)
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'patient_biodata' 
    AND column_name = 'therapist_preference'
    AND data_type = 'text'
  ) THEN
    RAISE NOTICE '✅ therapist_preference is TEXT type - ready for JSON string storage';
  ELSE
    RAISE NOTICE '⚠️ therapist_preference exists but may not be TEXT type';
  END IF;
END $$;

-- STEP 5: Final verification - show current schema
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'Final Schema Verification';
  RAISE NOTICE '==========================================';
END $$;

-- Show therapist tables
SELECT 
  'therapist_enrollments' as table_name,
  column_name,
  data_type,
  udt_name as array_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'therapist_enrollments'
  AND column_name IN ('specialization', 'specializations')
UNION ALL
SELECT 
  'therapist_profiles' as table_name,
  column_name,
  data_type,
  udt_name as array_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'therapist_profiles'
  AND column_name IN ('specialization', 'specializations')
ORDER BY table_name, column_name;

-- Show patient_biodata therapist_preference
SELECT 
  'patient_biodata' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'patient_biodata'
  AND column_name = 'therapist_preference';

-- STEP 6: Summary
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '==========================================';
  RAISE NOTICE '✅ Schema verification complete!';
  RAISE NOTICE '==========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'The database is ready for:';
  RAISE NOTICE '1. New grouped therapist specializations (21 options)';
  RAISE NOTICE '2. Client therapy preferences (stored as JSON)';
  RAISE NOTICE '';
  RAISE NOTICE 'Both specializations and preferences use TEXT/TEXT[]';
  RAISE NOTICE 'types with NO constraints, so they accept any values.';
  RAISE NOTICE '==========================================';
END $$;

