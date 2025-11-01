-- Fix patient_biodata table to make fields nullable
-- This allows partial updates and progressive form filling

-- Drop the NOT NULL constraints that were incorrectly added
ALTER TABLE patient_biodata 
ALTER COLUMN first_name DROP NOT NULL,
ALTER COLUMN email DROP NOT NULL,
ALTER COLUMN phone DROP NOT NULL,
ALTER COLUMN country DROP NOT NULL;

-- Add default empty strings for better UX
ALTER TABLE patient_biodata 
ALTER COLUMN first_name SET DEFAULT '',
ALTER COLUMN email SET DEFAULT '',
ALTER COLUMN phone SET DEFAULT '',
ALTER COLUMN country SET DEFAULT '';

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'patient_biodata' 
AND column_name IN ('first_name', 'email', 'phone', 'country')
ORDER BY column_name;

