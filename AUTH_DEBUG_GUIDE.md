# 🔍 Authentication Debug Guide

## Current Status
- ✅ Database schema is correct
- ✅ API endpoints are properly structured
- ✅ Email service is working
- 🔧 Cookie parsing improved
- 🔧 AuthCheck timing adjusted

## How to Test the Authentication Flow

### 1. Start the Server
```bash
npm run dev
```

### 2. Test Login Flow
1. Go to `http://localhost:3000/login`
2. Enter your email
3. Submit the form
4. Check your email for the magic link

### 3. Monitor Network Tab
1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Click the magic link in your email
4. Watch for these requests:

#### Expected Network Requests:
1. **`/api/auth/verify?token=...`**
   - Status: 302 (Redirect)
   - Response Headers: Should have `Set-Cookie: trpi_user=...`
   - Redirects to: `/dashboard`

2. **`/dashboard`**
   - Status: 200
   - Should load the dashboard page

3. **`/api/auth/me`**
   - Status: 200
   - Request Headers: Should have `Cookie: trpi_user=...`
   - Response: Should return user data

### 4. Check Server Logs
Look for these log messages in your terminal:

#### Verification Endpoint (`/api/auth/verify`):
```
🔍 GET /auth/verify called
🔍 Looking for verification record...
✅ Verification record found for email: ...
🔐 Creating user session...
✅ Session created successfully
🔍 Verification: Setting cookie with data: {...}
🔍 Verification: Cookie set, redirecting to dashboard
```

#### Auth Check Endpoint (`/api/auth/me`):
```
🔍 GET /auth/me called
🔍 Cookie header: trpi_user=...
🔍 Found trpi_user cookie: ...
🔍 Parsed user data: {...}
🔍 Validating session token: ...
✅ Session validated for user: ...
✅ Returning user data: {...}
```

#### Dashboard AuthCheck:
```
🔍 AuthCheck: Component rendered - START
🔍 AuthCheck: useEffect triggered
🔍 AuthCheck: Making request to /api/auth/me...
🔍 AuthCheck: Response status: 200
🔍 AuthCheck: Response data: {...}
🔍 AuthCheck: Authentication successful
🔍 AuthCheck: Authenticated, rendering children
```

## Common Issues and Solutions

### Issue 1: Cookie Not Set
**Symptoms:** No `Set-Cookie` header in verification response
**Solution:** Check if the verification endpoint is creating the session properly

### Issue 2: Cookie Not Sent
**Symptoms:** No `Cookie` header in `/api/auth/me` request
**Solution:** Ensure `credentials: 'include'` is set in fetch requests

### Issue 3: Cookie Parsing Error
**Symptoms:** "Error parsing user cookie" in logs
**Solution:** Cookie format issue - check the cookie value format

### Issue 4: Session Validation Fails
**Symptoms:** "Session validation failed" in logs
**Solution:** Check if the session token exists in the database

### Issue 5: AuthCheck Redirects to Login
**Symptoms:** Dashboard loads then redirects to login
**Solution:** Check if `/api/auth/me` is returning success

## Manual Testing Steps

### Step 1: Test Email Sending
```bash
node scripts/test-email-config.js
```

### Step 2: Test Database Connection
```bash
node scripts/test-magic-link-db.js
```

### Step 3: Test Full Flow
```bash
node scripts/test-auth-flow-simple.js
```

## Debug Commands

### Check Database Tables
```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'user_sessions', 'magic_links');

-- Check recent magic links
SELECT * FROM magic_links ORDER BY created_at DESC LIMIT 5;

-- Check recent sessions
SELECT * FROM user_sessions ORDER BY created_at DESC LIMIT 5;

-- Check recent users
SELECT * FROM users ORDER BY created_at DESC LIMIT 5;
```

### Check Environment Variables
```bash
echo $NEXT_PUBLIC_SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY
echo $BREVO_SMTP_USER
echo $BREVO_SMTP_PASS
```

## Expected Flow Summary

1. **User submits email** → `/api/auth/login` creates magic link
2. **User clicks email link** → `/api/auth/verify` validates token, creates session, sets cookie
3. **User redirected to dashboard** → `AuthCheck` component validates session via `/api/auth/me`
4. **Dashboard loads** → User sees their dashboard content

## If Still Not Working

1. **Check all server logs** for error messages
2. **Verify database tables** exist and have data
3. **Test email delivery** is working
4. **Check cookie settings** in browser DevTools
5. **Verify environment variables** are set correctly

## Quick Fix Checklist

- [ ] Database schema is applied
- [ ] Environment variables are set
- [ ] Email service is working
- [ ] Server is running on port 3000
- [ ] Magic link URL is correct (localhost:3000)
- [ ] Cookie is being set properly
- [ ] Session is being created in database
- [ ] AuthCheck is receiving valid response from `/api/auth/me`
