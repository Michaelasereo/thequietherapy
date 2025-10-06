-- Add Missing Columns to Therapist Tables
-- Run this in your Supabase SQL Editor

-- Add missing columns to therapist_enrollments table
ALTER TABLE therapist_enrollments ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE therapist_enrollments ADD COLUMN IF NOT EXISTS license_document TEXT;
ALTER TABLE therapist_enrollments ADD COLUMN IF NOT EXISTS license_uploaded_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE therapist_enrollments ADD COLUMN IF NOT EXISTS license_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE therapist_enrollments ADD COLUMN IF NOT EXISTS id_document TEXT;
ALTER TABLE therapist_enrollments ADD COLUMN IF NOT EXISTS id_uploaded_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE therapist_enrollments ADD COLUMN IF NOT EXISTS id_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE therapist_enrollments ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE therapist_enrollments ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

-- Add unique constraint on user_id if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'therapist_enrollments_user_id_key' 
        AND table_name = 'therapist_enrollments'
    ) THEN
        ALTER TABLE therapist_enrollments ADD CONSTRAINT therapist_enrollments_user_id_key UNIQUE (user_id);
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_therapist_enrollments_user_id ON therapist_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_therapist_enrollments_license_verified ON therapist_enrollments(license_verified);
CREATE INDEX IF NOT EXISTS idx_therapist_enrollments_id_verified ON therapist_enrollments(id_verified);

-- Verify the changes
SELECT 'therapist_enrollments' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'therapist_enrollments' 
ORDER BY ordinal_position;

-- Show success message
SELECT 'Missing columns have been added successfully!' as status;
