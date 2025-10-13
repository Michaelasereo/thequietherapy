# 🔍 Diagnose Login/Redirect Error

## Current Status:
- ✅ **Signup API**: Working (200 OK)
- ✅ **Magic Link**: Sent successfully
- ⚠️  **After Magic Link Click**: Error occurring

---

## 🔍 What to Check:

### **1. Check Browser Console (Most Important!)**

When you click the magic link and get redirected back to login:

1. **Open DevTools** (F12 or Right-click → Inspect)
2. **Go to Console tab**
3. **Look for red error messages**
4. **Copy the EXACT error message**

**Common errors:**
- "Invalid session" 
- "Session not found"
- "Cookie not set"
- "Failed to create session"

---

### **2. Check Browser Cookies**

1. **Open DevTools** (F12)
2. **Go to Application tab** (Chrome) or **Storage tab** (Firefox)
3. **Click Cookies** → `https://thequietherapy.live`
4. **Look for:** `quiet_session`

**Expected:**
- Cookie name: `quiet_session`
- Value: Long string (JWT token)
- HttpOnly: ✓
- Secure: ✓ (in production)
- Path: /

**If cookie is missing** → Session creation failed

---

### **3. Check Network Tab**

1. **Open DevTools** (F12)
2. **Go to Network tab**
3. **Click the magic link**
4. **Watch the requests**

**Look for:**
- Request to `/api/auth/verify-magic-link?token=...`
- Status code (should be 302 redirect)
- Final URL (should be `/dashboard`)

**Screenshot the Network tab** if you see errors

---

### **4. Check What URL You're Being Redirected To**

After clicking magic link, check the browser URL bar:

**Expected flow:**
```
1. Click magic link in email
2. Goes to: /api/auth/verify-magic-link?token=xxx&auth_type=individual
3. Redirects to: /dashboard
4. You're logged in ✅
```

**If you see:**
```
1. Click magic link
2. Goes to: /login (back to login page)
3. NOT logged in ❌
```

**Then check URL for error parameter:**
- `/login?error=...` ← Tell me what this error says

---

## 🐛 Common Issues & Solutions:

### **Issue 1: "Session not found" or redirects to login**

**Cause:** Session cookie not being set properly

**Check:**
```bash
# Test the verification endpoint directly
curl -i "https://thequietherapy.live/api/auth/verify-magic-link?token=TEST&auth_type=individual"
```

**Look for:** `Set-Cookie: quiet_session=...` in headers

---

### **Issue 2: Database function missing**

**Error in console:** "function create_or_get_user does not exist"

**Fix:** Run this in Supabase SQL Editor:

```sql
-- Create helper function for user creation
CREATE OR REPLACE FUNCTION create_or_get_user(
  p_email TEXT,
  p_full_name TEXT,
  p_user_type TEXT
) RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Try to get existing user
  SELECT id INTO v_user_id
  FROM users
  WHERE email = p_email;
  
  -- If not exists, create
  IF v_user_id IS NULL THEN
    INSERT INTO users (email, full_name, user_type, is_verified, is_active, credits)
    VALUES (p_email, p_full_name, p_user_type, true, true, 0)
    RETURNING id INTO v_user_id;
  END IF;
  
  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### **Issue 3: "user_sessions" table missing**

**Error:** "relation user_sessions does not exist"

**Fix:** Run in Supabase:

```sql
-- Create user_sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);

-- Enable RLS
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY IF NOT EXISTS "Service role full access" ON user_sessions
  FOR ALL TO service_role USING (true) WITH CHECK (true);
```

---

## 📊 Quick Diagnostic Commands:

### Test signup (already working):
```bash
node test-signup-production.js
```

### Test database connection:
```bash
curl -s https://thequietherapy.live/api/debug/test-signup
```

### Check Netlify function logs:
```
https://app.netlify.com/projects/thequietherapy/logs/functions
```
Look for `/api/auth/verify-magic-link` errors

---

## 🎯 What I Need From You:

**Please tell me:**

1. **What exact error message** do you see? (Browser console)
2. **What URL** are you redirected to? (copy from address bar)
3. **Is the cookie set?** (check DevTools → Application → Cookies)
4. **Screenshot** of any error messages

**With this info, I can fix it immediately!** 🚀

---

## ⚡ Quick Tests You Can Run:

### Test 1: Real Email Signup
```
1. Go to: https://thequietherapy.live/register
2. Enter YOUR real email
3. Check email inbox
4. Click magic link
5. Tell me what happens
```

### Test 2: Check Console
```
1. Press F12 (open DevTools)
2. Go to Console tab
3. Click magic link
4. Copy any red error messages
5. Send them to me
```

---

**Send me the error details and I'll fix it right away!** 🔧

