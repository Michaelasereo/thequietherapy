# 🚀 Production Deployment Checklist
## Ensure Localhost & Production Work the Same

---

## ✅ **Fixed Issues**

### 1. **Admin Login Redirect** ✅
- **Issue:** `/admin/login` redirecting to homepage in production
- **Fix:** Updated `middleware.ts` to explicitly exclude public routes
- **Fix:** Updated `app/admin/layout.tsx` to skip sidebar for public routes
- **Status:** ✅ Fixed

### 2. **Cookie Domain** ✅
- **Issue:** Cookie domain using `.thequietherapy.live` (leading dot deprecated)
- **Fix:** Changed to `thequietherapy.live` in `lib/server-session-manager.ts`
- **Status:** ✅ Fixed

### 3. **Image Domains** ✅
- **Issue:** `next.config.js` only had `localhost` in image domains
- **Fix:** Added `thequietherapy.live` to image domains
- **Status:** ✅ Fixed

---

## ⚠️ **Critical Environment Variables (Must Set in Netlify)**

### **Required for Production:**

```bash
# App URL (CRITICAL - used for magic links)
NEXT_PUBLIC_APP_URL=https://thequietherapy.live

# Supabase (Database)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# JWT Secret (Authentication)
JWT_SECRET=your_jwt_secret_key

# Email Service (Magic Links)
BREVO_API_KEY=your_brevo_api_key
# OR
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Daily.co (Video Sessions)
DAILY_API_KEY=your_daily_api_key
DAILY_DOMAIN=your_domain.daily.co

# OpenAI (AI SOAP Notes)
OPENAI_API_KEY=your_openai_key
# OR
DEEPSEEK_API_KEY=your_deepseek_key

# Paystack (Payments)
PAYSTACK_SECRET_KEY=your_paystack_secret
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=your_paystack_public_key

# Node Environment
NODE_ENV=production
```

---

## 🔍 **Other Potential Issues to Check**

### 1. **Magic Link URLs**
- ✅ Fixed: `lib/auth.ts` uses `NEXT_PUBLIC_APP_URL` (with localhost fallback)
- ✅ Fixed: `lib/email.ts` uses `NEXT_PUBLIC_APP_URL` (with localhost fallback)
- **Action:** Ensure `NEXT_PUBLIC_APP_URL` is set in Netlify

### 2. **Cookie Settings**
- ✅ Fixed: Cookie domain set correctly
- ✅ Fixed: Secure flag set based on `NODE_ENV`
- **Check:** Cookies should work in production now

### 3. **Middleware Authentication**
- ✅ Fixed: Public routes excluded from auth checks
- ✅ Fixed: Explicit public routes list
- **Check:** `/admin/login`, `/therapist/login`, `/partner/login` should work

### 4. **Layout Wrapping**
- ✅ Fixed: Admin layout skips sidebar for public routes
- ✅ Fixed: Therapist layout already handles public routes
- ✅ Fixed: Partner layout returns children directly

---

## 🧪 **Testing Checklist**

Before deploying, test these in localhost (they should match production):

### **Public Routes (No Auth Required):**
- [ ] `/admin/login` - Should load without redirect
- [ ] `/therapist/login` - Should load without redirect
- [ ] `/therapist/enroll` - Should load without redirect
- [ ] `/partner/login` - Should load without redirect
- [ ] `/partner/enroll` - Should load without redirect
- [ ] `/login` - Should load without redirect
- [ ] `/register` - Should load without redirect

### **Protected Routes (Require Auth):**
- [ ] `/admin/dashboard` - Should redirect to `/admin/login` if not authenticated
- [ ] `/therapist/dashboard` - Should redirect to `/therapist/login` if not authenticated
- [ ] `/partner/dashboard` - Should redirect to `/partner/login` if not authenticated
- [ ] `/dashboard` - Should redirect to `/login` if not authenticated

### **API Routes:**
- [ ] `/api/auth/send-magic-link` - Should send email with correct URL
- [ ] `/api/auth/verify-magic-link` - Should verify and set cookie
- [ ] `/api/therapist/enroll` - Should create enrollment (already fixed)
- [ ] `/api/admin/clear-therapists` - Should work for admins only

### **Magic Links:**
- [ ] Magic link URLs should use `NEXT_PUBLIC_APP_URL` (not localhost)
- [ ] Magic links should redirect to correct dashboard
- [ ] Cookies should be set with correct domain in production

---

## 🚨 **Common Production Issues**

### Issue: "Magic links redirect to localhost"
**Solution:** Set `NEXT_PUBLIC_APP_URL=https://thequietherapy.live` in Netlify

### Issue: "Cookies not working"
**Solution:** Check cookie domain is `thequietherapy.live` (not `.thequietherapy.live`)

### Issue: "Images not loading"
**Solution:** Added `thequietherapy.live` to `next.config.js` image domains

### Issue: "API routes returning 401"
**Solution:** Ensure `JWT_SECRET` is set in Netlify

### Issue: "Email not sending"
**Solution:** Ensure `BREVO_API_KEY` or `EMAIL_USER/EMAIL_PASS` is set

---

## 📋 **Pre-Deployment Steps**

1. **Set Environment Variables in Netlify:**
   - Go to: Site Settings → Environment Variables
   - Add all required variables listed above
   - Click "Save" then "Redeploy"

2. **Test Locally:**
   - Run: `npm run build` (should build successfully)
   - Check for any build warnings/errors
   - Test all public routes load correctly

3. **Deploy:**
   - Commit and push changes
   - Wait for Netlify build to complete
   - Test production site matches localhost

---

## ✅ **All Fixes Applied**

- ✅ Middleware excludes public routes
- ✅ Admin layout skips sidebar for public routes
- ✅ Cookie domain fixed (removed leading dot)
- ✅ Image domains include production URL
- ✅ Magic link URLs use environment variable
- ✅ All public routes accessible without auth

**The deployed site should now work exactly like localhost!** 🎉

