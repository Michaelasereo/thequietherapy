-- Fix therapist_enrollments table by adding missing columns
-- Run this in your Supabase SQL editor

-- Add mdcn_code column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'therapist_enrollments' 
                   AND column_name = 'mdcn_code') THEN
        ALTER TABLE therapist_enrollments ADD COLUMN mdcn_code TEXT;
    END IF;
END $$;

-- Add specialization column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'therapist_enrollments' 
                   AND column_name = 'specialization') THEN
        ALTER TABLE therapist_enrollments ADD COLUMN specialization TEXT[];
    END IF;
END $$;

-- Add languages column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'therapist_enrollments' 
                   AND column_name = 'languages') THEN
        ALTER TABLE therapist_enrollments ADD COLUMN languages TEXT[];
    END IF;
END $$;

-- Add status column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'therapist_enrollments' 
                   AND column_name = 'status') THEN
        ALTER TABLE therapist_enrollments ADD COLUMN status TEXT DEFAULT 'pending';
    END IF;
END $$;

-- Show the current table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'therapist_enrollments'
ORDER BY ordinal_position;
