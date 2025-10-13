# ⚡ Performance Fix - Slow Magic Links & Dashboard

## 🐛 Problems Found:

1. **Magic Links Taking 10-30 seconds** ❌
2. **Dashboard Loading Slowly** ❌  
3. **Fetch Failed Errors** ❌
4. **Constraint Violations** ❌

## ✅ Root Causes:

1. **No Indexes on Magic Links** - Slow queries
2. **Too Many Expired Links** - Database bloat
3. **Missing Connection Pooling** - Timeout issues

---

## 🚀 Quick Fix (3 Minutes):

### **STEP 1: Clean Database (Run in Supabase SQL Editor)**

```sql
-- Clean up expired magic links
DELETE FROM magic_links WHERE expires_at < NOW();

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_magic_links_token_active 
ON magic_links(token) 
WHERE used_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_magic_links_email_active 
ON magic_links(email) 
WHERE used_at IS NULL;

-- Fix constraint
ALTER TABLE magic_links DROP CONSTRAINT IF EXISTS magic_links_auth_type_check;
ALTER TABLE magic_links 
ADD CONSTRAINT magic_links_auth_type_check 
CHECK (auth_type IN ('individual', 'therapist', 'partner', 'admin'));
```

### **STEP 2: Verify Supabase Connection**

Check in Supabase Dashboard:
- Go to: Settings → Database
- Check: "Connection Pooling" is enabled
- Note the "Connection pooling URL" (should have :6543 port)

### **STEP 3: Update .env.local (If needed)**

If using connection pooling URL, update:
```bash
# Use the pooler URL for better performance
NEXT_PUBLIC_SUPABASE_URL=https://frzciymslvpohhyefmtr.supabase.co
SUPABASE_SERVICE_ROLE_KEY=[your-service-key]

# For server-side calls, use transaction mode
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
```

### **STEP 4: Restart Dev Server**

```bash
# Stop current server (Ctrl+C)
# Then restart:
npm run dev
```

---

## 📊 Expected Performance After Fix:

- Magic Link Creation: **< 2 seconds** (was 10-30s)
- Dashboard Load: **< 3 seconds** (was slow)
- Login Flow: **< 5 seconds total** (was 30s+)

---

## 🧪 Test the Fix:

1. Go to: http://localhost:3000/therapist/login
2. Enter email
3. Magic link should arrive in **< 5 seconds**
4. Click link
5. Dashboard should load in **< 3 seconds**

---

## 🔍 If Still Slow, Check:

### **1. Check Supabase Status**
```
https://status.supabase.com
```

### **2. Test Connection Speed**
```bash
curl -w "@-" -o /dev/null -s "https://frzciymslvpohhyefmtr.supabase.co/rest/v1/"
```

### **3. Check Network**
```bash
ping frzciymslvpohhyefmtr.supabase.co
```

### **4. View Database Stats in Supabase**
- Go to: Database → Performance
- Check: Query performance
- Look for: Slow queries

---

## 🛠️ Alternative: Use Dev Console (Bypass Magic Links)

Instead of waiting for magic links during testing:

1. **Go to**: http://localhost:3000/dev-console
2. **It will auto-create sessions** without needing magic links
3. **Or**: Manually set session cookie in browser console:

```javascript
// In browser console (F12):
document.cookie = `auth-token=test-token-${Date.now()}; path=/; max-age=86400`;
localStorage.setItem('user', JSON.stringify({
  id: 'test-user-id',
  email: 'test@example.com',
  user_type: 'therapist'
}));
// Refresh page
location.reload();
```

---

## 💡 Long-term Solutions:

1. **Set up automatic cleanup**:
```sql
-- Run this to create a function that auto-cleans old links
CREATE OR REPLACE FUNCTION cleanup_old_magic_links()
RETURNS void AS $$
BEGIN
  DELETE FROM magic_links 
  WHERE expires_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Schedule to run daily (use Supabase cron extension)
```

2. **Add connection pooling** in production

3. **Use Redis** for magic link storage (optional)

---

## ✅ Checklist:

- [ ] Run cleanup SQL in Supabase
- [ ] Add performance indexes
- [ ] Restart dev server
- [ ] Test magic link speed (should be < 5s)
- [ ] Test dashboard load (should be < 3s)
- [ ] If still slow, check Supabase status
- [ ] Use Dev Console for testing instead

---

**After running the SQL, magic links should be MUCH faster!** ⚡

The main issue was:
- No indexes on frequently queried columns
- Thousands of expired links slowing down queries
- Missing connection pooling

The fix adds indexes and cleans up old data! 🚀

