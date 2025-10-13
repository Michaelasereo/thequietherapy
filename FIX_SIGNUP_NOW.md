# 🚨 FIX SIGNUP ERRORS NOW - 5 Minutes

## The Problem
Users getting **401** and **500** errors when signing up because:
1. Missing `BREVO_API_KEY` in Netlify (for sending verification emails)
2. Missing database tables (`audit_logs`)

---

## ⚡ FASTEST FIX (2 minutes)

### Step 1: Add Brevo API Key to Netlify

1. **Get your Brevo API Key:**
   - Login to: https://app.brevo.com/
   - Go to: https://app.brevo.com/settings/keys/api
   - Copy your API key

2. **Add to Netlify:**
   - Go to: https://app.netlify.com/sites/thequietherapy/settings/deploys#environment
   - Click "Add a variable"
   - Name: `BREVO_API_KEY`
   - Value: `your-api-key-here`
   - Click "Save"

3. **Redeploy:**
   - Scroll down and click "Trigger deploy" → "Deploy site"
   - Wait 3-4 minutes

**✅ This should fix the 500 error!**

---

## 🔧 Step 2: Create Missing Database Table (1 minute)

Run this in Supabase SQL Editor:

```sql
-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
```

**✅ This prevents logging errors!**

---

## 🎯 Step 3: Verify Environment Variables

Make sure these are set in Netlify:

**Go to:** https://app.netlify.com/sites/thequietherapy/settings/deploys#environment

**Check for:**
- ✅ `BREVO_API_KEY` - Your Brevo API key
- ✅ `NEXT_PUBLIC_APP_URL` - https://thequietherapy.live
- ✅ `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase URL
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service key
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key

---

## 📊 Test After Fix

1. **Wait for Netlify deployment** (check: https://app.netlify.com/sites/thequietherapy/deploys)

2. **Test signup:**
   - Open incognito: https://thequietherapy.live/register
   - Enter test email
   - Should see: "Verification link sent!"
   - No 401/500 errors

3. **Check email:**
   - Should receive verification email
   - Click link to verify

---

## 🚨 If Still Getting Errors

### Check Netlify Logs:
1. Go to: https://app.netlify.com/sites/thequietherapy/logs/functions
2. Look for recent errors
3. Check if `BREVO_API_KEY` is being used

### Alternative: Use Direct Signup (Bypass Email)

If you need users signed up IMMEDIATELY, use this workaround:

**Create users directly in Supabase:**
```sql
INSERT INTO users (email, full_name, user_type, is_verified, is_active, credits)
VALUES 
  ('user@example.com', 'User Name', 'individual', true, true, 0);
```

Then have them login at: https://thequietherapy.live/login

---

## ✅ Success Checklist

After fixing, you should see:
- [ ] No 401 errors
- [ ] No 500 errors on `/api/auth/send-magic-link`
- [ ] Users receive verification emails
- [ ] Users can complete signup
- [ ] Users can login after verification

---

## 📞 Quick Links

- **Netlify Dashboard:** https://app.netlify.com/sites/thequietherapy
- **Netlify Env Vars:** https://app.netlify.com/sites/thequietherapy/settings/deploys#environment
- **Brevo API Keys:** https://app.brevo.com/settings/keys/api
- **Supabase Dashboard:** https://app.supabase.com/project/_/editor

---

## 💡 What Changed

I just pushed a fix that:
- ✅ Added `audit-logger.ts` with graceful error handling
- ✅ Fixed TypeScript interface for video sessions
- ✅ Added comprehensive error documentation

Netlify is auto-deploying now (ETA: 3-4 minutes)

---

## 🎉 Done!

Once you:
1. Add `BREVO_API_KEY` to Netlify ✓
2. Run the SQL script in Supabase ✓
3. Wait for deployment ✓

**Your signup will work!** 🚀

---

**Need help? Check the full guide:** `PRODUCTION_FIX_SIGNUP_ERROR.md`

