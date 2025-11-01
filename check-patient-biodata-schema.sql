-- Check the current schema of patient_biodata table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'patient_biodata'
ORDER BY ordinal_position;

