# 🔑 Quick Login Credentials for Testing

## 🎯 Primary Test Accounts (Quick Setup)

Based on your system, here are the test accounts:

### Therapist Account:
```
Email: quicktest-therapist@test.com
OR: test.therapist@trpi.com
Password: (use magic link)
Type: Therapist
```

### Patient/User Account:
```
Email: quicktest-patient@test.com
OR: test.user@trpi.com  
Password: (use magic link)
Type: Individual
Credits: 20 credits
```

---

## 🚀 FASTEST WAY TO TEST NOW

### Option 1: Use Existing Accounts (Quickest)

**Therapist:**
1. Go to: `http://localhost:3000/therapist/login`
2. Enter: `quicktest-therapist@test.com`
3. Click "Send Magic Link"
4. Check terminal for magic link (if email not configured)
5. Click link to login

**Patient:**
1. Open second browser window
2. Go to: `http://localhost:3000/login`
3. Enter: `quicktest-patient@test.com`
4. Click "Send Magic Link"
5. Click link to login

### Option 2: Create New Test Accounts

If those don't exist, run this in Supabase SQL Editor:

```sql
-- Create therapist
INSERT INTO users (id, email, user_type, email_verified, is_verified, is_active)
VALUES (gen_random_uuid(), 'test-therapist@trpi.com', 'therapist', true, true, true)
ON CONFLICT (email) DO UPDATE SET user_type = 'therapist';

-- Create user with credits  
INSERT INTO users (id, email, user_type, email_verified, is_verified, is_active, credits)
VALUES (gen_random_uuid(), 'test-user@trpi.com', 'individual', true, true, true, 20)
ON CONFLICT (email) DO UPDATE SET credits = 20;
```

---

## 🧪 Alternative Test Accounts

From your test-credentials.md:

### Admin:
```
Email: asereopeyemimichael@gmail.com
Type: Admin
```

### Therapist:
```
Email: test-therapist@example.com
Type: Therapist
```

### User:
```
Email: test-individual@example.com
Type: Individual
```

### Another User:
```
Email: michaelasereo@gmail.com
Type: Individual
```

---

## 📋 Check What's Currently in Database

Run this SQL to see all test users:

```sql
SELECT email, user_type, is_verified, is_active, credits
FROM users 
WHERE email LIKE '%test%' OR email LIKE '%quicktest%'
ORDER BY user_type, email;
```

---

## ⚡ Quick Start Testing

1. **Login as Therapist:**
   - URL: http://localhost:3000/therapist/login
   - Email: Any therapist email above

2. **Login as User:** (in separate browser)
   - URL: http://localhost:3000/login  
   - Email: Any user email above

3. **Start Session Test**
   - Follow `test-therapy-session-flow.md`

---

## 🔍 Check Who's Logged In

From your terminal output:
- `GET /api/therapist/profile?t=1761780900269 401` - NOT logged in yet
- `GET /api/therapist/dashboard-data 401` - NOT logged in yet

**Current Status**: No one is logged in yet - API returning 401 (Unauthorized)

---

## ✅ Next Steps

1. **Pick one therapist email** from above
2. **Pick one user email** from above  
3. **Login to both** using magic link authentication
4. **Follow the test guide** in `test-therapy-session-flow.md`

**Ready to test!** 🚀

