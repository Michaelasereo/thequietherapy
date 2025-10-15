-- RENAME: mdcn_code to licensed_qualification in therapist tables
-- This aligns the database with the updated frontend field name

-- =====================================================
-- 1. Rename column in therapist_enrollments table
-- =====================================================
ALTER TABLE therapist_enrollments 
RENAME COLUMN mdcn_code TO licensed_qualification;

-- =====================================================
-- 2. Rename column in therapist_profiles table (if it exists)
-- =====================================================
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'therapist_profiles' AND column_name = 'mdcn_code'
    ) THEN
        ALTER TABLE therapist_profiles 
        RENAME COLUMN mdcn_code TO licensed_qualification;
        RAISE NOTICE '✅ Renamed mdcn_code to licensed_qualification in therapist_profiles';
    ELSE
        RAISE NOTICE 'ℹ️  Column mdcn_code not found in therapist_profiles';
    END IF;
END $$;

-- =====================================================
-- 3. Update any indexes that reference mdcn_code
-- =====================================================
DO $$
BEGIN
    -- Drop old index if it exists
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_therapist_profiles_mdcn_code') THEN
        DROP INDEX idx_therapist_profiles_mdcn_code;
        RAISE NOTICE '✅ Dropped old index idx_therapist_profiles_mdcn_code';
    END IF;
    
    -- Create new index with updated name
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'therapist_profiles' AND column_name = 'licensed_qualification'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_therapist_profiles_licensed_qualification 
        ON therapist_profiles(licensed_qualification);
        RAISE NOTICE '✅ Created new index idx_therapist_profiles_licensed_qualification';
    END IF;
END $$;

-- =====================================================
-- 4. Verification
-- =====================================================
SELECT '✅ MIGRATION COMPLETE' as status;

-- Show updated schema for therapist_enrollments
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'therapist_enrollments'
AND column_name = 'licensed_qualification';

-- Show updated schema for therapist_profiles (if exists)
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'therapist_profiles'
AND column_name = 'licensed_qualification';

-- Confirm old column is gone
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ Old mdcn_code column successfully removed'
        ELSE '⚠️  Old mdcn_code column still exists'
    END as verification
FROM information_schema.columns
WHERE (table_name = 'therapist_enrollments' OR table_name = 'therapist_profiles')
AND column_name = 'mdcn_code';

