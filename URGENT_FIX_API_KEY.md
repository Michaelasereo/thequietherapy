# 🚨 URGENT: Invalid Supabase API Key

## The Problem Found!

The debug shows: **"Invalid API key"** ❌

Your `SUPABASE_SERVICE_ROLE_KEY` in Netlify has a **placeholder** value, not the real key!

---

## ⚡ FIX NOW (2 minutes):

### **Step 1: Get Real Supabase Service Role Key**

1. **Go to Supabase Dashboard:**
   ```
   https://app.supabase.com/project/frzciymslvpohhyefmtr/settings/api
   ```

2. **Find "service_role" key** (under "Project API keys")

3. **Click "Copy"** (it starts with `eyJhbGc...` and is very long)

---

### **Step 2: Update in Netlify**

1. **Go to Netlify Environment Variables:**
   ```
   https://app.netlify.com/sites/thequietherapy/settings/env
   ```

2. **Find:** `SUPABASE_SERVICE_ROLE_KEY`

3. **Click "Options" → "Edit"**

4. **Replace** the placeholder value with the REAL key you copied

5. **Click "Save"**

---

### **Step 3: Redeploy**

**Option A - Auto Deploy (Recommended):**
```bash
npx netlify deploy --prod --message "Fix: Update Supabase service role key"
```

**Option B - Netlify Dashboard:**
- Scroll down on the env vars page
- Click "Trigger deploy" → "Deploy site"
- Wait 2-3 minutes

---

### **Step 4: Test Again**

After deployment completes:

```bash
node test-signup-production.js
```

**Expected:**
```
✅ SUCCESS! Signup is working!
```

---

## 📊 What the Debug Showed:

```json
{
  "env_check": {
    "SUPABASE_SERVICE_ROLE_KEY": true  ← Variable exists
  },
  "users_query": {
    "error": {
      "message": "Invalid API key"  ← But it's invalid!
    }
  }
}
```

The key is SET but it's the wrong value (ends with `.placeholder`)

---

## ✅ Quick Checklist:

- [ ] Get real service_role key from Supabase
- [ ] Update SUPABASE_SERVICE_ROLE_KEY in Netlify
- [ ] Redeploy
- [ ] Test with: `node test-signup-production.js`
- [ ] Should see: ✅ SUCCESS!

---

## 🔗 Quick Links:

- **Supabase API Settings:** https://app.supabase.com/project/frzciymslvpohhyefmtr/settings/api
- **Netlify Env Vars:** https://app.netlify.com/sites/thequietherapy/settings/env

---

**This is the ONLY thing blocking signup! Fix this and you're live!** 🚀

