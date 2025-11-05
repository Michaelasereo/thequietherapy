-- =====================================================
-- ADD UNIQUE CONSTRAINT FOR EMAIL IN PENDING ENROLLMENTS
-- =====================================================
-- This prevents duplicate pending enrollments for the same email
-- while allowing multiple enrollments if previous ones are approved/rejected

-- Step 1: Check if there are existing duplicate pending enrollments
-- If duplicates exist, we need to clean them up first
DO $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    -- Count duplicate pending enrollments
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT email, COUNT(*) as cnt
        FROM therapist_enrollments
        WHERE status = 'pending'
        GROUP BY email
        HAVING COUNT(*) > 1
    ) duplicates;
    
    IF duplicate_count > 0 THEN
        RAISE NOTICE 'Found % emails with duplicate pending enrollments. Cleaning up...', duplicate_count;
        
        -- Keep only the most recent pending enrollment per email
        DELETE FROM therapist_enrollments
        WHERE id IN (
            SELECT id
            FROM (
                SELECT 
                    id,
                    ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at DESC) as rn
                FROM therapist_enrollments
                WHERE status = 'pending'
            ) ranked
            WHERE rn > 1
        );
        
        RAISE NOTICE 'Cleaned up duplicate pending enrollments';
    ELSE
        RAISE NOTICE 'No duplicate pending enrollments found';
    END IF;
END $$;

-- Step 2: Add unique partial index for pending enrollments
-- This prevents duplicate pending enrollments while allowing multiple enrollments
-- if previous ones are approved or rejected
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_pending_enrollment_email 
ON therapist_enrollments(email) 
WHERE status = 'pending';

-- Step 3: Add a comment explaining the constraint
COMMENT ON INDEX idx_unique_pending_enrollment_email IS 
'Ensures only one pending enrollment per email address. Once approved or rejected, a new enrollment can be created for the same email.';

-- Step 4: Verify the constraint works
DO $$
BEGIN
    -- Test that duplicate pending enrollments are prevented
    RAISE NOTICE 'Unique constraint created successfully';
    RAISE NOTICE 'This constraint will prevent duplicate pending enrollments for the same email';
END $$;

