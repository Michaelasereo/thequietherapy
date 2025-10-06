# API Route Update Example - Using New Auth Guards

## 🔄 How to Update Your API Routes

### BEFORE (Old Manual Auth Check):

```typescript
// app/api/therapist/profile/route.ts
import { NextRequest, NextResponse } from "next/server"
import { SessionManager } from '@/lib/session-manager'

export async function GET(request: NextRequest) {
  try {
    // Manual auth check - TEDIOUS AND ERROR-PRONE
    const session = await SessionManager.getSessionFromRequest(request)
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    if (session.role !== 'therapist') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const therapistUserId = session.id
    const email = session.email

    // Your actual logic here...
    return NextResponse.json({ success: true, data: {} })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

**Problems with this approach:**
- ❌ 15+ lines just for auth check
- ❌ Generic error messages
- ❌ Easy to forget auth check on new routes
- ❌ No token refresh logic
- ❌ Duplicated code in every route

---

### AFTER (New Auth Guard - Clean & Secure):

```typescript
// app/api/therapist/profile/route.ts
import { NextRequest, NextResponse } from "next/server"
import { therapistGuard } from '@/lib/auth-guard'

export const GET = therapistGuard(async (request) => {
  // ✅ request.user is automatically available and typed
  const therapistUserId = request.user.id
  const email = request.user.email

  // Your actual logic here - no auth boilerplate!
  return NextResponse.json({ 
    success: true, 
    data: { id: therapistUserId, email } 
  })
})
```

**Benefits:**
- ✅ 90% less boilerplate code
- ✅ Automatic token refresh
- ✅ Specific error messages with action hints
- ✅ TypeScript type safety for `request.user`
- ✅ Impossible to forget auth check (enforced by guard)

---

## 📋 Quick Reference: Which Guard to Use?

### Single Role Access:

```typescript
import { individualGuard } from '@/lib/auth-guard'
export const GET = individualGuard(async (request) => {
  // Only individuals can access
})
```

```typescript
import { therapistGuard } from '@/lib/auth-guard'
export const GET = therapistGuard(async (request) => {
  // Only therapists can access
})
```

```typescript
import { adminGuard } from '@/lib/auth-guard'
export const GET = adminGuard(async (request) => {
  // Only admins can access
})
```

### Multiple Roles:

```typescript
import { multiRoleGuard } from '@/lib/auth-guard'
export const GET = multiRoleGuard(['therapist', 'admin'], async (request) => {
  // Both therapists and admins can access
})
```

### Any Authenticated User:

```typescript
import { authGuard } from '@/lib/auth-guard'
export const GET = authGuard(async (request) => {
  // Any logged-in user can access
  // Check request.user.role if you need to customize behavior
})
```

---

## 🔍 Real-World Examples

### Example 1: Therapist Dashboard Data

**Before:**
```typescript
// app/api/therapist/dashboard-data/route.ts
export async function GET(request: NextRequest) {
  const session = await SessionManager.getSessionFromRequest(request)
  if (!session || session.role !== 'therapist') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const therapistId = session.id
  // ... fetch dashboard data
}
```

**After:**
```typescript
import { therapistGuard } from '@/lib/auth-guard'

export const GET = therapistGuard(async (request) => {
  const therapistId = request.user.id
  // ... fetch dashboard data (3 lines saved!)
})
```

---

### Example 2: Session Booking (Multiple Roles)

**Before:**
```typescript
// app/api/sessions/book/route.ts
export async function POST(request: NextRequest) {
  const session = await SessionManager.getSessionFromRequest(request)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  if (session.role !== 'individual' && session.role !== 'therapist') {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }
  
  // ... booking logic
}
```

**After:**
```typescript
import { multiRoleGuard } from '@/lib/auth-guard'

export const POST = multiRoleGuard(['individual', 'therapist'], async (request) => {
  // ... booking logic (8 lines saved!)
})
```

---

### Example 3: Admin Operations

**Before:**
```typescript
// app/api/admin/users/route.ts
export async function GET(request: NextRequest) {
  const session = await SessionManager.getSessionFromRequest(request)
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // ... fetch users
}
```

**After:**
```typescript
import { adminGuard } from '@/lib/auth-guard'

export const GET = adminGuard(async (request) => {
  // ... fetch users (4 lines saved!)
})
```

---

## 🎯 Migration Strategy

### Step 1: Find All Routes Needing Auth
```bash
# Search for manual auth checks
grep -r "SessionManager.getSessionFromRequest" app/api/

