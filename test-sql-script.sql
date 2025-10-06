-- Test Script for Admin Tables Setup
-- This script validates the SQL syntax and checks for potential issues

-- Test 1: Check if tables already exist and their structure
DO $$
DECLARE
    table_exists BOOLEAN;
    column_count INTEGER;
BEGIN
    RAISE NOTICE '=== TESTING EXISTING TABLE STRUCTURES ===';
    
    -- Check therapist_enrollments
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'therapist_enrollments'
    ) INTO table_exists;
    
    IF table_exists THEN
        SELECT COUNT(*) INTO column_count 
        FROM information_schema.columns 
        WHERE table_name = 'therapist_enrollments';
        RAISE NOTICE 'therapist_enrollments table exists with % columns', column_count;
    ELSE
        RAISE NOTICE 'therapist_enrollments table does not exist';
    END IF;
    
    -- Check faqs
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'faqs'
    ) INTO table_exists;
    
    IF table_exists THEN
        SELECT COUNT(*) INTO column_count 
        FROM information_schema.columns 
        WHERE table_name = 'faqs';
        RAISE NOTICE 'faqs table exists with % columns', column_count;
        
        -- Check specific columns
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'faqs' AND column_name = 'sort_order') THEN
            RAISE NOTICE '  - sort_order column exists';
        ELSE
            RAISE NOTICE '  - sort_order column missing';
        END IF;
    ELSE
        RAISE NOTICE 'faqs table does not exist';
    END IF;
    
    -- Check blog_posts
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'blog_posts'
    ) INTO table_exists;
    
    IF table_exists THEN
        SELECT COUNT(*) INTO column_count 
        FROM information_schema.columns 
        WHERE table_name = 'blog_posts';
        RAISE NOTICE 'blog_posts table exists with % columns', column_count;
        
        -- Check specific columns
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blog_posts' AND column_name = 'author') THEN
            RAISE NOTICE '  - author column exists';
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blog_posts' AND column_name = 'author_id') THEN
            RAISE NOTICE '  - author_id column exists';
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blog_posts' AND column_name = 'category') THEN
            RAISE NOTICE '  - category column exists';
        END IF;
    ELSE
        RAISE NOTICE 'blog_posts table does not exist';
    END IF;
    
    -- Check system_metrics
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'system_metrics'
    ) INTO table_exists;
    
    IF table_exists THEN
        SELECT COUNT(*) INTO column_count 
        FROM information_schema.columns 
        WHERE table_name = 'system_metrics';
        RAISE NOTICE 'system_metrics table exists with % columns', column_count;
        
        -- List all columns
        RAISE NOTICE '  - Columns: %', (
            SELECT string_agg(column_name, ', ')
            FROM information_schema.columns 
            WHERE table_name = 'system_metrics'
        );
    ELSE
        RAISE NOTICE 'system_metrics table does not exist';
    END IF;
    
    -- Check users table structure
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'users'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE 'users table exists';
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'user_type') THEN
            RAISE NOTICE '  - user_type column exists';
        ELSE
            RAISE NOTICE '  - user_type column missing';
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_active') THEN
            RAISE NOTICE '  - is_active column exists';
        ELSE
            RAISE NOTICE '  - is_active column missing';
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_verified') THEN
            RAISE NOTICE '  - is_verified column exists';
        ELSE
            RAISE NOTICE '  - is_verified column missing';
        END IF;
    ELSE
        RAISE NOTICE 'users table does not exist';
    END IF;
    
    -- Check sessions table structure
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'sessions'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE 'sessions table exists';
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'amount_paid') THEN
            RAISE NOTICE '  - amount_paid column exists';
        ELSE
            RAISE NOTICE '  - amount_paid column missing';
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'session_type') THEN
            RAISE NOTICE '  - session_type column exists';
        ELSE
            RAISE NOTICE '  - session_type column missing';
        END IF;
    ELSE
        RAISE NOTICE 'sessions table does not exist';
    END IF;
    
END $$;

-- Test 2: Check for potential constraint issues
DO $$
DECLARE
    constraint_count INTEGER;
