-- ======================================================
-- REPAIR THERAPIST RELATIONSHIPS AND ENFORCE NOT NULL FK
-- ======================================================

-- 1) Diagnostic: Check for unmatched records BEFORE fixing
DO $$
DECLARE
    unmatched_count INTEGER;
    unmatched_emails TEXT[];
BEGIN
    SELECT COUNT(*), array_agg(DISTINCT email) INTO unmatched_count, unmatched_emails
    FROM therapist_enrollments
    WHERE user_id IS NULL;
    
    IF unmatched_count > 0 THEN
        RAISE NOTICE 'Found % therapist_enrollments with NULL user_id', unmatched_count;
        RAISE NOTICE 'Unmatched emails: %', array_to_string(unmatched_emails, ', ');
    END IF;
END $$;

-- 1a) First attempt: Match by email with user_type = 'therapist'
UPDATE therapist_enrollments te
SET user_id = u.id,
    updated_at = NOW()
FROM users u
WHERE te.email = u.email
  AND te.user_id IS NULL
  AND u.user_type = 'therapist';

-- 1b) Second attempt: Match by email (case-insensitive) with any user_type
-- This catches therapists that might not have user_type set correctly
UPDATE therapist_enrollments te
SET user_id = u.id,
    updated_at = NOW()
FROM users u
WHERE LOWER(te.email) = LOWER(u.email)
  AND te.user_id IS NULL;

-- 1c) Diagnostic: Report what's still unmatched
DO $$
DECLARE
    still_unmatched INTEGER;
    still_unmatched_emails TEXT[];
BEGIN
    SELECT COUNT(*), array_agg(DISTINCT email) INTO still_unmatched, still_unmatched_emails
    FROM therapist_enrollments
    WHERE user_id IS NULL;
    
    IF still_unmatched > 0 THEN
        RAISE WARNING 'Still have % unmatched therapist_enrollments after matching attempts', still_unmatched;
        RAISE WARNING 'Still unmatched emails: %', array_to_string(still_unmatched_emails, ', ');
        RAISE NOTICE 'These records will NOT have NOT NULL enforced. Review and fix manually.';
    ELSE
        RAISE NOTICE '✅ All therapist_enrollments successfully linked to users';
    END IF;
END $$;

-- 2) Optionally ensure therapist_profiles exists for every therapist user
-- Note: therapist_profiles uses user_id (not therapist_id) as the foreign key
INSERT INTO therapist_profiles (
    user_id,
    verification_status,
    is_verified,
    created_at,
    updated_at
)
SELECT 
    u.id AS user_id,
    COALESCE(tp_existing.verification_status, 'approved') AS verification_status,
    COALESCE(tp_existing.is_verified, true) AS is_verified,
    NOW(),
    NOW()
FROM users u
LEFT JOIN therapist_profiles tp_existing ON tp_existing.user_id = u.id
WHERE u.user_type = 'therapist'
  AND tp_existing.user_id IS NULL;

-- 3) Enforce NOT NULL on therapist_enrollments.user_id (only if all records were matched)
DO $$
DECLARE
    has_nulls BOOLEAN;
BEGIN
    -- Check if column is nullable
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'therapist_enrollments'
          AND column_name = 'user_id'
          AND is_nullable = 'YES'
    ) THEN
        -- Check if there are still NULLs
        SELECT EXISTS(SELECT 1 FROM therapist_enrollments WHERE user_id IS NULL) INTO has_nulls;
        
        IF has_nulls THEN
            RAISE WARNING 'Cannot enforce NOT NULL: therapist_enrollments.user_id still contains NULLs';
            RAISE NOTICE 'Please review unmatched records and fix them manually, then re-run this script.';
            RAISE NOTICE 'To find unmatched records, run: SELECT * FROM therapist_enrollments WHERE user_id IS NULL;';
        ELSE
            -- All records matched, safe to enforce NOT NULL
            ALTER TABLE therapist_enrollments 
            ALTER COLUMN user_id SET NOT NULL;
            RAISE NOTICE '✅ Successfully enforced NOT NULL constraint on therapist_enrollments.user_id';
        END IF;
    ELSE
        RAISE NOTICE '✅ therapist_enrollments.user_id already has NOT NULL constraint';
    END IF;
END $$;

-- 4) (Optional) Add FK constraint if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'therapist_enrollments' 
          AND constraint_type = 'FOREIGN KEY'
          AND constraint_name = 'therapist_enrollments_user_id_fkey'
    ) THEN
        ALTER TABLE therapist_enrollments
        ADD CONSTRAINT therapist_enrollments_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE;
    END IF;
END $$;

-- 5) Diagnostic: Check what's still unmatched (run this if step 3 showed warnings)
-- Uncomment and run these to investigate unmatched records:
/*
SELECT 
    te.id,
    te.email,
    te.status,
    te.created_at,
    CASE 
        WHEN EXISTS (SELECT 1 FROM users u WHERE u.email = te.email) THEN 'User exists but user_type != therapist'
        WHEN EXISTS (SELECT 1 FROM users u WHERE LOWER(u.email) = LOWER(te.email)) THEN 'User exists (case mismatch)'
        ELSE 'No user found with this email'
    END AS reason_unmatched
FROM therapist_enrollments te
WHERE te.user_id IS NULL;
*/

-- 5b) Quick verification queries (commented)
-- SELECT COUNT(*) AS orphaned_therapists FROM therapist_enrollments WHERE user_id IS NULL;
-- SELECT COUNT(*) AS missing_profiles FROM users u 
--   WHERE u.user_type = 'therapist' 
--   AND NOT EXISTS (SELECT 1 FROM therapist_profiles tp WHERE tp.user_id = u.id);


