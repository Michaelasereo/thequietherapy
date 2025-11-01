-- Complete patient_biodata schema migration
-- This script adds the missing columns required by the frontend

-- Step 1: Add new columns if they don't exist
ALTER TABLE patient_biodata 
ADD COLUMN IF NOT EXISTS first_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS country VARCHAR(100),
ADD COLUMN IF NOT EXISTS therapist_gender_preference VARCHAR(50),
ADD COLUMN IF NOT EXISTS therapist_specialization_preference VARCHAR(100);

-- Step 2: Populate first_name from name if it exists
UPDATE patient_biodata 
SET first_name = name 
WHERE first_name IS NULL AND name IS NOT NULL;

-- Step 3: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_patient_biodata_user_id ON patient_biodata(user_id);
CREATE INDEX IF NOT EXISTS idx_patient_biodata_email ON patient_biodata(email);
CREATE INDEX IF NOT EXISTS idx_patient_biodata_phone ON patient_biodata(phone);

-- Step 4: DO NOT add NOT NULL constraints - keep columns nullable
-- This allows users to save partial data progressively

-- Step 5: Verify the schema
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'patient_biodata' 
ORDER BY ordinal_position;

