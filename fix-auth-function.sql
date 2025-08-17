-- Fix Auth Function
-- Create the missing get_available_auth_types function

-- Drop existing function first (if it exists)
DROP FUNCTION IF EXISTS get_available_auth_types(TEXT);

-- Create function to get available auth types for a user
CREATE OR REPLACE FUNCTION get_available_auth_types(user_email TEXT)
RETURNS TABLE(auth_type TEXT) AS $$
BEGIN
  -- Return the user_type from the users table as the available auth type
  RETURN QUERY 
  SELECT u.user_type::TEXT
  FROM users u
  WHERE u.email = user_email;
END;
$$ LANGUAGE plpgsql;

-- Test the function
SELECT * FROM get_available_auth_types('michaelasereo@gmail.com');

-- Alternative: Create a simpler function that just checks if user exists and has correct type
CREATE OR REPLACE FUNCTION check_user_auth_type(user_email TEXT, required_auth_type TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_auth_type TEXT;
BEGIN
  SELECT user_type INTO user_auth_type
  FROM users
  WHERE email = user_email;
  
  RETURN user_auth_type = required_auth_type;
END;
$$ LANGUAGE plpgsql;

-- Test the check function
SELECT check_user_auth_type('michaelasereo@gmail.com', 'therapist') as has_therapist_access;
