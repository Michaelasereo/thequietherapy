-- Activate the therapist account
UPDATE users 
SET is_active = true
WHERE email = 'ceo@thequietherapy.live' 
AND user_type = 'therapist';

-- Verify the update
SELECT id, email, user_type, is_active, is_verified
FROM users
WHERE email = 'ceo@thequietherapy.live';

