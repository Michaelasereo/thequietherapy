-- Add gender, marital_status, and age columns to therapist_profiles table
-- This script adds the new fields that therapists can update in their profile

ALTER TABLE therapist_profiles 
ADD COLUMN IF NOT EXISTS gender VARCHAR(50),
ADD COLUMN IF NOT EXISTS marital_status VARCHAR(50),
ADD COLUMN IF NOT EXISTS age VARCHAR(10);

-- Add comments to document the new fields
COMMENT ON COLUMN therapist_profiles.gender IS 'Therapist gender preference for client matching';
COMMENT ON COLUMN therapist_profiles.marital_status IS 'Therapist marital status for client matching';
COMMENT ON COLUMN therapist_profiles.age IS 'Therapist age for client matching';

-- Update existing records to have empty strings instead of null for better UI handling
UPDATE therapist_profiles 
SET gender = '', marital_status = '', age = ''
WHERE gender IS NULL OR marital_status IS NULL OR age IS NULL;
