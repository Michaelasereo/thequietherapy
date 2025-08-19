-- Fix foreign key constraints for patient data tables
-- Run this in your Supabase SQL Editor

-- Drop existing foreign key constraints
ALTER TABLE IF EXISTS patient_biodata DROP CONSTRAINT IF EXISTS patient_biodata_user_id_fkey;
ALTER TABLE IF EXISTS patient_family_history DROP CONSTRAINT IF EXISTS patient_family_history_user_id_fkey;
ALTER TABLE IF EXISTS patient_social_history DROP CONSTRAINT IF EXISTS patient_social_history_user_id_fkey;
ALTER TABLE IF EXISTS patient_medical_history DROP CONSTRAINT IF EXISTS patient_medical_history_user_id_fkey;
ALTER TABLE IF EXISTS patient_medical_history DROP CONSTRAINT IF EXISTS patient_medical_history_therapist_id_fkey;
ALTER TABLE IF EXISTS patient_drug_history DROP CONSTRAINT IF EXISTS patient_drug_history_user_id_fkey;
ALTER TABLE IF EXISTS patient_drug_history DROP CONSTRAINT IF EXISTS patient_drug_history_therapist_id_fkey;

-- Add new foreign key constraints referencing public.users
ALTER TABLE patient_biodata 
ADD CONSTRAINT patient_biodata_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE patient_family_history 
ADD CONSTRAINT patient_family_history_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE patient_social_history 
ADD CONSTRAINT patient_social_history_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE patient_medical_history 
ADD CONSTRAINT patient_medical_history_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE patient_medical_history 
ADD CONSTRAINT patient_medical_history_therapist_id_fkey 
FOREIGN KEY (therapist_id) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE patient_drug_history 
ADD CONSTRAINT patient_drug_history_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE patient_drug_history 
ADD CONSTRAINT patient_drug_history_therapist_id_fkey 
FOREIGN KEY (therapist_id) REFERENCES public.users(id) ON DELETE SET NULL;

-- Verify the changes
SELECT 
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name IN ('patient_biodata', 'patient_family_history', 'patient_social_history', 'patient_medical_history', 'patient_drug_history')
ORDER BY tc.table_name, tc.constraint_name;
