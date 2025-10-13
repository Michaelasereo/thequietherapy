# 🔒 SECURITY QUICK REFERENCE CARD

**Print this out and keep it visible during development!**

---

## 🚨 NEVER DO THESE

```
❌ NEVER hardcode passwords/API keys in source code
❌ NEVER use NEXT_PUBLIC_ prefix for secrets
❌ NEVER commit .env.local to git
❌ NEVER disable authentication checks "temporarily"
❌ NEVER return detailed error messages to client
❌ NEVER trust client-provided user IDs (use session)
❌ NEVER skip rate limiting on auth endpoints
❌ NEVER use sameSite='none' on cookies
```

---

## ✅ ALWAYS DO THESE

```
✅ ALWAYS validate user permissions server-side
✅ ALWAYS use requireApiAuth() for protected endpoints
✅ ALWAYS return generic error messages
✅ ALWAYS use session.user.id (never request.body.user_id)
✅ ALWAYS set httpOnly=true on session cookies
✅ ALWAYS use sameSite='strict' for session cookies
✅ ALWAYS implement rate limiting
✅ ALWAYS log security events (audit log)
```

---

## 📋 SECURE API ROUTE TEMPLATE

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/server-auth'
import { applyRateLimit, createRateLimitHeaders } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    // 1. RATE LIMITING (for public/auth endpoints)
    const rateLimit = await applyRateLimit(request, 'YOUR_ENDPOINT')
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: createRateLimitHeaders(rateLimit) }
      )
    }

    // 2. AUTHENTICATION
    const authResult = await requireApiAuth(['allowed_role'])
    if ('error' in authResult) {
      return authResult.error
    }
    const { session } = authResult
    
    // 3. USE SESSION USER ID (never trust client)
    const userId = session.user.id
    
    // 4. YOUR BUSINESS LOGIC
    const data = await request.json()
    
    // 5. RETURN RESPONSE
    return NextResponse.json({ success: true, data })
    
  } catch (error) {
    console.error('Error:', error)
    // GENERIC ERROR MESSAGE (don't leak details)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}
```

---

## 🔐 SECURE AUTHENTICATION FLOW

```
1. User requests magic link
   └─> Rate limit: 5 attempts / hour
   
2. Generate random token (UUID)
   └─> Store in database with expiry
   
3. Send email with token
   └─> Token valid for 15 min (login) or 24h (signup)
   
4. User clicks link
   └─> Validate token hasn't expired
   └─> Validate token hasn't been used
   └─> Mark token as used
   
5. Create session
   └─> httpOnly, secure, sameSite=strict
   └─> 24-hour expiry
   
6. User authenticated
   └─> All requests validate session server-side
```

---

## 🛡️ ROLE-BASED ACCESS CONTROL

```typescript
// INDIVIDUAL (Patients)
await requireApiAuth(['individual'])
// Can: Book sessions, view own data

// THERAPIST
await requireApiAuth(['therapist'])
// Can: Manage own availability, view own sessions

// PARTNER (Organizations)
await requireApiAuth(['partner'])
// Can: Manage partner members, view partner data

// ADMIN
await requireApiAuth(['admin'])
// Can: Everything (use sparingly!)

// MULTIPLE ROLES
await requireApiAuth(['therapist', 'admin'])
// Either role can access
```

---

## ⚡ RATE LIMITS (Default)

| Endpoint | Limit | Window |
|----------|-------|--------|
| Admin Login | 3 | 15 min |
| Auth Login | 5 | 15 min |
| Registration | 3 | 1 hour |
| Magic Links | 5 | 1 hour |
| Session Booking | 10 | 1 hour |
| Payments | 20 | 1 hour |
| Public API | 100 | 1 hour |

---

## 🍪 COOKIE SECURITY

```typescript
// CORRECT Configuration
{
  httpOnly: true,        // ✓ Not accessible via JavaScript
  secure: true,          // ✓ HTTPS only (production)
  sameSite: 'strict',    // ✓ CSRF protection
  path: '/',             // ✓ Site-wide
  maxAge: 60 * 60 * 24   // ✓ 24 hours
}

// WRONG Configuration
{
  httpOnly: false,       // ✗ XSS vulnerable
  secure: false,         // ✗ Can be stolen via HTTP
  sameSite: 'none',      // ✗ CSRF vulnerable
  maxAge: 60 * 60 * 24 * 365  // ✗ Too long
}
```

---

## 🔑 ENVIRONMENT VARIABLES

```bash
# REQUIRED
JWT_SECRET=<openssl rand -base64 32>
ADMIN_EMAILS=admin1@app.com,admin2@app.com

# SUPABASE
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # NO NEXT_PUBLIC!

# VIDEO
DAILY_API_KEY=xxx
DAILY_DOMAIN=yourapp.daily.co

# AI
OPENAI_API_KEY=sk-xxx
DEEPSEEK_API_KEY=xxx

# PAYMENTS
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxx
PAYSTACK_SECRET_KEY=sk_test_xxx  # NO NEXT_PUBLIC!
```

---

## 🚨 SECURITY INCIDENT RESPONSE

```
IF BREACH DETECTED:

1. IMMEDIATE (0-5 min)
   - Enable maintenance mode
   - Revoke all sessions
   - Disable compromised endpoints
   
2. SHORT-TERM (5-30 min)
   - Rotate all secrets
   - Review logs for entry point
   - Identify affected users
   
3. MEDIUM-TERM (30 min - 4 hours)
   - Fix vulnerability
   - Test fix
   - Deploy patch
   
4. LONG-TERM (4+ hours)
   - Notify affected users
   - Post-mortem analysis
   - Implement monitoring
```

---

## 📞 SECURITY CONTACTS

| Issue | Action |
|-------|--------|
| Secret exposed in git | Rotate immediately, check git history |
| Suspicious login attempts | Review logs, block IP if needed |
| Rate limit bypassed | Increase security, add IP banning |
| Session hijacking suspected | Revoke all sessions, force re-login |
| Data breach confirmed | Follow incident response plan |

---

## 🧪 TESTING COMMANDS

```bash
# Test rate limiting
for i in {1..10}; do curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" -d '{"email":"test@test.com"}'; done

# Test authentication
curl http://localhost:3000/api/admin/users
# Expected: 401 Unauthorized

# Test RBAC
# Login as therapist, try admin endpoint
# Expected: 403 Forbidden

# Check cookie security
# DevTools > Application > Cookies
# Verify: httpOnly, secure, sameSite=Strict
```

---

## ✅ PRE-DEPLOYMENT CHECKLIST

```
[ ] All secrets in environment variables (not code)
[ ] .env.local in .gitignore
[ ] Rate limiting enabled on auth endpoints
[ ] Cookie security configured (httpOnly, strict, 24h)
[ ] Middleware fails closed (not open)
[ ] Admin system uses magic links only
[ ] All POST endpoints require authentication
[ ] Error messages don't leak information
[ ] RBAC properly configured
[ ] Audit logging enabled
[ ] Security headers configured
[ ] CORS policy documented
```

---

## 🎯 SECURITY SCORE

| Component | Before | After | Target |
|-----------|--------|-------|--------|
| Auth System | 0/10 | 8/10 | 9/10 |
| Session Mgmt | 4/10 | 8/10 | 9/10 |
| Route Protection | 3/10 | 7/10 | 9/10 |
| RBAC | 6/10 | 8/10 | 9/10 |
| CSRF Protection | 0/10 | 7/10 | 9/10 |
| Rate Limiting | 0/10 | 8/10 | 9/10 |
| **OVERALL** | **3.6/10** | **7.5/10** | **9/10** |

---

**Remember:** Security is not a feature, it's a requirement.  
**Every line of code is a potential vulnerability.**  
**Always assume the attacker knows your source code.**

---

**Last Updated:** 2025-10-11  
**Version:** 1.0  
**Status:** Active

