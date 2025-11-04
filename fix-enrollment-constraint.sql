-- =====================================================
-- FIX THERAPIST ENROLLMENT CONSTRAINT ISSUE
-- =====================================================
-- Problem: UNIQUE constraint on user_id prevents enrollments
--         because user_id is NULL during enrollment phase
-- Solution: Remove UNIQUE constraint, add partial unique index
-- =====================================================

-- Step 1: Drop the UNIQUE constraint on user_id if it exists
DO $$
BEGIN
    -- Check if constraint exists and drop it
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'therapist_enrollments' 
        AND constraint_name = 'therapist_enrollments_user_id_key'
    ) THEN
        ALTER TABLE therapist_enrollments DROP CONSTRAINT therapist_enrollments_user_id_key;
        RAISE NOTICE '✅ Dropped UNIQUE constraint on user_id';
    ELSE
        RAISE NOTICE 'ℹ️  UNIQUE constraint on user_id does not exist (already fixed)';
    END IF;
END $$;

-- Step 2: Create a partial unique index on user_id (only when NOT NULL)
-- This ensures that once a user_id is assigned, it can only map to one enrollment
-- But allows multiple enrollments with NULL user_id during enrollment phase
DO $$
BEGIN
    -- Drop existing partial index if it exists (to avoid conflicts)
    DROP INDEX IF EXISTS idx_therapist_enrollments_user_id_unique_not_null;
    
    -- Create partial unique index (only applies when user_id IS NOT NULL)
    CREATE UNIQUE INDEX idx_therapist_enrollments_user_id_unique_not_null 
    ON therapist_enrollments(user_id) 
    WHERE user_id IS NOT NULL;
    
    RAISE NOTICE '✅ Created partial unique index on user_id (NULL values allowed, non-NULL must be unique)';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️  Could not create partial index: %', SQLERRM;
END $$;

-- Step 3: Ensure email UNIQUE constraint exists (this is the primary duplicate prevention)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'therapist_enrollments' 
        AND constraint_name = 'therapist_enrollments_email_key'
    ) THEN
        ALTER TABLE therapist_enrollments ADD CONSTRAINT therapist_enrollments_email_key UNIQUE (email);
        RAISE NOTICE '✅ Added UNIQUE constraint on email';
    ELSE
        RAISE NOTICE '✅ UNIQUE constraint on email already exists';
    END IF;
END $$;

-- Step 4: Verify the table structure and constraints
SELECT 
    'Table Structure' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'therapist_enrollments' 
AND column_name IN ('user_id', 'email', 'full_name', 'status')
ORDER BY ordinal_position;

-- Step 5: Show all constraints on the table
SELECT 
    'Constraints' as check_type,
    constraint_name,
    constraint_type,
    CASE 
        WHEN constraint_type = 'UNIQUE' THEN 'Ensures uniqueness'
        WHEN constraint_type = 'FOREIGN KEY' THEN 'References users(id)'
        WHEN constraint_type = 'CHECK' THEN 'Validates data'
        ELSE constraint_type
    END as description
FROM information_schema.table_constraints 
WHERE table_name = 'therapist_enrollments'
ORDER BY constraint_type, constraint_name;

-- Step 6: Show indexes (including partial unique index)
SELECT 
    'Indexes' as check_type,
    indexname as index_name,
    indexdef as index_definition
FROM pg_indexes 
WHERE tablename = 'therapist_enrollments'
ORDER BY indexname;

-- Step 7: Diagnostic - Count enrollments with NULL user_id (these are in enrollment phase)
SELECT 
    'Diagnostic' as check_type,
    COUNT(*) FILTER (WHERE user_id IS NULL) as enrollments_with_null_user_id,
    COUNT(*) FILTER (WHERE user_id IS NOT NULL) as enrollments_with_user_id,
    COUNT(*) as total_enrollments
FROM therapist_enrollments;

-- Step 8: Success message
SELECT '✅ therapist_enrollments table constraints fixed!' as status,
       'user_id can now be NULL during enrollment, but must be unique once assigned' as note;

