# 🚨 FIX SIGNUP & TEST - Do This Now

## Current Status
❌ **Signup is BROKEN** - 500 error when users try to sign up

## ⚡ 2-STEP FIX (5 minutes)

### **STEP 1: Run SQL in Supabase** (2 minutes)

1. **Open Supabase SQL Editor:**
   ```
   https://app.supabase.com/project/_/sql/new
   ```

2. **Copy the entire content** of `setup-production-database.sql`

3. **Paste and click "RUN"**

4. **Verify output shows:**
   ```
   ✅ users
   ✅ magic_links  
   ✅ audit_logs
   ```

---

### **STEP 2: Add BREVO_API_KEY** (2 minutes)

1. **Get Brevo API Key:**
   - Go to: https://app.brevo.com/settings/keys/api
   - Copy your API key

2. **Add to Netlify:**
   - Go to: https://app.netlify.com/sites/thequietherapy/settings/env
   - Click "Add a variable"
   - Name: `BREVO_API_KEY`
   - Value: [your API key]
   - Click "Save"

3. **Redeploy:**
   - Click "Trigger deploy" → "Deploy site"
   - Wait 2-3 minutes

---

### **STEP 3: Test** (30 seconds)

After redeployment, run:

```bash
node test-signup-production.js
```

**Expected:**
```
✅ SUCCESS! Signup is working!
```

---

## ✅ That's It!

1. Run SQL script ✓
2. Add BREVO_API_KEY ✓
3. Redeploy ✓
4. Test ✓

**Then signup works!** 🚀

---

## 📄 Files to Use

- `setup-production-database.sql` ← SQL script
- `test-signup-production.js` ← Test script
- This file ← Instructions

**Start with the SQL script in Supabase!**

