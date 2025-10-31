-- =============================================
-- FIX USER CREDITS FOR TESTING
-- Adds credits to test user if missing
-- =============================================

-- Check current credits status
SELECT 
  u.id,
  u.email,
  u.user_type,
  COALESCE(uc.credits_balance, 0) as current_balance,
  uc.id as credit_record_id
FROM users u
LEFT JOIN LATERAL (
  SELECT * FROM user_credits 
  WHERE user_id = u.id 
    AND user_type IN ('user', 'individual')
  ORDER BY created_at DESC
  LIMIT 1
) uc ON true
WHERE u.id = '5803b951-f0b4-462c-b1d9-7bab27dfc5f7';

-- Add credits if missing or low
INSERT INTO user_credits (
  user_id,
  user_type,
  credits_balance,
  credits_used,
  created_at,
  updated_at
)
SELECT 
  u.id,
  u.user_type,
  10, -- Give 10 credits for testing
  0,
  NOW(),
  NOW()
FROM users u
WHERE u.id = '5803b951-f0b4-462c-b1d9-7bab27dfc5f7'
  AND u.user_type IN ('user', 'individual')
  AND NOT EXISTS (
    SELECT 1 FROM user_credits uc 
    WHERE uc.user_id = u.id 
    AND uc.user_type IN ('user', 'individual')
    AND uc.credits_balance > 0
  )
RETURNING 
  id,
  user_id,
  credits_balance,
  credits_used,
  created_at;

-- Verify credits were added
SELECT 
  u.email,
  uc.credits_balance,
  uc.credits_used,
  uc.created_at
FROM users u
JOIN user_credits uc ON u.id = uc.user_id
WHERE u.id = '5803b951-f0b4-462c-b1d9-7bab27dfc5f7'
  AND uc.user_type IN ('user', 'individual')
ORDER BY uc.created_at DESC
LIMIT 1;

