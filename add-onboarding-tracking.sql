-- =============================================
-- ONBOARDING TRACKING MIGRATION
-- Adds columns to track user onboarding completion
-- Date: October 1, 2025
-- =============================================

-- Add onboarding tracking columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS has_completed_onboarding BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_data JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 1;

-- Add index for faster onboarding status queries
CREATE INDEX IF NOT EXISTS idx_users_onboarding_status 
ON users(has_completed_onboarding) 
WHERE has_completed_onboarding = FALSE;

-- Grandfather existing users (mark them as having completed onboarding)
-- This prevents the modal from showing for existing users
UPDATE users 
SET has_completed_onboarding = TRUE 
WHERE created_at < NOW() - INTERVAL '1 day'
  AND has_completed_onboarding IS FALSE;

-- Add comment to table
COMMENT ON COLUMN users.has_completed_onboarding IS 'Tracks whether user has completed initial onboarding flow';
COMMENT ON COLUMN users.onboarding_data IS 'Stores user responses and preferences from onboarding';
COMMENT ON COLUMN users.onboarding_step IS 'Current step in onboarding process (1-5)';

-- Verify the changes
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'users' 
  AND column_name IN ('has_completed_onboarding', 'onboarding_data', 'onboarding_step');

-- Show count of users by onboarding status
SELECT 
  has_completed_onboarding,
  COUNT(*) as user_count
FROM users
GROUP BY has_completed_onboarding;

-- =============================================
-- MIGRATION COMPLETE
-- =============================================

