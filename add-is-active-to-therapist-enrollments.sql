-- Add is_active column to therapist_enrollments table
ALTER TABLE therapist_enrollments ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false;

-- Update existing records to have is_active = false by default
UPDATE therapist_enrollments SET is_active = false WHERE is_active IS NULL;

-- Add comment to document the column
COMMENT ON COLUMN therapist_enrollments.is_active IS 'Controls whether the therapist is active and visible to clients for booking';
