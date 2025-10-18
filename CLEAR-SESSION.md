# Clear Current Session

## Option 1: Via Browser
1. Open http://localhost:3000/therapist/dashboard
2. Click Logout button
3. Should redirect to /therapist/login?fresh_login=true
4. Session cleared ✅

## Option 2: Clear Browser Cookies
1. Open DevTools (F12)
2. Go to Application tab
3. Expand Cookies > http://localhost:3000
4. Delete `quiet_session` cookie
5. Refresh page
6. Session cleared ✅

## Option 3: Clear All Site Data
1. Open DevTools (F12)
2. Go to Application tab
3. Click "Clear site data" button
4. Reload
5. Everything cleared ✅

