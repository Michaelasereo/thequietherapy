# 🔐 Authentication Troubleshooting Guide
*Based on real-world issues encountered in a Next.js + Supabase authentication system*

## 🎯 Overview
This guide covers the most common authentication issues when building magic link/passwordless authentication systems with Next.js, Supabase, and email services.

## 🚨 Common Issues & Solutions

### Issue 1: Magic Link Redirects to Login Instead of Dashboard

**Symptoms:**
- User clicks magic link in email
- Gets redirected to `/login` instead of `/dashboard`
- Server logs show session creation but client doesn't recognize it

**Root Causes:**
1. **Cookie not readable by client-side JavaScript**
2. **Timing issues between cookie setting and client validation**
3. **httpOnly cookie blocking client access**

**Solutions:**
```typescript
// ❌ Problem: httpOnly cookie can't be read by client
response.cookies.set("trpi_user", cookieValue, {
  httpOnly: true, // Client can't read this
  secure: true,
  maxAge: 60 * 60 * 24 * 7,
  path: "/",
})

// ✅ Solution: Allow client-side access
response.cookies.set("trpi_user", cookieValue, {
  httpOnly: false, // Client can read this
  secure: process.env.NODE_ENV === "production",
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 7,
  path: "/",
})
```

### Issue 2: AuthContext Can't Find User Cookie

**Symptoms:**
```
🔍 AuthContext: User cookie from js-cookie: undefined
🔍 AuthContext: No user cookie found
```

**Root Causes:**
1. **httpOnly cookie blocking js-cookie library**
2. **Cookie not set properly**
3. **Timing issues**

**Solutions:**
```typescript
// ✅ Ensure cookie is readable
const userCookie = Cookies.get('trpi_user')

// ✅ Add retry mechanism with delays
const initAuth = async () => {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const delay = attempt * 500 // 500ms, 1000ms, 1500ms
    await new Promise(resolve => setTimeout(resolve, delay))
    
    const isValid = await validateSession()
    if (isValid) break
  }
}
```

### Issue 3: Dashboard Loads Then Redirects to Login

**Symptoms:**
- Dashboard appears briefly
- Then redirects back to login page
- AuthCheck component shows authentication failed

**Root Causes:**
1. **Race condition between cookie setting and validation**
2. **AuthCheck running before cookie is available**
3. **Middleware conflicts**

**Solutions:**
```typescript
// ✅ Add proper delays and retry logic
useEffect(() => {
  const checkAuth = async () => {
    // Add delay to ensure cookie is set
    setTimeout(() => {
      checkAuth()
    }, 500)
  }
}, [])

// ✅ Ensure credentials are included in fetch
const response = await fetch('/api/auth/me', {
  credentials: 'include',
  headers: {
    'Cache-Control': 'no-cache'
  }
})
```

### Issue 4: Email Not Sending

**Symptoms:**
- No email received after login/signup
- Server logs show email sending but nothing arrives
- SMTP configuration errors

**Root Causes:**
1. **Incorrect SMTP credentials**
2. **Email service configuration issues**
3. **Environment variables not set**

**Solutions:**
```bash
# ✅ Test email configuration
node scripts/test-email-config.js

# ✅ Check environment variables
echo $BREVO_SMTP_USER
echo $BREVO_SMTP_PASS
echo $SENDER_EMAIL
```

### Issue 5: Database Session Validation Fails

**Symptoms:**
```
❌ Session validation failed: column "last_login_at" does not exist
❌ Cannot coerce the result to a single JSON object
```

**Root Causes:**
1. **Missing database columns**
2. **Database RPC function issues**
3. **Schema not properly applied**

**Solutions:**
```sql
-- ✅ Add missing columns
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;

-- ✅ Use direct SQL instead of problematic RPCs
const { data: sessionData, error: sessionError } = await supabase
  .from('user_sessions')
  .select(`
    id,
    user_id,
    session_token,
    expires_at,
    users!inner (
      id,
      email,
      full_name,
      user_type,
      is_verified,
      is_active,
      credits,
      package_type
    )
  `)
  .eq('session_token', session_token)
  .gt('expires_at', new Date().toISOString())
  .single()
```

### Issue 6: Cookie Parsing Errors

**Symptoms:**
```
❌ Error parsing user cookie: SyntaxError
🔍 Raw cookie value: malformed-json
```

**Root Causes:**
1. **URL encoding issues**
2. **Malformed JSON in cookie**
3. **Cookie parsing logic errors**

**Solutions:**
```typescript
// ✅ Robust cookie parsing
const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
  const [key, value] = cookie.trim().split('=')
  if (key && value) {
    acc[key.trim()] = value.trim()
  }
  return acc
}, {} as Record<string, string>)

// ✅ Handle URL encoding
const decodedCookie = decodeURIComponent(trpiUserCookie)
userData = JSON.parse(decodedCookie)
```