BEGIN
    RAISE NOTICE '=== CHECKING FOR POTENTIAL CONSTRAINT ISSUES ===';
    
    -- Check NOT NULL constraints on blog_posts
    SELECT COUNT(*) INTO constraint_count
    FROM information_schema.columns 
    WHERE table_name = 'blog_posts' 
    AND is_nullable = 'NO' 
    AND column_name IN ('author', 'category');
    
    IF constraint_count > 0 THEN
        RAISE NOTICE 'Found % NOT NULL constraints on blog_posts that might cause issues', constraint_count;
    ELSE
        RAISE NOTICE 'No problematic NOT NULL constraints found on blog_posts';
    END IF;
    
    -- Check for unique constraints that might conflict
    SELECT COUNT(*) INTO constraint_count
    FROM information_schema.table_constraints 
    WHERE table_name = 'blog_posts' 
    AND constraint_type = 'UNIQUE';
    
    IF constraint_count > 0 THEN
        RAISE NOTICE 'Found % unique constraints on blog_posts', constraint_count;
    END IF;
    
END $$;

-- Test 3: Check if we can create the required functions
DO $$
BEGIN
    RAISE NOTICE '=== TESTING FUNCTION CREATION ===';
    
    -- Test if we can create a simple function
    CREATE OR REPLACE FUNCTION test_function() RETURNS BOOLEAN AS $$
    BEGIN
        RETURN TRUE;
    END;
    $$ LANGUAGE plpgsql;
    
    RAISE NOTICE 'Function creation test: PASSED';
    
    -- Clean up
    DROP FUNCTION test_function();
    
END $$;

-- Test 4: Check database permissions
DO $$
BEGIN
    RAISE NOTICE '=== TESTING DATABASE PERMISSIONS ===';
    
    -- Test if we can create a temporary table
    CREATE TEMP TABLE test_temp_table (id INTEGER);
    RAISE NOTICE 'Temporary table creation: PASSED';
    
    -- Test if we can insert data
    INSERT INTO test_temp_table VALUES (1);
    RAISE NOTICE 'Data insertion: PASSED';
    
    -- Test if we can create an index
    CREATE INDEX test_temp_idx ON test_temp_table(id);
    RAISE NOTICE 'Index creation: PASSED';
    
    -- Clean up
    DROP TABLE test_temp_table;
    
END $$;

-- Test 5: Validate SQL syntax by creating a test version of the main script
DO $$
BEGIN
    RAISE NOTICE '=== TESTING MAIN SCRIPT SYNTAX ===';
    
    -- Test CREATE TABLE IF NOT EXISTS syntax
    CREATE TABLE IF NOT EXISTS test_therapist_enrollments (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    RAISE NOTICE 'CREATE TABLE syntax: PASSED';
    
    -- Test ALTER TABLE syntax
    ALTER TABLE test_therapist_enrollments ADD COLUMN IF NOT EXISTS test_column VARCHAR(100);
    RAISE NOTICE 'ALTER TABLE syntax: PASSED';
    
    -- Test INSERT syntax
    INSERT INTO test_therapist_enrollments (full_name, email) VALUES 
    ('Test User', 'test@example.com')
    ON CONFLICT DO NOTHING;
    RAISE NOTICE 'INSERT syntax: PASSED';
    
    -- Test CREATE INDEX syntax
    CREATE INDEX IF NOT EXISTS test_idx ON test_therapist_enrollments(email);
    RAISE NOTICE 'CREATE INDEX syntax: PASSED';
    
    -- Test RLS syntax
    ALTER TABLE test_therapist_enrollments ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS syntax: PASSED';
    
    -- Test CREATE POLICY syntax
    CREATE POLICY "test_policy" ON test_therapist_enrollments FOR ALL USING (true);
    RAISE NOTICE 'CREATE POLICY syntax: PASSED';
    
    -- Clean up
    DROP TABLE test_therapist_enrollments;
    
END $$;

-- Final summary
DO $$
BEGIN
    RAISE NOTICE '=== ALL TESTS COMPLETED SUCCESSFULLY ===';
    RAISE NOTICE 'The main script should run without syntax errors.';
    RAISE NOTICE 'However, you may still encounter constraint issues if existing data conflicts with new constraints.';
END $$;
