-- =============================================
-- ADD SAFEGUARD: Ensure therapist_id is valid
-- =============================================
-- This prevents mismatches by validating therapist_id before creating sessions

-- Option 1: Add a database trigger to validate therapist_id
CREATE OR REPLACE FUNCTION validate_therapist_id_before_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Verify therapist_id exists in users table and is a therapist
  IF NOT EXISTS (
    SELECT 1 
    FROM users 
    WHERE id = NEW.therapist_id 
    AND user_type = 'therapist'
    AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Invalid therapist_id: Therapist not found or not active. therapist_id: %', NEW.therapist_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger (only if not exists)
DROP TRIGGER IF EXISTS check_therapist_id_before_insert ON sessions;
CREATE TRIGGER check_therapist_id_before_insert
  BEFORE INSERT ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION validate_therapist_id_before_insert();

-- Option 2: Add foreign key constraint with additional validation
-- Note: PostgreSQL doesn't allow subqueries in CHECK constraints
-- Instead, we rely on the trigger for validation
-- The foreign key already ensures therapist_id exists in users table

-- Option 3: Enhanced booking function validation
-- Update the create_session_with_credit_deduction function
-- (Add this validation at the start of the function)