### Issue 7: Middleware Conflicts

**Symptoms:**
- Authentication works but middleware blocks access
- Unexpected redirects
- Route protection not working

**Root Causes:**
1. **Middleware running before authentication is complete**
2. **Conflicting redirect logic**
3. **Timing issues**

**Solutions:**
```typescript
// ✅ Temporarily disable middleware for debugging
export function middleware(request: NextRequest) {
  console.log('🔍 Middleware: Allowing all requests to pass through')
  return NextResponse.next()
  
  // Original logic commented out for debugging
}

// ✅ Proper middleware logic
if (isProtectedRoute && !userCookie) {
  return NextResponse.redirect(new URL('/login', request.url))
}
```

## 🔧 Debugging Checklist

### 1. Check Server Logs
```bash
# Look for these patterns:
✅ Session created successfully
✅ Cookie set, redirecting to dashboard
✅ Session validated for user: email@example.com
```

### 2. Check Browser Network Tab
- **`/api/auth/verify`** → Should show 302 redirect with `Set-Cookie` header
- **`/dashboard`** → Should load successfully (200)
- **`/api/auth/me`** → Should return user data (200)

### 3. Check Cookie Storage
```javascript
// In browser console
document.cookie // Should show trpi_user cookie
Cookies.get('trpi_user') // Should return user data
```

### 4. Verify Database
```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'user_sessions', 'magic_links');

-- Check recent sessions
SELECT * FROM user_sessions ORDER BY created_at DESC LIMIT 5;
```

## 🛠️ Testing Scripts

### Email Configuration Test
```bash
node scripts/test-email-config.js
```

### Database Connection Test
```bash
node scripts/test-magic-link-db.js
```

### Full Authentication Flow Test
```bash
node scripts/test-auth-flow-simple.js
```

## 📋 Environment Variables Checklist

```bash
# Required for Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Required for Email (Brevo)
BREVO_SMTP_USER=your-smtp-user
BREVO_SMTP_PASS=your-smtp-password
SENDER_EMAIL=noreply@yourdomain.com

# Optional
NODE_ENV=development
```

## 🎯 Best Practices

### 1. Cookie Configuration
```typescript
// ✅ Production-ready cookie settings
response.cookies.set("trpi_user", cookieValue, {
  httpOnly: false, // Allow client access
  secure: process.env.NODE_ENV === "production",
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 7, // 1 week
  path: "/",
})
```

### 2. Authentication Flow
```typescript
// ✅ Proper timing and retry logic
const initAuth = async () => {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const delay = attempt * 500
    await new Promise(resolve => setTimeout(resolve, delay))
    
    const isValid = await validateSession()
    if (isValid) break
  }
}
```

### 3. Error Handling
```typescript
// ✅ Comprehensive error handling
try {
  const response = await fetch('/api/auth/me', {
    credentials: 'include',
    headers: { 'Cache-Control': 'no-cache' }
  })
  
  if (response.ok) {
    const data = await response.json()
    if (data.success) {
      setUser(data.user)
      return true
    }
  }
} catch (error) {
  console.error('Session validation error:', error)
  return false
}
```

## 🚀 Quick Fix Commands

```bash
# 1. Restart server
npm run dev

# 2. Clear browser cookies
# Open DevTools → Application → Storage → Clear site data

# 3. Test email
node scripts/test-email-config.js

# 4. Check database
node scripts/test-magic-link-db.js

# 5. Verify environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY
echo $BREVO_SMTP_USER
```

## 📝 Common Error Messages & Solutions

| Error Message | Solution |
|---------------|----------|
| `No user cookie found` | Check `httpOnly: false` in cookie settings |
| `Session validation failed` | Verify database session exists and is not expired |
| `Email sending failed` | Check SMTP credentials and environment variables |
| `Cannot coerce result to JSON` | Use direct SQL queries instead of database RPCs |
| `Middleware redirecting to login` | Temporarily disable middleware for debugging |
| `Cookie parsing error` | Check URL encoding and JSON format |

## 🎉 Success Indicators

When authentication is working correctly, you should see:

1. **Server logs:**
   ```
   ✅ Session created successfully
   ✅ Cookie set, redirecting to dashboard
   ✅ Session validated for user: email@example.com
   ```

2. **Browser console:**
   ```
   🔍 AuthContext: Session validated successfully
   🔍 DashboardLayout: Rendering dashboard content
   ```

3. **Network tab:**
   - `/api/auth/verify` → 302 with `Set-Cookie`
   - `/dashboard` → 200 OK
   - `/api/auth/me` → 200 with user data

4. **User experience:**
   - Click magic link → Redirect to dashboard → Stay on dashboard

---

*This guide is based on real troubleshooting experience. Save it for future authentication projects! 🚀*
