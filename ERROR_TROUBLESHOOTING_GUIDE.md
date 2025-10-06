# Error Troubleshooting Guide

## 🚨 Current Issues Identified

### 1. Port Mismatch Error
**Problem**: Browser trying to connect to `localhost:3001` but server runs on `localhost:3000`
**Error**: `GET http://localhost:3001/therapist/dashboard 404 (Not Found)`

**Solution**:
1. **Clear browser cache and cookies**
2. **Access the correct URL**: `http://localhost:3000` (not 3001)
3. **Restart the development server**

### 2. SSL Protocol Error
**Problem**: Browser trying to use HTTPS on localhost
**Error**: `GET https://localhost:3001/login net::ERR_SSL_PROTOCOL_ERROR`

**Solution**:
1. **Use HTTP, not HTTPS**: `http://localhost:3000` (not `https://`)
2. **Clear browser cache**
3. **Disable HTTPS redirects in browser**

### 3. Connection Refused Error
**Problem**: API endpoints not responding
**Error**: `POST http://localhost:3001/api/auth/send-magic-link net::ERR_CONNECTION_REFUSED`

**Solution**:
1. **Ensure server is running**: `npm run dev`
2. **Check correct port**: Server should be on port 3000
3. **Verify API routes exist**

## 🔧 Step-by-Step Fix

### Step 1: Stop and Restart Development Server
```bash
# Stop the current server (Ctrl+C)
# Then restart
npm run dev
```

### Step 2: Clear Browser Data
1. **Open Chrome DevTools** (F12)
2. **Right-click refresh button** → "Empty Cache and Hard Reload"
3. **Or manually clear**:
   - DevTools → Application → Storage → Clear storage
   - Clear cookies, local storage, session storage

### Step 3: Access Correct URL
- ✅ **Correct**: `http://localhost:3000`
- ❌ **Wrong**: `http://localhost:3001`
- ❌ **Wrong**: `https://localhost:3000`

### Step 4: Test Magic Links
1. **Go to**: `http://localhost:3000/login?user_type=individual`
2. **Enter email**: `test@example.com`
3. **Click**: "Send Magic Link"
4. **Check**: Should see success message

## 🧪 Testing Checklist

### ✅ Server Status
- [ ] Server running on port 3000
- [ ] No port conflicts
- [ ] API routes accessible

### ✅ Browser Configuration
- [ ] Using HTTP (not HTTPS)
- [ ] Correct port (3000, not 3001)
- [ ] Cache cleared
- [ ] No browser extensions interfering

### ✅ Magic Link Flow
- [ ] Login page loads
- [ ] Email input works
- [ ] Magic link request succeeds
- [ ] Email received
- [ ] Magic link redirects correctly

## 🚨 Common Fixes

### Fix 1: Port Configuration
```bash
# Check if something is running on port 3001
lsof -i :3001

# Kill any process on port 3001
kill -9 $(lsof -t -i:3001)

# Start server on correct port
npm run dev
```

### Fix 2: Browser Cache
```bash
# Clear browser cache completely
# Chrome: Settings → Privacy → Clear browsing data
# Or use incognito mode for testing
```

### Fix 3: Environment Variables
```bash
# Check if NEXT_PUBLIC_APP_URL is set incorrectly
echo $NEXT_PUBLIC_APP_URL

# Should be: http://localhost:3000
# Not: http://localhost:3001
```

### Fix 4: Next.js Configuration
```javascript
// Check next.config.js for any port overrides
// Should use default port 3000
```

## 🔍 Debugging Steps

### 1. Check Server Logs
```bash
npm run dev
# Look for: "Local: http://localhost:3000"
```

### 2. Test API Endpoints
```bash
# Test magic link API
curl -X POST http://localhost:3000/api/auth/send-magic-link \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","user_type":"individual"}'
```

### 3. Check Browser Network Tab
1. **Open DevTools** → Network tab
2. **Try magic link request**
3. **Check if request goes to correct port**

### 4. Verify Routes Exist
- [ ] `/login` - ✅ Should exist
- [ ] `/therapist/dashboard` - ❌ May not exist
- [ ] `/api/auth/send-magic-link` - ✅ Should exist
- [ ] `/api/auth/callback` - ✅ Should exist

## 📋 Quick Test Script

```bash
#!/bin/bash
echo "🔍 Testing server configuration..."

# Test if server is running
curl -s http://localhost:3000 > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Server running on port 3000"
else
    echo "❌ Server not running on port 3000"
    echo "Run: npm run dev"
    exit 1
fi

# Test API endpoint
curl -s -X POST http://localhost:3000/api/auth/send-magic-link \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","user_type":"individual"}' \
  > /dev/null

if [ $? -eq 0 ]; then
    echo "✅ API endpoint working"
else
    echo "❌ API endpoint not working"
fi

echo "🎯 Access your app at: http://localhost:3000"
```

## 🎯 Expected Results After Fix

### ✅ Working State
1. **Server**: Running on `http://localhost:3000`
2. **Login**: `http://localhost:3000/login` loads
3. **Magic Link**: API responds successfully
4. **Email**: Magic link email received
5. **Redirect**: Correct dashboard routing

### ❌ Still Broken
1. **Check environment variables**
2. **Verify Supabase configuration**
3. **Check for conflicting processes**
4. **Restart computer if needed**

---

*Follow these steps to resolve the port mismatch and connection issues.*
