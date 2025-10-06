-- Fix admin dashboard schema issues
-- Add missing columns to therapist_profiles table

-- Add years_of_experience column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'therapist_profiles' 
        AND column_name = 'years_of_experience'
    ) THEN
        ALTER TABLE therapist_profiles 
        ADD COLUMN years_of_experience INTEGER DEFAULT 0;
    END IF;
END $$;

-- Add other missing columns that might be needed
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'therapist_profiles' 
        AND column_name = 'bio'
    ) THEN
        ALTER TABLE therapist_profiles 
        ADD COLUMN bio TEXT;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'therapist_profiles' 
        AND column_name = 'hourly_rate'
    ) THEN
        ALTER TABLE therapist_profiles 
        ADD COLUMN hourly_rate DECIMAL(10,2) DEFAULT 0.00;
    END IF;
END $$;

-- Update existing therapist profiles with default values
UPDATE therapist_profiles 
SET years_of_experience = 5 
WHERE years_of_experience IS NULL OR years_of_experience = 0;

UPDATE therapist_profiles 
SET bio = 'Professional therapist specializing in mental health support.'
WHERE bio IS NULL OR bio = '';

UPDATE therapist_profiles 
SET hourly_rate = 50.00 
WHERE hourly_rate IS NULL OR hourly_rate = 0.00; 