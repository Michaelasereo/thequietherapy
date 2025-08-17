-- Fix for get_available_auth_types function
-- Run this to fix the data type mismatch error

CREATE OR REPLACE FUNCTION get_available_auth_types(user_email TEXT)
RETURNS TABLE (
    auth_type VARCHAR(50),
    is_verified BOOLEAN,
    is_active BOOLEAN,
    status VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'individual'::VARCHAR(50) as auth_type,
        ia.is_verified,
        ia.is_active,
        'active'::VARCHAR(50) as status,
        ia.created_at
    FROM individual_auth ia
    WHERE ia.email = user_email
    UNION ALL
    SELECT 
        'therapist'::VARCHAR(50) as auth_type,
        ta.is_verified,
        ta.is_active,
        ta.status,
        ta.created_at
    FROM therapist_auth ta
    WHERE ta.email = user_email
    UNION ALL
    SELECT 
        'partner'::VARCHAR(50) as auth_type,
        pa.is_verified,
        pa.is_active,
        'active'::VARCHAR(50) as status,
        pa.created_at
    FROM partner_auth pa
    WHERE pa.email = user_email;
END;
$$ LANGUAGE plpgsql;
