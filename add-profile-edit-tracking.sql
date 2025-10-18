-- Add profile edit tracking to therapist_enrollments table
-- This allows us to distinguish between enrollment defaults and manually edited fields

-- Add columns for edit tracking
ALTER TABLE therapist_enrollments 
ADD COLUMN IF NOT EXISTS edited_fields JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS original_enrollment_data JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS profile_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create index for faster queries on edited_fields
CREATE INDEX IF NOT EXISTS idx_therapist_enrollments_edited_fields 
ON therapist_enrollments USING gin(edited_fields);

-- Add comment for documentation
COMMENT ON COLUMN therapist_enrollments.edited_fields IS 'Array of field names that have been manually edited after enrollment';
COMMENT ON COLUMN therapist_enrollments.original_enrollment_data IS 'Snapshot of enrollment data before any profile edits';
COMMENT ON COLUMN therapist_enrollments.profile_updated_at IS 'Timestamp of last profile update';

-- Example: Initialize original_enrollment_data for existing enrollments
-- This preserves the current state as the "original" for existing therapists
UPDATE therapist_enrollments
SET original_enrollment_data = jsonb_build_object(
    'full_name', full_name,
    'phone', COALESCE(phone, ''),
    'licensed_qualification', COALESCE(licensed_qualification, ''),
    'bio', COALESCE(bio, ''),
    'specialization', COALESCE(to_jsonb(specialization), '[]'::jsonb),
    'languages', COALESCE(to_jsonb(languages), '[]'::jsonb),
    'gender', COALESCE(gender, ''),
    'age', age,
    'marital_status', COALESCE(marital_status, ''),
    'profile_image_url', COALESCE(profile_image_url, '')
)
WHERE original_enrollment_data IS NULL;

-- Verify the changes
SELECT 
    email,
    full_name,
    edited_fields,
    profile_updated_at,
    (original_enrollment_data IS NOT NULL) as has_original_data
FROM therapist_enrollments
LIMIT 5;

