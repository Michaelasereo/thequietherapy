-- Fix therapist_enrollments table constraints
-- This removes the UNIQUE constraint on user_id since it's NULL during enrollment

-- Drop the UNIQUE constraint on user_id if it exists
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

-- Verify the table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'therapist_enrollments' 
AND column_name IN ('user_id', 'email', 'full_name', 'status')
ORDER BY ordinal_position;

-- Show success message
SELECT '✅ therapist_enrollments table constraints fixed - user_id can now be NULL during enrollment!' as status;

