-- Update patient_biodata table to include new fields and remove tribe
-- This script adds the new contact and preference fields needed for the booking flow

-- Add new columns if they don't exist
ALTER TABLE patient_biodata 
ADD COLUMN IF NOT EXISTS first_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS country VARCHAR(100),
ADD COLUMN IF NOT EXISTS therapist_gender_preference VARCHAR(50),
ADD COLUMN IF NOT EXISTS therapist_specialization_preference VARCHAR(100);

-- Update existing records to populate first_name from name if it exists
UPDATE patient_biodata 
SET first_name = name 
WHERE first_name IS NULL AND name IS NOT NULL;

-- Drop the tribe column if it exists (optional - comment out if you want to keep it)
-- ALTER TABLE patient_biodata DROP COLUMN IF EXISTS tribe;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_patient_biodata_user_id ON patient_biodata(user_id);
CREATE INDEX IF NOT EXISTS idx_patient_biodata_email ON patient_biodata(email);
CREATE INDEX IF NOT EXISTS idx_patient_biodata_phone ON patient_biodata(phone);

-- Add constraints
ALTER TABLE patient_biodata 
ALTER COLUMN first_name SET NOT NULL,
ALTER COLUMN email SET NOT NULL,
ALTER COLUMN phone SET NOT NULL,
ALTER COLUMN country SET NOT NULL;

-- Update RLS policies if needed
-- (This assumes RLS is already enabled on the table)

-- Sample data for testing (optional)
-- INSERT INTO patient_biodata (
--   user_id, 
--   first_name, 
--   email, 
--   phone, 
--   country, 
--   age, 
--   sex, 
--   religion, 
--   occupation, 
--   marital_status, 
--   level_of_education, 
--   complaints, 
--   therapist_preference,
--   therapist_gender_preference,
--   therapist_specialization_preference
-- ) VALUES (
--   'test-user-id',
--   'John',
--   'john@example.com',
--   '+234 801 234 5678',
--   'Nigeria',
--   30,
--   'male',
--   'Christianity',
--   'Software Engineer',
--   'single',
--   'bachelor',
--   'Anxiety and stress management',
--   'Prefer female therapist with experience in anxiety',
--   'female',
--   'Anxiety & Stress Management'
-- );
