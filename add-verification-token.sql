-- Add verification_token column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token TEXT;

-- Add index for better performance when looking up by verification token
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token);

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'verification_token';
