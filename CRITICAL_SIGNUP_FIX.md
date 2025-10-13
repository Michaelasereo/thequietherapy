# 🚨 CRITICAL: Fix Signup Now

## Current Status
- ✅ Deployed successfully to: https://thequietherapy.live
- ❌ Signup broken: **500 Error - "Error checking user account"**
- 📊 Test Result: **FAILED**

---

## 🔍 The Problem

The error message is: **"Error checking user account"**

This means the `/api/auth/send-magic-link` endpoint can't query the database.

**Likely causes:**
1. Missing `SUPABASE_SERVICE_ROLE_KEY` in Netlify
2. `audit_logs` table doesn't exist
3. RLS policies blocking access

---

## ⚡ STEP-BY-STEP FIX (10 minutes)

### **Step 1: Verify Netlify Environment Variables**

**Go to:** https://app.netlify.com/sites/thequietherapy/settings/env

**Required variables (check if ALL are set):**

```bash
✅ NEXT_PUBLIC_SUPABASE_URL
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY  
✅ SUPABASE_SERVICE_ROLE_KEY      ← MOST IMPORTANT
✅ NEXT_PUBLIC_APP_URL
✅ BREVO_API_KEY                  ← For email sending
```

**If SUPABASE_SERVICE_ROLE_KEY is missing:**
1. Go to Supabase Dashboard: https://app.supabase.com/
2. Project Settings → API
3. Copy "service_role" key (secret!)
4. Add to Netlify as `SUPABASE_SERVICE_ROLE_KEY`
5. Click "Save"

---

### **Step 2: Create `audit_logs` Table**

**Go to:** https://app.supabase.com/project/_/sql/new

**Copy and run this SQL:**

```sql
-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY IF NOT EXISTS "Service role full access to audit_logs"
  ON audit_logs FOR ALL TO service_role
  USING (true) WITH CHECK (true);
```

Click **"RUN"** button

**Expected:** "Success. No rows returned"

---

### **Step 3: Verify Database Connection**

Run this in Supabase SQL Editor to test:

```sql
-- Test that service role can query users table
SELECT COUNT(*) as user_count FROM users;

-- Test that audit_logs table exists and is accessible
SELECT COUNT(*) as audit_count FROM audit_logs;

-- Check if magic_links table exists
SELECT COUNT(*) as magic_links_count FROM magic_links;
```

**All 3 queries should work**

---

### **Step 4: Redeploy After Adding Variables**

**If you added/changed any environment variables:**

1. Go to: https://app.netlify.com/sites/thequietherapy/deploys
2. Click **"Trigger deploy"** → **"Deploy site"**
3. Wait 2-3 minutes

---

### **Step 5: Test Again**

Run the test script:

```bash
node test-signup-production.js
```

**Expected result:**
```
✅ SUCCESS! Signup is working!
✓ Status: 200 OK
✓ Magic link creation: SUCCESS
🎉 Your signup flow is LIVE and working!
```

---

## 🔍 Alternative: Check Netlify Function Logs

**Go to:** https://app.netlify.com/projects/thequietherapy/logs/functions

Look for recent `/api/auth/send-magic-link` errors. You should see the exact error message.

---

## 📋 Quick Checklist

- [ ] `SUPABASE_SERVICE_ROLE_KEY` is set in Netlify
- [ ] `BREVO_API_KEY` is set in Netlify  
- [ ] `audit_logs` table exists in Supabase
- [ ] `magic_links` table exists in Supabase
- [ ] Redeployed after adding variables
- [ ] Test passes

---

## 🎯 Most Likely Issue

**Missing SUPABASE_SERVICE_ROLE_KEY in Netlify**

The code needs the service role key to bypass RLS policies and check if users exist.

**Fix:**
1. Get service_role key from Supabase
2. Add to Netlify environment variables
3. Redeploy
4. Test again

---

## 📞 Files Created

- `create-audit-logs-table.sql` ← Run this in Supabase
- `test-signup-production.js` ← Test script
- `CRITICAL_SIGNUP_FIX.md` ← This file

---

**Start with Step 1: Check if SUPABASE_SERVICE_ROLE_KEY is set in Netlify!**

