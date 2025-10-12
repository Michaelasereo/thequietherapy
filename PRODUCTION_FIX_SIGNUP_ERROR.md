# 🚨 URGENT: Production Signup Error Fix

## Issue
New users getting 401 and 500 errors when trying to sign up:
- **401 Error** - Unauthorized
- **500 Error** - `/api/auth/send-magic-link` failing

## Root Causes

### 1. Missing Environment Variables in Production
The signup flow requires these Netlify environment variables:

```bash
# Required for email sending
BREVO_API_KEY=your_brevo_api_key

# Alternative email configuration (if not using Brevo)
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password

# Required for magic links
NEXT_PUBLIC_APP_URL=https://thequietherapy.live

# Database (should already be set)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

### 2. RateLimiter Dependency
The code uses `RateLimiter` and `AuditLogger` which may not be properly initialized.

---

## 🔧 IMMEDIATE FIX

### Option 1: Add Environment Variables (Recommended)

1. **Go to Netlify Dashboard:**
   ```
   https://app.netlify.com/sites/thequietherapy/settings/deploys#environment
   ```

2. **Add these variables:**
   - `BREVO_API_KEY` - Your Brevo API key for sending emails
   - `NEXT_PUBLIC_APP_URL` - `https://thequietherapy.live`

3. **Click "Save" then "Redeploy"**

### Option 2: Simplified Signup (Quick Fix)

If you don't have Brevo setup yet, use the simplified register endpoint:

**Update the register page** to use `/api/auth/register` instead:

```typescript
// In app/register/page.tsx, change line 35:
const response = await fetch('/api/auth/register', {  // Changed from /send-magic-link
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: email.trim(),
    fullName: firstName.trim()
  }),
})
```

---

## 🚀 DETAILED FIX STEPS

### Step 1: Check Current Environment Variables

```bash
# Login to Netlify CLI (if you have it)
netlify env:list

# Or go to web dashboard:
# https://app.netlify.com/sites/thequietherapy/settings/deploys
```

### Step 2: Add Missing Variables

**Required:**
- `BREVO_API_KEY` - Get from: https://app.brevo.com/settings/keys/api
- `NEXT_PUBLIC_APP_URL` - Set to: `https://thequietherapy.live`

**Optional (for graceful fallback):**
- `ENABLE_EMAIL_FALLBACK=true`

### Step 3: Handle Rate Limiter Issue

The `RateLimiter` needs a database table. Run this SQL in Supabase:

```sql
-- Create rate_limits table if it doesn't exist
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL,
  count INTEGER DEFAULT 0,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_key ON rate_limits(key);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON rate_limits(window_start);
```

### Step 4: Create audit_logs table

```sql
-- Create audit_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  metadata JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
```

---

## 🔍 ALTERNATIVE: Simplified Signup Flow

If you want to bypass email verification for now and get users in quickly:

### Create a simplified signup endpoint:

```typescript
// app/api/auth/quick-signup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { email, fullName } = await request.json();

    if (!email || !fullName) {
      return NextResponse.json(
        { error: 'Email and name are required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    // Create user directly (verified)
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        email,
        full_name: fullName,
        user_type: 'individual',
        is_verified: true,
        is_active: true,
        credits: 0
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Account created! Please login to continue.',
      user
    });

  } catch (error) {
    console.error('Quick signup error:', error);
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}
```

---

## ⚡ FASTEST FIX (Deploy Now)

**Use the existing `/api/auth/register` endpoint which has better fallbacks:**

1. Update `app/register/page.tsx` line 35:
   ```typescript
   const response = await fetch('/api/auth/register', {
   ```

2. Commit and deploy:
   ```bash
   git add app/register/page.tsx
   git commit -m "Fix: Use register endpoint for better error handling"
   git push origin main
   ```

3. Netlify will auto-deploy in 2-3 minutes

---

## 📊 Testing After Fix

Once deployed, test signup with:

1. **Open incognito window**
2. **Go to:** https://thequietherapy.live/register
3. **Enter test email:** test+newuser@example.com
4. **Check for errors** in browser console (F12)

**Expected behavior:**
- ✅ "Verification link sent" message
- ✅ No 401/500 errors
- ✅ Email received (if Brevo configured)

---

## 🎯 RECOMMENDED LONG-TERM FIX

1. **Get Brevo API Key:**
   - Sign up at: https://www.brevo.com
   - Get API key from: https://app.brevo.com/settings/keys/api
   - Add to Netlify environment variables

2. **Verify Database Tables:**
   - Run the SQL scripts above in Supabase
   - Ensure `magic_links`, `rate_limits`, `audit_logs` tables exist

3. **Test Email Sending:**
   ```bash
   # Use this endpoint to test
   curl -X POST https://thequietherapy.live/api/test-email \
     -H "Content-Type: application/json" \
     -d '{"email": "your@email.com"}'
   ```

---

## 🚨 EMERGENCY WORKAROUND

If you need users to sign up RIGHT NOW:

1. **Remove email verification requirement:**
   - In Netlify env vars, add: `SKIP_EMAIL_VERIFICATION=true`

2. **Create users manually in Supabase:**
   ```sql
   INSERT INTO users (email, full_name, user_type, is_verified, is_active, credits)
   VALUES ('user@email.com', 'User Name', 'individual', true, true, 0);
   ```

3. **Send them login link manually**

---

## 📝 Checklist

- [ ] Add `BREVO_API_KEY` to Netlify
- [ ] Add `NEXT_PUBLIC_APP_URL` to Netlify  
- [ ] Run SQL scripts for `rate_limits` and `audit_logs` tables
- [ ] Test signup flow
- [ ] Verify email sending works
- [ ] Remove emergency workaround when ready

---

## 💡 Quick Status Check

**Run this in Supabase SQL Editor to check your setup:**

```sql
-- Check if required tables exist
SELECT 
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'magic_links') 
    THEN '✅ magic_links' ELSE '❌ magic_links MISSING' END as magic_links_status,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rate_limits') 
    THEN '✅ rate_limits' ELSE '❌ rate_limits MISSING' END as rate_limits_status,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') 
    THEN '✅ audit_logs' ELSE '❌ audit_logs MISSING' END as audit_logs_status;
```

---

**Most likely solution: Add BREVO_API_KEY to Netlify and redeploy!** 🚀

