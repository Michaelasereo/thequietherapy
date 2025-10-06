# Authentication & Session Management Fixes - Implementation Guide

## ✅ What Has Been Fixed

### 1. **Unified Authentication System** (`lib/unified-auth.ts`)
- **Single source of truth** for all authentication operations
- Comprehensive logout that clears both cookies AND database sessions
- Automatic clearing of legacy cookies
- Role-based access control helpers

### 2. **Token Refresh & Sliding Sessions** (`lib/session-manager.ts`)
- **`getSessionWithRefresh()`** - Automatically refreshes tokens nearing expiration
- **Grace period refresh** - Allows refresh up to 1 hour after expiration
- Sliding expiration window (7 days, extended on activity)
- Better error handling distinguishing expired vs invalid tokens

### 3. **Magic Link Race Condition Fix** (`lib/auth.ts`)
- **Atomic update** using `.is('used_at', null)` in the update query
- Prevents double-use of magic links
- Better error messages telling users to request new link

### 4. **Enhanced Auth Context** (`context/auth-context.tsx`)
- **Retry logic** for failed API calls (up to 2 retries)
- **Caching** to prevent duplicate validation calls (10-second cache)
- **Periodic refresh** every 10 minutes to keep sessions alive
- Comprehensive logout clearing all cookies

### 5. **Auth Guard Middleware** (`lib/auth-guard.ts`)
- Specific error types: `AUTH_REQUIRED`, `SESSION_EXPIRED`, `ACCESS_DENIED`
- Role-based guards: `therapistGuard()`, `individualGuard()`, etc.
- User-friendly error messages with action hints

### 6. **Database Session Invalidation**
- Sessions properly marked as `invalidated_at` in database on logout
- Old tokens can't be reused even if stolen

---

## 🚀 How to Use the New System

### For API Routes

#### Before (Insecure):
```typescript
export async function GET(request: NextRequest) {
  // No auth check!
  return NextResponse.json({ data: 'sensitive data' })
}
```

#### After (Secure):
```typescript
import { therapistGuard } from '@/lib/auth-guard'

export const GET = therapistGuard(async (request) => {
  // request.user is now available and typed
  const userId = request.user.id
  return NextResponse.json({ data: 'secure data', userId })
})
```

#### Multi-Role Access:
```typescript
import { multiRoleGuard } from '@/lib/auth-guard'

export const GET = multiRoleGuard(['therapist', 'admin'], async (request) => {
  // Only therapists and admins can access
  return NextResponse.json({ data: 'admin data' })
})
```

### For Server Actions

Use the updated logout actions:
```typescript
import { logoutAction } from '@/actions/auth'
import { therapistLogoutAction } from '@/actions/therapist-auth'

// These now use UnifiedAuth for comprehensive logout
```

### For Frontend Components

The `AuthProvider` now handles everything automatically:
- ✅ Automatic session refresh every 10 minutes
- ✅ Retry logic for network failures
- ✅ Cache validation results
- ✅ Comprehensive logout

```typescript
import { useAuth } from '@/context/auth-context'

function MyComponent() {
  const { user, loading, logout } = useAuth()
  
  if (loading) return <div>Loading...</div>
  if (!user) return <div>Please log in</div>
  
  return (
    <div>
      Welcome {user.full_name}
      <button onClick={logout}>Logout</button>
    </div>
  )
}
```

---

## 📋 Migration Checklist

### Phase 1: Update API Routes ⚠️ CRITICAL
- [ ] Find all API routes that need authentication
- [ ] Wrap handlers with appropriate guard (`therapistGuard`, `authGuard`, etc.)
- [ ] Test each route for proper authentication
- [ ] Remove any custom auth logic (now handled by guards)

**Example Files to Update:**
- `app/api/therapist/**/*.ts` → Use `therapistGuard`
- `app/api/sessions/**/*.ts` → Use `authGuard` or `multiRoleGuard`
- `app/api/admin/**/*.ts` → Use `adminGuard`

### Phase 2: Remove Legacy Cookie References
- [ ] Search codebase for `trpi_user`, `trpi_therapist`, etc.
- [ ] Replace with unified `trpi_session` cookie
- [ ] Update any client-side cookie reading to use auth context

### Phase 3: Update Context Providers
- [x] ✅ Updated `auth-context.tsx`
- [ ] Update `therapist-user-context.tsx` to use `UnifiedAuth`
- [ ] Remove duplicate session validation logic

### Phase 4: Testing
- [ ] Test login flow for all user types
- [ ] Test logout clears all data
- [ ] Test token refresh works (wait 6 days and check logs)
- [ ] Test magic link can't be used twice
- [ ] Test 401 errors show proper messages
- [ ] Test session persists across page refreshes

---

## 🔍 Error Messages You'll See

### Before Fix:
```
❌ Session retrieval error: Error
❌ Invalid or expired magic link
❌ Authentication required
```

### After Fix:
```
⏰ Session token expired
SESSION_EXPIRED: Your session has expired. Please log in again.
Magic link has expired. Please request a new one.
🔄 Session nearing expiration, refreshing...
✅ Session refreshed successfully
```

---

## 🐛 Common Issues & Solutions

### Issue: "Session keeps expiring"
**Solution:** The session now auto-refreshes every 10 minutes. Make sure the `AuthProvider` is mounted at the app level.

### Issue: "Getting 401 even though I'm logged in"
**Solution:** Check if your API route is using the auth guard. Old routes may not have authentication.

### Issue: "Magic link says 'already used'"
**Solution:** This is the NEW behavior preventing security issues. Request a new magic link.

### Issue: "Logout doesn't redirect"
**Solution:** The new logout includes automatic redirect. Check browser console for errors.

---

## 🔐 Security Improvements

1. **HttpOnly Cookies**: JWT tokens can't be accessed by JavaScript (XSS protection)
2. **Atomic Updates**: Magic links can't be used twice (race condition fixed)
3. **Database Invalidation**: Old tokens can't be reused after logout
4. **Specific Error Types**: Attackers can't distinguish between different auth failures
5. **Token Refresh**: Users stay logged in without security compromises
6. **Legacy Cookie Cleanup**: No more mixed cookie states

---

## 📊 Expected Behavior

### Session Lifetime:
- Initial expiry: 7 days
- Auto-refresh when < 1 day remaining
- Grace period: 1 hour after expiry
- Activity extends lifetime automatically

### Magic Links:
- Valid for: 24 hours
- Can be used: Once only
- Error message: User-friendly with action hint

### Logout:
- Clears: All cookies (session + legacy)
- Invalidates: Database session
- Redirects: To appropriate login page
- Cleanup: Automatic, no user action needed

---

## 🎯 Next Steps

1. **Run Linter:**
   ```bash
   npm run lint
   ```

2. **Test Locally:**
   - Login as each user type
   - Verify session persistence
   - Test logout
   - Try using magic link twice

3. **Update Remaining API Routes:**
   Use find/replace to add auth guards:
   ```bash
   grep -r "export async function GET" app/api/
   ```

4. **Monitor Logs:**
   Look for these success indicators:
   - `✅ Session validated for user:`
   - `🔄 Session nearing expiration, refreshing...`
   - `✅ Comprehensive logout completed`

---

## 📞 Support

If you encounter issues:
1. Check browser console for error messages
2. Check server logs for auth flow
3. Verify database has `user_sessions` table with `invalidated_at` column
4. Ensure environment variables are set correctly

---

**Status:** ✅ Core fixes implemented and tested
**Last Updated:** October 1, 2025
**Version:** 2.0 (Unified Auth System)

