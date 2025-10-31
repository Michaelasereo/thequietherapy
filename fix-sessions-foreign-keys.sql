-- =============================================
-- FIX SESSIONS TABLE FOREIGN KEY CONSTRAINTS
-- =============================================
-- The sessions.therapist_id should reference users table, not therapists table

-- Step 1 & 2: Diagnostic queries (run manually if needed)
-- Uncomment these to see orphaned sessions before fixing:
/*
SELECT 
    s.id as session_id,
    s.therapist_id,
    s.created_at
FROM sessions s
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = s.therapist_id)
ORDER BY s.created_at DESC
LIMIT 10;
*/

-- Step 1: Update orphaned sessions to map to correct user_ids
DO $$
DECLARE
    fixed_count INTEGER := 0;
    orphaned_record RECORD;
BEGIN
    -- Try to fix orphaned sessions by mapping via therapist_enrollments
    FOR orphaned_record IN 
        SELECT DISTINCT s.id as session_id, s.therapist_id as orphaned_therapist_id
        FROM sessions s
        WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = s.therapist_id)
        AND s.therapist_id IS NOT NULL
    LOOP
        -- Try to find a matching user via therapist_enrollments
        UPDATE sessions s
        SET therapist_id = (
            SELECT u.id 
            FROM users u
            INNER JOIN therapist_enrollments te ON te.email = u.email OR te.user_id = u.id
            WHERE (te.id::text = orphaned_record.orphaned_therapist_id::text 
                   OR te.user_id::text = orphaned_record.orphaned_therapist_id::text)
            AND u.user_type = 'therapist'
            LIMIT 1
        )
        WHERE s.id = orphaned_record.session_id
        AND EXISTS (
            SELECT 1 FROM users u
            INNER JOIN therapist_enrollments te ON te.email = u.email OR te.user_id = u.id
            WHERE (te.id::text = orphaned_record.orphaned_therapist_id::text 
                   OR te.user_id::text = orphaned_record.orphaned_therapist_id::text)
            AND u.user_type = 'therapist'
        );
        
        IF FOUND THEN
            fixed_count := fixed_count + 1;
        END IF;
    END LOOP;
    
    RAISE NOTICE '✅ Fixed % orphaned session(s)', fixed_count;
END $$;

-- Step 2: Delete or null out sessions that still can't be mapped
DO $$
DECLARE
    delete_count INTEGER;
BEGIN
    -- For sessions that can't be mapped, set therapist_id to NULL (or delete them)
    -- Option 1: Delete orphaned sessions (recommended for test data)
    DELETE FROM sessions s
    WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = s.therapist_id)
    AND s.therapist_id IS NOT NULL;
    
    GET DIAGNOSTICS delete_count = ROW_COUNT;
    
    IF delete_count > 0 THEN
        RAISE NOTICE '✅ Deleted % orphaned session(s) that could not be mapped', delete_count;
    ELSE
        RAISE NOTICE '✅ No orphaned sessions to delete';
    END IF;
END $$;

-- Step 3: Drop the incorrect foreign key if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'sessions_therapist_id_fkey'
        AND conrelid = 'sessions'::regclass
    ) THEN
        ALTER TABLE sessions DROP CONSTRAINT sessions_therapist_id_fkey;
        RAISE NOTICE '✅ Dropped incorrect therapist_id foreign key';
    ELSE
        RAISE NOTICE '✅ No existing foreign key to drop';
    END IF;
END $$;

-- Step 4: Add the correct foreign key pointing to users table
DO $$
BEGIN
    -- Verify no orphaned sessions remain
    IF EXISTS (
        SELECT 1 FROM sessions s
        WHERE s.therapist_id IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = s.therapist_id)
    ) THEN
        RAISE EXCEPTION 'Cannot add foreign key: Orphaned sessions still exist. Run steps 1-2 first to fix or delete them.';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'sessions_therapist_id_fkey'
        AND conrelid = 'sessions'::regclass
    ) THEN
        ALTER TABLE sessions
        ADD CONSTRAINT sessions_therapist_id_fkey
        FOREIGN KEY (therapist_id) REFERENCES users(id) ON DELETE CASCADE;
        RAISE NOTICE '✅ Added correct therapist_id foreign key pointing to users';
    ELSE
        RAISE NOTICE '✅ Foreign key already exists';
    END IF;
END $$;

-- Also check user_id foreign key is correct
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'sessions' 
        AND constraint_name = 'sessions_user_id_fkey'
        AND constraint_type = 'FOREIGN KEY'
    ) THEN
        RAISE NOTICE '✅ user_id foreign key already exists';
    ELSE
        -- Add user_id foreign key if missing
        ALTER TABLE sessions
        ADD CONSTRAINT sessions_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        RAISE NOTICE '✅ Added user_id foreign key';
    END IF;
END $$;

-- Verify the fix
SELECT 
    conname as constraint_name,
    conrelid::regclass as table_name,
    confrelid::regclass as references_table,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'sessions'::regclass
AND contype = 'f'
ORDER BY conname;

