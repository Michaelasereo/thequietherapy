# ✅ Video Session Redirect Fix

**Issue:** Therapists joining ended video sessions were redirected to the wrong dashboard (user dashboard instead of therapist dashboard).

**Root Cause:** Hardcoded `/dashboard` redirects throughout the video session pages.

**Files Fixed:**
1. `app/video-session/[sessionId]/page.tsx` - Main video session page
2. `app/sessions/[sessionId]/post-session/page.tsx` - Post-session review page

**Changes Made:**

### 1. Video Session Page (`app/video-session/[sessionId]/page.tsx`)

**Added:**
- Import `userType` from `useAuth` context
- Helper function `getDashboardUrl()` to determine correct dashboard based on user type

**Fixed:**
- All `router.push('/dashboard')` calls now use `getDashboardUrl()`
- Fixed 5 redirect locations:
  - After leaving session (success)
  - After leaving session (API fail)
  - After leaving session (error)
  - After session end error
  - Back to Dashboard button

### 2. Post-Session Page (`app/sessions/[sessionId]/post-session/page.tsx`)

**Added:**
- Import `userType` from `useAuth` context (renamed to `authUserType`)
- Helper function `getDashboardUrl()` to determine correct dashboard

**Fixed:**
- All `router.push('/dashboard')` calls now use `getDashboardUrl()`
- Fixed 5 redirect locations:
  - Unauthorized access
  - Session not completed
  - Failed to load session data
  - Error loading session data
  - Back to Dashboard button
  - View All Sessions button

### Helper Function

```typescript
const getDashboardUrl = () => {
  switch (userType) {
    case 'therapist':
      return '/therapist/dashboard'
    case 'partner':
      return '/partner/dashboard'
    case 'admin':
      return '/admin/dashboard'
    default:
      return '/dashboard'
  }
}
```

**Result:** All users now get redirected to their correct dashboard based on their user type! ✅

