-- Quick check for test user credits
SELECT 
  u.id,
  u.email,
  u.user_type,
  u.is_verified,
  u.is_active,
  uc.id as credit_id,
  uc.credits_balance,
  uc.credits_used,
  uc.user_type as credit_user_type,
  uc.created_at as credit_created_at
FROM users u
LEFT JOIN user_credits uc ON u.id = uc.user_id
WHERE u.id = '5803b951-f0b4-462c-b1d9-7bab27dfc5f7'
ORDER BY uc.created_at DESC;

-- If no credits exist, create some
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
  )
RETURNING *;

