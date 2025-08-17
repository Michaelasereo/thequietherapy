# Authentication Testing Guide (Sign Up & Sign In)

## 🚀 Quick Start

1. **Start your development server**: `npm run dev`
2. **Open browser**: Go to `http://localhost:3000`
3. **Follow the step-by-step tests below**

---

## 📝 Test 1: Sign Up Flow

### Step 1: Access Sign Up Page
1. Navigate to `http://localhost:3000/signup`
2. **Expected**: Sign up page loads with form fields

### Step 2: Test Form Validation
1. **Test Empty Form**:
   - Click "Sign Up" without filling anything
   - **Expected**: Validation errors appear

2. **Test Invalid Email**:
   - Enter: `invalid-email`
   - **Expected**: Email validation error

3. **Test Weak Password**:
   - Enter: `123`
   - **Expected**: Password strength error

### Step 3: Test Valid Sign Up
1. **Fill Form with Valid Data**:
   - Email: `test@example.com`
   - Password: `TestPassword123!`
   - Full Name: `Test User`

2. **Submit Form**:
   - Click "Sign Up"
   - **Expected**: Success message or redirect

### Step 4: Check Email Verification
1. **Check Email** (if configured):
   - Look for verification email
   - Click verification link
   - **Expected**: Account verified

---

## 🔑 Test 2: Sign In Flow

### Step 1: Access Login Page
1. Navigate to `http://localhost:3000/login`
2. **Expected**: Login page loads with magic link form

### Step 2: Test Magic Link Login
1. **Enter Email**:
   - Use the email from sign up: `test@example.com`

2. **Send Magic Link**:
   - Click "Send Magic Link"
   - **Expected**: Success message appears

### Step 3: Check Magic Link Email
1. **Check Email** (if configured):
   - Look for magic link email
   - Click magic link
   - **Expected**: Redirected to dashboard

---

## 🏠 Test 3: Dashboard Access

### Step 1: Test Authenticated Access
1. **After successful login**:
   - Navigate to `http://localhost:3000/dashboard`
   - **Expected**: Dashboard loads with user data

### Step 2: Test Unauthenticated Access
1. **Clear browser cookies** or open incognito window
2. **Navigate to dashboard**:
   - Go to `http://localhost:3000/dashboard`
   - **Expected**: Redirected to login page

---

## 🔒 Test 4: Protected Routes

### Test Dashboard Protection
1. **Without authentication**:
   - Try accessing `/dashboard`
   - **Expected**: Redirect to `/auth` or `/login`

### Test Other Protected Routes
1. **Test these routes without auth**:
   - `/dashboard/sessions`
   - `/dashboard/settings`
   - **Expected**: All redirect to auth page

---

## ✅ Test 5: Form Validation

### Sign Up Validation
1. **Required Fields**:
   - [ ] Email field required
   - [ ] Password field required
   - [ ] Full name field required

2. **Email Validation**:
   - [ ] Valid email format accepted
   - [ ] Invalid email shows error
   - [ ] Empty email shows error

3. **Password Validation**:
   - [ ] Minimum length enforced
   - [ ] Password strength indicators
   - [ ] Special characters allowed

### Login Validation
1. **Email Validation**:
   - [ ] Valid email format required
   - [ ] Empty email shows error
   - [ ] Invalid email shows error

---

## 🐛 Common Issues to Check

### Sign Up Issues
1. **Form Not Submitting**:
   - Check browser console for errors
   - Verify all required fields filled
   - Check network tab for API calls

2. **Email Already Exists**:
   - Try signing up with existing email
   - **Expected**: Clear error message

3. **Password Requirements**:
   - Test various password strengths
   - Verify requirements are clear

### Login Issues
1. **Magic Link Not Working**:
   - Check Supabase email configuration
   - Verify email templates
   - Check spam folder

2. **Redirect Loops**:
   - Clear browser cookies
   - Check authentication state
   - Verify middleware configuration

### Dashboard Issues
1. **Not Loading User Data**:
   - Check authentication context
   - Verify user profile loading
   - Check API endpoints

2. **Session Persistence**:
   - Refresh page after login
   - Close and reopen browser
   - Check token storage

---

## 📱 Responsive Testing

### Desktop (1920x1080)
- [ ] Sign up form displays properly
- [ ] Login form displays properly
- [ ] All buttons are clickable
- [ ] Form validation messages visible

### Tablet (768x1024)
- [ ] Forms adapt to tablet size
- [ ] Touch interactions work
- [ ] No horizontal scrolling
- [ ] Text remains readable

### Mobile (375x667)
- [ ] Forms stack vertically
- [ ] Touch targets are large enough
- [ ] Keyboard doesn't cover form
- [ ] Smooth scrolling

---

## 🔧 Technical Testing

### Browser Console
1. **Check for Errors**:
   - Open DevTools (F12)
   - Look for red error messages
   - Check network tab for failed requests

### Network Tab
1. **API Calls**:
   - Monitor sign up API call
   - Monitor login API call
   - Check response status codes

### Local Storage
1. **Check Token Storage**:
   - Open DevTools → Application
   - Check Local Storage
   - Verify auth tokens are stored

---

## 🎯 Success Criteria

### Sign Up
- [ ] Form validates correctly
- [ ] Success message appears
- [ ] User account created
- [ ] Email verification sent (if configured)

### Sign In
- [ ] Magic link sent successfully
- [ ] Login redirects to dashboard
- [ ] User session persists
- [ ] Protected routes accessible

### Security
- [ ] Unauthenticated users redirected
- [ ] Passwords not stored in plain text
- [ ] Tokens expire properly
- [ ] No sensitive data in URLs

---

## 🚨 Error Scenarios

### Test These Error Cases
1. **Network Errors**:
   - Disconnect internet during sign up
   - **Expected**: Graceful error handling

2. **Server Errors**:
   - Simulate 500 errors
   - **Expected**: User-friendly error messages

3. **Invalid Data**:
   - Submit malformed data
   - **Expected**: Clear validation errors

---

## 📝 Testing Checklist

### Sign Up Testing
- [ ] Page loads correctly
- [ ] Form validation works
- [ ] Success flow completes
- [ ] Error handling works
- [ ] Responsive design works

### Sign In Testing
- [ ] Page loads correctly
- [ ] Magic link form works
- [ ] Success flow completes
- [ ] Error handling works
- [ ] Responsive design works

### Dashboard Testing
- [ ] Authenticated access works
- [ ] Unauthenticated access blocked
- [ ] User data displays correctly
- [ ] Session persistence works

---

## 🚀 Quick Test Commands

### Run Automated Test
```bash
# Install puppeteer if not installed
npm install puppeteer

# Run authentication test
node scripts/test-auth-only.js
```

### Manual Testing Steps
1. Open `http://localhost:3000/signup`
2. Fill form and submit
3. Open `http://localhost:3000/login`
4. Enter email and send magic link
5. Try accessing dashboard
6. Test responsive design

---

*Focus on these core authentication flows first before moving to dashboard functionality testing.*
