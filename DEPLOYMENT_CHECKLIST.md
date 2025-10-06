# 🚨 CRITICAL SECURITY DEPLOYMENT CHECKLIST

## ⏰ PHASE 1: URGENT - DEPLOY TODAY (≤ 2 Hours)

### Step 1: Deploy Core Security Files ✅
- [ ] **Deploy `lib/server-auth.ts`** (Enhanced with caching)
- [ ] **Deploy `lib/api-response.ts`** (Error handling)
- [ ] **Deploy fixed `app/api/sessions/book/route.ts`**
- [ ] **Deploy fixed `app/api/sessions/upcoming/route.ts`**

### Step 2: Critical Database Index 🗄️
**Run this SQL command immediately:**
```sql
-- CRITICAL: This speeds up session validation for all API calls
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_sessions_token 
ON user_sessions (session_token) WHERE expires_at > NOW();
```

### Step 3: Test Core Functionality ✅
- [ ] **Login Test**: Log in as a regular user - should work normally
- [ ] **Session Booking Test**: Book a session - should work normally  
- [ ] **Security Test**: Run the security test script (see below)

---

## 🧪 SECURITY TESTING PROCEDURE

### Before Deploying:
1. **Backup your database** (just in case)
2. **Test on staging first** if possible

### After Deploying:
1. **Open your app in browser**
2. **Log in as a regular user**
3. **Open Developer Tools (F12) → Console**
4. **Copy and paste the entire `security-test-script.js` file**
5. **Run: `runAllSecurityTests()`**

### Expected Results (After Fixes):
```
✅ SECURE /api/sessions/upcoming: 401
✅ SECURE /api/sessions/book: 401  
✅ SECURE /api/therapist/dashboard-data: 401
```

### If You See This (VULNERABLE):
```
❌ VULNERABLE /api/sessions/upcoming: 200
❌ VULNERABLE /api/therapist/dashboard-data: 200
```
**→ DO NOT DEPLOY TO PRODUCTION YET**

---

## ⚡ PHASE 2: HIGH PRIORITY - THIS WEEK

### Step 4: Fix Remaining Vulnerable Endpoints 🔧

**Template for fixing any endpoint:**
1. **Replace the imports:**
```typescript
// OLD:
import { cookies } from 'next/headers'

// NEW:
import { requireApiAuth } from '@/lib/server-auth'
import { handleApiError, successResponse } from '@/lib/api-response'
```

2. **Replace the auth logic:**
```typescript
// OLD (VULNERABLE):
const cookieStore = await cookies()
const userCookie = cookieStore.get('trpi_individual_user')
const user = JSON.parse(decodeURIComponent(userCookie.value))
const userId = user.id // ❌ Can be manipulated

// NEW (SECURE):
const authResult = await requireApiAuth(['individual'])
if ('error' in authResult) return authResult.error
const userId = authResult.session.user.id // ✅ Verified
```

3. **Replace error handling:**
```typescript
// OLD:
return NextResponse.json({ error: 'Something failed' }, { status: 500 })

// NEW:
throw new Error('Something failed') // Will be handled by handleApiError
```

4. **Replace success responses:**
```typescript
// OLD:
return NextResponse.json({ data: result })

// NEW:  
return successResponse({ data: result })
```

**Apply this template to these files:**
- [ ] `app/api/sync-booking/route.ts`
- [ ] `app/api/therapist/availability/route.ts`
- [ ] `app/api/therapist/profile/route.ts`
- [ ] `app/api/ai/process-session/route.ts`
- [ ] `app/api/therapist/sessions/today/route.ts`
- [ ] `app/api/sessions/history/route.ts`
- [ ] `app/api/partner/bulk-upload-members/route.ts`
- [ ] `app/api/admin/me/route.ts`

### Step 5: Add Performance Indexes 📈
**Run these SQL commands one by one:**
```sql
-- Session performance
CREATE INDEX CONCURRENTLY idx_sessions_therapist_status_time ON sessions (therapist_id, status, start_time DESC);
CREATE INDEX CONCURRENTLY idx_sessions_user_status_time ON sessions (user_id, status, start_time DESC);

-- Availability checking
CREATE INDEX CONCURRENTLY idx_sessions_therapist_time_range ON sessions (therapist_id, start_time, end_time) WHERE status IN ('scheduled', 'confirmed', 'in_progress');

-- User filtering
CREATE INDEX CONCURRENTLY idx_users_type_status ON users (user_type, is_active, is_verified);

-- Magic link performance
CREATE INDEX CONCURRENTLY idx_magic_links_token_auth_type ON magic_links (token, auth_type) WHERE used_at IS NULL AND expires_at > NOW();
```

---

## 🚀 DEPLOYMENT COMMANDS

### If using Vercel:
```bash
# Deploy to production
vercel --prod

# Or deploy to staging first
vercel
```

### If using other hosting:
```bash
# Build the app
npm run build

# Deploy using your hosting provider's method
```

### Database Commands:
```bash
# If using Supabase Dashboard:
# 1. Go to SQL Editor
# 2. Run each CREATE INDEX command individually

# If using psql:
psql "your-database-connection-string" -c "CREATE INDEX CONCURRENTLY idx_user_sessions_token ON user_sessions (session_token) WHERE expires_at > NOW();"
```

---

## 🔍 VERIFICATION CHECKLIST

### After Each Deployment:
- [ ] **App loads normally**
- [ ] **Users can log in**
- [ ] **Session booking works**
- [ ] **Therapist dashboard loads** (for therapist accounts)
- [ ] **Security tests pass** (all should return 401/403 for unauthorized access)

### Performance Checks:
- [ ] **Page load times** haven't significantly increased
- [ ] **Database query times** have improved (check logs)
- [ ] **No new error logs** in production

---

## 🚨 ROLLBACK PLAN

**If something breaks:**

### Immediate Rollback:
```bash
# Revert to previous deployment
vercel rollback

# Or redeploy previous version
git checkout previous-working-commit
vercel --prod
```

### Database Rollback:
```sql
-- Only if indexes cause issues (unlikely)
DROP INDEX IF EXISTS idx_user_sessions_token;
DROP INDEX IF EXISTS idx_sessions_therapist_status_time;
-- etc.
```

---

## 📞 EMERGENCY CONTACTS

**If you encounter issues:**
1. **Check the logs** first (Vercel dashboard or your hosting logs)
2. **Run the security test script** to identify what's broken
3. **Use the rollback plan** if users can't access the app

---

## 🎯 SUCCESS METRICS

**You'll know the deployment succeeded when:**
- ✅ All security tests return 401/403 (not 200)
- ✅ Normal user functionality works
- ✅ No increase in error logs
- ✅ Improved database query performance

**Expected Performance Improvements:**
- 🚀 50-80% faster session validation
- 🚀 Reduced database load from caching
- 🚀 Faster dashboard loading times

---

**🔥 CRITICAL REMINDER:**
**The current system allows any user to impersonate any other user. Deploy Phase 1 immediately.**
