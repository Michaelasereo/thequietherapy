-- Add missing profile fields to therapist_enrollments table
-- Run this in your Supabase SQL Editor

-- Add gender column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'therapist_enrollments' 
                   AND column_name = 'gender') THEN
        ALTER TABLE therapist_enrollments ADD COLUMN gender VARCHAR(20);
    END IF;
END $$;

-- Add age column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'therapist_enrollments' 
                   AND column_name = 'age') THEN
        ALTER TABLE therapist_enrollments ADD COLUMN age INTEGER;
    END IF;
END $$;

-- Add marital_status column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'therapist_enrollments' 
                   AND column_name = 'marital_status') THEN
        ALTER TABLE therapist_enrollments ADD COLUMN marital_status VARCHAR(20);
    END IF;
END $$;

-- Show the current table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'therapist_enrollments'
ORDER BY ordinal_position;