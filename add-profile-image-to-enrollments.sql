-- Add profile_image_url column to therapist_enrollments table
ALTER TABLE therapist_enrollments 
ADD COLUMN IF NOT EXISTS profile_image_url TEXT;

-- Add comment
COMMENT ON COLUMN therapist_enrollments.profile_image_url IS 'URL to the therapist profile image stored in Supabase storage';
