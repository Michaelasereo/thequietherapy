# Magic Link Testing Guide for All User Types

## 🎯 Overview
This guide tests magic link authentication and dashboard redirection for all user types in the system:
- **Individual** users → `/dashboard`
- **Therapist** users → `/therapist/dashboard` 
- **Partner** users → `/partner/dashboard`
- **Admin** users → `/admin/dashboard`

## 🚀 Quick Test Steps

### Step 1: Start the Application
```bash
npm run dev
# Application should be running on http://localhost:3000
```

### Step 2: Test Each User Type

#### Individual User Test
1. **Open**: `http://localhost:3000/login?user_type=individual`
2. **Enter email**: `test.individual@example.com`
3. **Click**: "Send Magic Link"
4. **Expected**: Success message "Magic link sent!"
5. **Check email**: Look for magic link email
6. **Click magic link**: Should redirect to `/dashboard`

#### Therapist User Test  
1. **Open**: `http://localhost:3000/login?user_type=therapist`
2. **Enter email**: `test.therapist@example.com`
3. **Click**: "Send Magic Link"
4. **Expected**: Success message "Magic link sent!"
5. **Check email**: Look for magic link email
6. **Click magic link**: Should redirect to `/therapist/dashboard`

#### Partner User Test
1. **Open**: `http://localhost:3000/login?user_type=partner`
2. **Enter email**: `test.partner@example.com`
3. **Click**: "Send Magic Link"
4. **Expected**: Success message "Magic link sent!"
5. **Check email**: Look for magic link email
6. **Click magic link**: Should redirect to `/partner/dashboard`

#### Admin User Test
1. **Open**: `http://localhost:3000/login?user_type=admin`
2. **Enter email**: `test.admin@example.com`
3. **Click**: "Send Magic Link"
4. **Expected**: Success message "Magic link sent!"
5. **Check email**: Look for magic link email
6. **Click magic link**: Should redirect to `/admin/dashboard`

## ✅ Success Indicators

### Magic Link Email
- [ ] Email received within 1-2 minutes
- [ ] Email contains clickable magic link
- [ ] Link URL contains correct domain
- [ ] Link has authentication tokens

### After Clicking Magic Link
- [ ] Redirects to correct dashboard for user type
- [ ] Dashboard loads without errors
- [ ] User stays authenticated
- [ ] No error messages displayed

### Dashboard Access
- [ ] Individual: `/dashboard` loads properly
- [ ] Therapist: `/therapist/dashboard` loads properly  
- [ ] Partner: `/partner/dashboard` loads properly
- [ ] Admin: `/admin/dashboard` loads properly

## 🔧 Automated Testing

### Run Comprehensive Test Script
```bash
# Test against localhost:3000
node test-magic-links-comprehensive.js

# Test against different URL
node test-magic-links-comprehensive.js --url http://localhost:3001

# Test against production
APP_URL=https://your-app.com node test-magic-links-comprehensive.js
```

### Test Script Features
- Tests magic link generation for all user types
- Tests dashboard redirection for all user types
- Tests login page accessibility
- Tests magic link verification endpoint
- Generates comprehensive test report

## ❌ Common Issues & Solutions

### Email Not Received
- **Check spam folder**
- **Verify email configuration in Supabase**
- **Check email service status**
- **Verify SMTP settings**

### Magic Link Not Working
- **Link expired** (24 hours for regular users, 15 minutes for healthcare)
- **Invalid token** - request new magic link
- **Wrong user type** - ensure correct user_type parameter
- **Network issues** - check internet connection

### Dashboard Not Loading
- **Authentication failed** - check session cookies
- **User type mismatch** - verify user_type in database
- **Missing user profile** - check user exists in database
- **JavaScript errors** - check browser console

### Wrong Dashboard Redirect
- **User type mismatch** - verify user_type in magic link
- **Incorrect redirect logic** - check auth callback route
- **Session issues** - verify session creation

## 🧪 Manual Testing Checklist

### Individual User
- [ ] Login page loads with individual user interface
- [ ] Magic link sent successfully
- [ ] Email received with magic link
- [ ] Magic link redirects to `/dashboard`
- [ ] Dashboard loads with individual user content
- [ ] User stays authenticated after refresh

### Therapist User
- [ ] Login page loads with therapist user interface
- [ ] Magic link sent successfully
- [ ] Email received with magic link
- [ ] Magic link redirects to `/therapist/dashboard`
- [ ] Therapist dashboard loads with therapist content
- [ ] User stays authenticated after refresh

### Partner User
- [ ] Login page loads with partner user interface
- [ ] Magic link sent successfully
- [ ] Email received with magic link
- [ ] Magic link redirects to `/partner/dashboard`
- [ ] Partner dashboard loads with partner content
- [ ] User stays authenticated after refresh

### Admin User
- [ ] Login page loads with admin user interface
- [ ] Magic link sent successfully
- [ ] Email received with magic link
- [ ] Magic link redirects to `/admin/dashboard`
- [ ] Admin dashboard loads with admin content
- [ ] User stays authenticated after refresh

## 🔍 Debugging Steps

### Check Browser Console
1. Open DevTools (F12)
2. Check Console tab for errors
3. Check Network tab for failed requests
4. Check Application tab for cookies/storage

### Check Server Logs
1. Look for authentication errors
2. Check magic link creation logs
3. Verify email sending logs
4. Check session creation logs

### Check Database
1. Verify user exists in `users` table
2. Check `magic_links` table for tokens
3. Verify `user_sessions` table for active sessions
4. Check user_type matches expected value

## 📊 Test Results Template

```
Magic Link Testing Results
========================

Individual User:
- Magic Link Generation: ✅/❌
- Email Received: ✅/❌
- Dashboard Redirect: ✅/❌
- Dashboard Access: ✅/❌

Therapist User:
- Magic Link Generation: ✅/❌
- Email Received: ✅/❌
- Dashboard Redirect: ✅/❌
- Dashboard Access: ✅/❌

Partner User:
- Magic Link Generation: ✅/❌
- Email Received: ✅/❌
- Dashboard Redirect: ✅/❌
- Dashboard Access: ✅/❌

Admin User:
- Magic Link Generation: ✅/❌
- Email Received: ✅/❌
- Dashboard Redirect: ✅/❌
- Dashboard Access: ✅/❌

Overall Success Rate: X/4 user types working
```

## 🚨 Emergency Fixes

### If All Magic Links Fail
1. Check Supabase configuration
2. Verify email service is working
3. Check rate limiting settings
4. Verify database connections

### If Dashboard Redirects Fail
1. Check auth callback route
2. Verify session management
3. Check user type validation
4. Verify redirect logic

### If Authentication Persists
1. Check session cookie settings
2. Verify session storage
3. Check logout functionality
4. Verify session cleanup

---

*Run these tests whenever you make changes to authentication, magic links, or dashboard routing.*
