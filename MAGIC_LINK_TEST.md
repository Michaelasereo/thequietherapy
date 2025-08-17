# Magic Link Testing Guide

## 🚀 Quick Test Steps

### Step 1: Send Magic Link
1. **Open your app**: Go to `http://localhost:3000/login`
2. **Enter your email**: Use a real email address you can access
3. **Click "Send Magic Link"**
4. **Check for success message**: Should see confirmation

### Step 2: Check Email
1. **Open your email inbox**
2. **Look for email from your app**
3. **Check subject line**: Should be something like "Sign in to [App Name]"
4. **Open the email**

### Step 3: Click Magic Link
1. **Find the magic link in the email**
2. **Click the link**
3. **Watch what happens**: Should redirect to dashboard

### Step 4: Verify Dashboard Access
1. **Check URL**: Should be `http://localhost:3000/dashboard`
2. **Check content**: Should see welcome message and dashboard elements
3. **Check authentication**: Try refreshing page - should stay logged in

---

## ✅ Success Indicators

### Magic Link Email
- [ ] Email received within 1-2 minutes
- [ ] Email contains a clickable link
- [ ] Link URL contains your app domain
- [ ] Link has authentication tokens

### After Clicking Link
- [ ] Redirects to dashboard (`/dashboard`)
- [ ] Shows welcome message with user name
- [ ] Dashboard elements load properly
- [ ] No error messages

### Authentication Persistence
- [ ] Refresh page - stays on dashboard
- [ ] Close and reopen browser - still logged in
- [ ] Can access other protected routes

---

## ❌ Common Issues

### Email Not Received
- Check spam folder
- Verify email address is correct
- Check Supabase email configuration
- Check email service status

### Link Not Working
- Link might be expired (usually 24 hours)
- Check if link URL is correct
- Verify authentication tokens in URL
- Check browser console for errors

### Dashboard Not Loading
- Check if user profile exists in database
- Verify authentication context is working
- Check for JavaScript errors
- Verify API endpoints are working

---

## 🔧 Troubleshooting

### Check Supabase Configuration
1. **Email Settings**:
   - Go to Supabase Dashboard
   - Check Authentication → Email Templates
   - Verify email is configured

2. **Site URL**:
   - Check Authentication → URL Configuration
   - Make sure site URL is `http://localhost:3000`

3. **Email Provider**:
   - Check if using custom SMTP or Supabase email
   - Verify email provider settings

### Check Browser Console
1. **Open DevTools** (F12)
2. **Look for errors** in Console tab
3. **Check Network tab** for failed requests
4. **Check Application tab** for cookies/storage

### Check Authentication State
1. **Local Storage**:
   - DevTools → Application → Local Storage
   - Look for auth tokens

2. **Cookies**:
   - DevTools → Application → Cookies
   - Check for session cookies

---

## 🧪 Manual Test Script

```bash
# 1. Start your development server
npm run dev

# 2. Open browser and go to login page
# http://localhost:3000/login

# 3. Enter your email and send magic link

# 4. Check email and click the link

# 5. Verify you're redirected to dashboard

# 6. Test authentication persistence
# - Refresh page
# - Close and reopen browser
# - Try accessing other protected routes
```

---

## 📱 Test on Different Devices

### Desktop Browser
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

### Mobile Browser
- [ ] Mobile Chrome
- [ ] Mobile Safari
- [ ] Test in mobile email app

### Email Clients
- [ ] Gmail
- [ ] Outlook
- [ ] Apple Mail
- [ ] Mobile email apps

---

## 🎯 Expected Results

### ✅ Working Magic Link
1. Email received quickly
2. Link redirects to dashboard
3. User stays authenticated
4. Dashboard loads properly
5. All features work normally

### ❌ Broken Magic Link
1. Email not received
2. Link doesn't work
3. Redirects to login page
4. Shows error messages
5. User not authenticated

---

## 🚨 Quick Fixes

### If Email Not Sending
```javascript
// Check your Supabase configuration
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
```

### If Link Not Working
```javascript
// Check your auth callback URL
const { data, error } = await supabase.auth.signInWithOtp({
  email: email,
  options: {
    emailRedirectTo: 'http://localhost:3000/dashboard'
  }
});
```

### If Dashboard Not Loading
```javascript
// Check your auth context
const { user, loading } = useAuth();
if (loading) return <div>Loading...</div>;
if (!user) return <div>Not authenticated</div>;
```

---

*Run this test whenever you make changes to authentication or want to verify magic link functionality.*
