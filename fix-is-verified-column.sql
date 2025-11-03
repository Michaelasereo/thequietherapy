-- Quick Fix: Add is_verified column to therapist_enrollments
-- Run this in your Supabase SQL Editor immediately

-- Add is_verified column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'therapist_enrollments' 
        AND column_name = 'is_verified'
    ) THEN
        ALTER TABLE therapist_enrollments 
        ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;
        
        RAISE NOTICE '✅ Added is_verified column to therapist_enrollments';
    ELSE
        RAISE NOTICE 'ℹ️  is_verified column already exists';
    END IF;
END $$;

-- Verify the column was added
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'therapist_enrollments' 
AND column_name = 'is_verified';

-- Success message
SELECT '✅ is_verified column fix completed!' as status;