# Search for role checks
grep -r "session.role" app/api/
```

### Step 2: Update by Priority

**High Priority (User-facing, data access):**
1. `app/api/therapist/**/*.ts` → `therapistGuard`
2. `app/api/sessions/**/*.ts` → `multiRoleGuard`
3. `app/api/admin/**/*.ts` → `adminGuard`

**Medium Priority (Settings, profile):**
4. `app/api/user/**/*.ts` → `individualGuard`
5. `app/api/partner/**/*.ts` → `partnerGuard`

**Low Priority (Public with optional auth):**
6. Keep as-is or use conditional auth

### Step 3: Test Each Route

```bash
# Test unauthorized access
curl -X GET http://localhost:3000/api/therapist/profile
# Should return: { "error": "AUTH_REQUIRED", "message": "...", "action": "login" }

# Test wrong role
curl -X GET http://localhost:3000/api/therapist/profile \
  -H "Cookie: trpi_session=<individual_user_token>"
# Should return: { "error": "ACCESS_DENIED", "message": "...", "action": "contact_support" }

# Test correct role
curl -X GET http://localhost:3000/api/therapist/profile \
  -H "Cookie: trpi_session=<therapist_token>"
# Should return: Success with data
```

---

## 🚨 Common Mistakes to Avoid

### ❌ WRONG: Don't use guard on public routes

```typescript
// app/api/public-data/route.ts
import { authGuard } from '@/lib/auth-guard'

// This will require auth for public data! 
export const GET = authGuard(async (request) => {
  return NextResponse.json({ publicData: '...' })
})
```

✅ **CORRECT:** No guard needed for truly public routes

```typescript
export async function GET(request: NextRequest) {
  return NextResponse.json({ publicData: '...' })
}
```

---

### ❌ WRONG: Don't nest guards

```typescript
export const GET = therapistGuard(async (request) => {
  // Redundant check - guard already did this!
  if (request.user.role !== 'therapist') {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }
  
  // ...
})
```

✅ **CORRECT:** Trust the guard

```typescript
export const GET = therapistGuard(async (request) => {
  // request.user.role is guaranteed to be 'therapist'
  // ...
})
```

---

### ❌ WRONG: Don't manually parse session cookie

```typescript
export const GET = authGuard(async (request) => {
  const cookie = request.cookies.get('trpi_session')
  const session = JSON.parse(cookie) // WRONG!
  
  // ...
})
```

✅ **CORRECT:** Use request.user

```typescript
export const GET = authGuard(async (request) => {
  const userId = request.user.id // Already parsed and validated
  // ...
})
```

---

## 📊 Code Savings Calculator

### Per Route:
- **Before:** ~15 lines of auth boilerplate
- **After:** 1 line (the guard wrapper)
- **Savings:** 14 lines per route

### For 50 API routes:
- **Lines saved:** 700 lines
- **Bugs prevented:** Countless (consistency enforcement)
- **Maintenance:** Way easier (single source of truth)

---

## 🔐 Security Improvements

The new guards provide:

1. **Automatic Token Refresh**
   - Old: Tokens expire, user kicked out
   - New: Tokens auto-refresh during validation

2. **Specific Error Messages**
   - Old: Generic "Unauthorized"
   - New: "SESSION_EXPIRED: Your session has expired. Please log in again."

3. **Type Safety**
   - Old: `session.id` could be undefined
   - New: `request.user.id` is guaranteed to exist

4. **Consistent Behavior**
   - Old: Each route could implement auth differently
   - New: All routes use same validation logic

---

## 💡 Pro Tips

### Tip 1: Use TypeScript Autocomplete
```typescript
export const GET = therapistGuard(async (request) => {
  // Type 'request.user.' and see available properties!
  request.user.id        // string
  request.user.email     // string
  request.user.role      // 'therapist'
  request.user.is_verified // boolean
})
```

### Tip 2: Destructure for Cleaner Code
```typescript
export const GET = therapistGuard(async (request) => {
  const { id, email, is_verified } = request.user
  
  if (!is_verified) {
    return NextResponse.json({ 
      error: 'Please verify your account first' 
    }, { status: 403 })
  }
  
  // ...
})
```

### Tip 3: Combine with Other Middleware
```typescript
import { therapistGuard } from '@/lib/auth-guard'
import { rateLimit } from '@/lib/rate-limit'

export const POST = therapistGuard(
  rateLimit(100, 'hour')(
    async (request) => {
      // Protected by both auth AND rate limiting
    }
  )
)
```

---

**Ready to migrate?** Start with one route, test it, then roll out to others!

