# Development Rate Limit Fix

## 🚨 Current Issue
**Supabase Email Rate Limit Exceeded**
```
Error [AuthApiError]: email rate limit exceeded
code: 'over_email_send_rate_limit'
status: 429
```

## 🔧 Solutions

### Option 1: Wait for Rate Limit Reset (Recommended)
- **Duration**: Usually 1 hour
- **Action**: Wait and try again later
- **Best for**: Production testing

### Option 2: Use Different Email Addresses
- **Strategy**: Use unique email addresses for each test
- **Example**: 
  - `test1@example.com`
  - `test2@example.com`
  - `test3@example.com`

### Option 3: Use Supabase Dashboard to Reset
1. **Go to**: Supabase Dashboard → Authentication → Users
2. **Delete test users** that were created
3. **Clear rate limit cache**

### Option 4: Use Development Email (If Available)
- **Configure**: Supabase to use development email service
- **Benefit**: No rate limits in development

## 🧪 Testing Strategy

### Immediate Testing (No Rate Limit)
```bash
# Test with unique emails
curl -X POST http://localhost:3000/api/auth/send-magic-link \
  -H "Content-Type: application/json" \
  -d '{"email":"test1@example.com","user_type":"individual","type":"login"}'

curl -X POST http://localhost:3000/api/auth/send-magic-link \
  -H "Content-Type: application/json" \
  -d '{"email":"test2@example.com","user_type":"therapist","type":"login"}'
```

### Manual Testing Steps
1. **Open**: `http://localhost:3000/login?user_type=individual`
2. **Use unique email**: `test.individual.$(date +%s)@example.com`
3. **Click**: "Send Magic Link"
4. **Check**: Should work without rate limit

## 📋 Rate Limit Information

### Supabase Rate Limits
- **Free Tier**: 3 emails per hour per email address
- **Pro Tier**: Higher limits
- **Reset Time**: Usually 1 hour

### Best Practices
1. **Use unique emails** for each test
2. **Wait between tests** (5-10 minutes)
3. **Clear test data** regularly
4. **Use development environment** for testing

## 🎯 Quick Fix Commands

### Test with Unique Emails
```bash
# Individual user
curl -X POST http://localhost:3000/api/auth/send-magic-link \
  -H "Content-Type: application/json" \
  -d '{"email":"individual.test.$(date +%s)@example.com","user_type":"individual","type":"login"}'

# Therapist user
curl -X POST http://localhost:3000/api/auth/send-magic-link \
  -H "Content-Type: application/json" \
  -d '{"email":"therapist.test.$(date +%s)@example.com","user_type":"therapist","type":"login"}'
```

### Check Rate Limit Status
```bash
# Test if rate limit is still active
curl -X POST http://localhost:3000/api/auth/send-magic-link \
  -H "Content-Type: application/json" \
  -d '{"email":"ratelimit.test@example.com","user_type":"individual","type":"login"}'
```

## 🔄 Alternative Testing Methods

### 1. Use Different Email Domains
- `test@gmail.com`
- `test@yahoo.com`
- `test@outlook.com`

### 2. Use Email Aliases
- `test+1@example.com`
- `test+2@example.com`
- `test+3@example.com`

### 3. Wait and Retry
- Wait 1 hour
- Try again with same email
- Rate limit should be reset

## 📊 Current Status

| Issue | Status | Solution |
|-------|--------|----------|
| Port 3000 | ✅ Fixed | Server running on correct port |
| Rate Limit | ⚠️ Active | Use unique emails or wait |
| Magic Links | ✅ Working | Once rate limit clears |
| Dashboard | ✅ Working | All routes accessible |

---

**Next Action**: Use unique email addresses for testing or wait 1 hour for rate limit reset.
