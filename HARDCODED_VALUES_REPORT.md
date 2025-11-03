# Hardcoded Values & Functionality Report

This document lists all hardcoded functionality found in the codebase that should be made dynamic or configurable.

## 🔴 Critical Issues (User-Facing)

### 1. Hardcoded Dashboard Redirects

**Issue**: Many places still hardcode `/dashboard` instead of using user-type-aware helpers.

**Affected Files:**
- `app/dashboard/sessions/page.tsx` (line 611, 665)
- `app/dashboard/page.tsx` (line 569, 660)
- `app/dashboard/book/page.tsx` (line 149, 182, 200, 270)
- `app/book-session/page.tsx` (line 134, 195)
- `components/booking/BookingConfirmation.tsx` (line 638)
- `app/dashboard/continue-journey/page.tsx` (line 141)
- `components/dashboard-sidebar.tsx` (line 53, 99, 156)
- `components/user-credits-display.tsx` (line 193, 214)
- `components/payment-status.tsx` (line 134, 138, 207)
- `app/video-session/[sessionId]/page.tsx` (line 746) - **Still has one hardcoded link**
- `app/video-call/page.tsx` (line 218, 311)
- `app/sync-booking/page.tsx` (line 44)
- `app/auth/verify/page.tsx` (line 61)
- `app/dashboard/error.tsx` (line 34)

**Solution**: Use `getDashboardUrl()` helper function based on user type.

### 2. Authentication Redirect URLs

**Issue**: Auth endpoints hardcode `/dashboard` redirects.

**Affected Files:**
- `app/api/auth/verify-magic-link/route.ts` (line 75)
- `app/api/auth/verify/route.ts` (line 32, 44)
- `app/api/auth/callback/route.ts` (line 23) - **Has helper but may not be used everywhere**
- `app/api/auth/verify-email/route.ts` (line 206)
- `app/login/page.tsx` (line 20)
- `app/register/page.tsx` (line 79)
- `app/api/dev/auto-login/route.ts` (line 27)
- `actions/unified-auth.ts` (line 167, 175)

**Solution**: Use `getDashboardPath()` helper from `actions/unified-auth.ts` or similar.

### 3. Window Location Usage

**Issue**: Using `window.location.href` instead of Next.js router.

**Affected Files:**
- `app/dev-console/page.tsx` (line 295)
- `app/therapist/dashboard/client-sessions/page.tsx` (line 226)
- `app/therapist/dashboard/video-call/page.tsx` (line 134, 166)
- `app/therapist/dashboard/page.tsx` (line 451, 462, 587, 595)
- `app/dashboard/error.tsx` (line 34)

**Solution**: Replace with `router.push()` or `router.replace()` for better Next.js integration.

## 🟡 Medium Priority Issues

### 4. Hardcoded Localhost URLs

**Issue**: Many files have hardcoded localhost URLs that should use environment variables.

**Affected Files:**
- `lib/email.ts` (line 50, 97) - Uses `process.env.NEXT_PUBLIC_APP_URL` but defaults to localhost:3001
- `app/api/paystack/verify/route.ts` (line 52, 60, 261) - Has env var but hardcoded default
- `lib/auth-config.ts` (line 78) - Hardcoded `http://localhost:3000`

**Solution**: Ensure all use `process.env.NEXT_PUBLIC_APP_URL` without hardcoded defaults.

### 5. API Endpoints with Hardcoded Ports

**Issue**: Test files and some API routes reference specific ports.

**Note**: Most are in test files (`.js` files in root), which is acceptable for testing.

**Solution**: Create a shared config file for test URLs.

## 🟢 Low Priority (Test/Dev Files)

### 6. Test Files with Hardcoded URLs

**Issue**: Many test scripts have hardcoded localhost URLs.

**Affected Files:**
- `test-all-features.js`
- `test-booking-simple.js`
- `test-booking-secured.js`
- Various test files in root directory

**Solution**: These are test files - acceptable but could use environment variables.

## 📋 Recommended Actions

### Priority 1: Fix User-Facing Redirects

1. **Create a centralized dashboard URL helper**:
   ```typescript
   // lib/dashboard-urls.ts
   export function getDashboardUrl(userType?: string): string {
     switch (userType) {
       case 'therapist': return '/therapist/dashboard'
       case 'partner': return '/partner/dashboard'
       case 'admin': return '/admin/dashboard'
       default: return '/dashboard'
     }
   }
   ```

2. **Update all hardcoded `/dashboard` redirects** to use this helper.

3. **Replace `window.location.href`** with Next.js router.

### Priority 2: Fix Auth Redirects

1. Ensure all auth endpoints use the user-type-aware redirect logic.
2. Test all auth flows (login, register, magic link, email verify).

### Priority 3: Environment Variables

1. Review all hardcoded localhost URLs in production code.
2. Ensure `NEXT_PUBLIC_APP_URL` is set in all environments.
3. Remove hardcoded defaults in favor of required env vars.

## 🔍 Files to Review First

1. `app/dashboard/sessions/page.tsx` - Multiple hardcoded redirects
2. `app/dashboard/book/page.tsx` - Multiple hardcoded redirects  
3. `app/api/auth/verify-magic-link/route.ts` - Auth redirect
4. `app/therapist/dashboard/page.tsx` - Window location usage
5. `lib/auth-config.ts` - Hardcoded localhost

## ✅ Already Fixed

- ✅ `app/video-session/[sessionId]/page.tsx` - Has `getDashboardUrl()` helper
- ✅ `app/sessions/[sessionId]/post-session/page.tsx` - Just fixed all "Back to Dashboard" buttons
- ✅ `actions/unified-auth.ts` - Has `getDashboardPath()` helper

