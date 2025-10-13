# Authentication System - Quick Reference

## System Overview
- **Type**: Passwordless (Magic Link) Authentication
- **Session**: JWT stored in HttpOnly cookies
- **Database**: PostgreSQL via Supabase
- **Email**: Brevo SMTP
- **Token Library**: jose (JWT)

---

## Key File Locations

### Core Auth Logic
- `lib/auth.ts` - Magic link creation & verification
- `lib/server-session-manager.ts` - JWT session management (server)
- `lib/client-session-manager.ts` - Session helpers (client)
- `lib/unified-auth.ts` - Unified auth operations
- `middleware.ts` - Route protection

### API Endpoints
- `app/api/auth/signup/route.ts`
- `app/api/auth/login/route.ts`
- `app/api/auth/send-magic-link/route.ts`
- `app/api/auth/verify-magic-link/route.ts`
- `app/api/auth/logout/route.ts`
- `app/api/auth/me/route.ts`

### Security
- `lib/rate-limit.ts` - Rate limiting
- `lib/audit-logger.ts` - HIPAA-compliant logging
- `next.config.js` - Security headers

### Context
- `context/auth-context.tsx` - React auth provider

---

## Authentication Flow (30-Second Summary)

```
User enters email → Magic link sent → User clicks link 
→ Token verified → JWT created → HttpOnly cookie set 
→ Redirected to dashboard
```

**Key Security Features:**
- ✅ HttpOnly cookies (XSS-safe)
- ✅ JWT signed with HS256
- ✅ Atomic token verification (single-use)
- ✅ Rate limiting (10 requests/hour)
- ✅ Audit logging for all events
- ✅ CSRF protection via SameSite cookies

---

## Critical Security Configurations

### JWT Settings
```typescript
// lib/server-session-manager.ts
Algorithm: HS256
Expiry: 7 days
Secret: process.env.JWT_SECRET (256-bit required)
Storage: HttpOnly cookie named 'quiet_session'
```

### Cookie Configuration
```typescript
{
  httpOnly: true,              // ✅ XSS protection
  secure: true (prod),         // ✅ HTTPS only
  sameSite: 'lax',             // ✅ CSRF protection
  maxAge: 7 days,
  path: '/'
}
```

### Rate Limits
- Magic link requests: **10 per hour per email**
- Magic link verification: **3 attempts per token**
- Auth attempts: **100 per hour per IP**

### Token Expiry
- Magic links: **24 hours** (regular users), **15 minutes** (healthcare)
- JWT sessions: **7 days**

---

## Password Security
**N/A** - This system is **passwordless**. No password hashing libraries used.

---

## User Roles (RBAC)

| Role         | Access Level        | Routes              |
|--------------|---------------------|---------------------|
| `individual` | Patient/Client      | `/dashboard`        |
| `therapist`  | Licensed Therapist  | `/therapist/*`      |
| `partner`    | Organization Admin  | `/partner/*`        |
| `admin`      | Platform Admin      | `/admin/*`          |

### Role Protection Example
```typescript
import { authGuard } from '@/lib/auth-guard'

export const GET = authGuard(
  async (request) => {
    // Handler code
  },
  { requiredRole: 'therapist' }
)
```

---

## Database Tables

### Core Tables
1. **users** - User profiles
2. **user_sessions** - Active sessions
3. **magic_links** - Email verification tokens
4. **audit_logs** - Authentication events
5. **rate_limit_attempts** - Rate limiting records

### Critical Indexes
```sql
-- Performance critical
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_magic_links_token ON magic_links(token);
CREATE INDEX idx_users_email ON users(email);
```

---

## Environment Variables

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx
JWT_SECRET=256-bit-secret
BREVO_SMTP_USER=xxx
BREVO_SMTP_PASS=xxx
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Optional
SENDER_EMAIL=noreply@yourdomain.com
NODE_ENV=production
```

**Generate JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Common Code Patterns

### Server-Side: Get Current User
```typescript
import { ServerSessionManager } from '@/lib/server-session-manager'

const session = await ServerSessionManager.getSession()
if (!session) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

const userId = session.id
const userEmail = session.email
```

### Client-Side: Auth Context
```typescript
'use client'
import { useAuth } from '@/context/auth-context'

const { user, loading, isAuthenticated, logout } = useAuth()

if (loading) return <div>Loading...</div>
if (!isAuthenticated) return <div>Please log in</div>

return <div>Welcome, {user.full_name}!</div>
```

### Middleware: Protect Routes
```typescript
// middleware.ts - Already configured
// Automatically protects:
// - /admin/*
// - /partner/*
// - /therapist/*
// - /dashboard/*
```

---

## API Endpoint Usage

### Send Magic Link
```bash
POST /api/auth/send-magic-link
Content-Type: application/json

{
  "email": "user@example.com",
  "user_type": "individual",
  "type": "login"
}
```

### Get Current User
```bash
GET /api/auth/me
Cookie: quiet_session=<jwt>

Response:
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "user_type": "individual"
  }
}
```

### Logout
```bash
POST /api/auth/logout
Cookie: quiet_session=<jwt>

Response:
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## Security Best Practices Implemented

### ✅ Implemented
- HttpOnly cookies (XSS prevention)
- JWT signing with secret key
- Rate limiting on all auth endpoints
- Atomic token verification (no replay attacks)
- Session invalidation on logout
- CSRF protection via SameSite cookies
- Security headers in next.config.js
- Audit logging for all auth events
- Input validation and sanitization
- Row Level Security (RLS) in database

### ⚠️ Consider Adding (Optional)
- IP-based session validation
- Device fingerprinting
- Email notifications on new login
- Remember me functionality
- 2FA/MFA support
- Session activity dashboard

---

## Common Pitfalls to Avoid

❌ **Don't** store JWT in localStorage (XSS vulnerability)  
✅ **Do** use HttpOnly cookies

❌ **Don't** trust client-side user data  
✅ **Do** validate on server using session

❌ **Don't** use weak JWT secrets  
✅ **Do** use 256-bit cryptographically secure secrets

❌ **Don't** allow magic link reuse  
✅ **Do** mark as used atomically in database

❌ **Don't** skip rate limiting  
✅ **Do** implement on all auth endpoints

---

## Testing Commands

```bash
# Test email configuration
curl -X POST http://localhost:3000/api/auth/send-magic-link \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","user_type":"individual","type":"login"}'

# Test session (in browser console)
fetch('/api/auth/me', { credentials: 'include' })
  .then(r => r.json())
  .then(console.log)

# Test logout
fetch('/api/auth/logout', { 
  method: 'POST', 
  credentials: 'include' 
}).then(r => r.json()).then(console.log)
```

---

## Debugging Checklist

Session not persisting?
- [ ] Check JWT_SECRET is set
- [ ] Verify cookie exists (DevTools → Application → Cookies)
- [ ] Check cookie domain matches request domain
- [ ] Ensure secure flag matches protocol (http vs https)

Magic link not working?
- [ ] Check Brevo SMTP credentials
- [ ] Verify token hasn't expired (24 hours)
- [ ] Check if already used (query magic_links table)
- [ ] Verify email service logs

Rate limited?
- [ ] Wait 1 hour for window to reset
- [ ] Check rate_limit_attempts table
- [ ] Adjust limits in lib/rate-limit.ts if needed

---

## Quick Migration Checklist

To replicate this auth system:
1. [ ] Copy all files from `lib/` auth modules
2. [ ] Copy all files from `app/api/auth/`
3. [ ] Copy `context/auth-context.tsx`
4. [ ] Copy `middleware.ts`
5. [ ] Run database schema SQL
6. [ ] Set environment variables
7. [ ] Update `next.config.js` with security headers
8. [ ] Install dependencies: `@supabase/supabase-js`, `jose`, `nodemailer`
9. [ ] Test login flow end-to-end

---

## Key Functions Reference

### Creating a Magic Link
```typescript
import { createMagicLinkForAuthType } from '@/lib/auth'

const result = await createMagicLinkForAuthType(
  'user@example.com',
  'individual', // or 'therapist', 'partner', 'admin'
  'login',      // or 'signup'
  { first_name: 'John' } // optional metadata
)
```

### Verifying a Magic Link
```typescript
import { verifyMagicLinkForAuthType } from '@/lib/auth'

const result = await verifyMagicLinkForAuthType(
  token,      // UUID from email link
  'individual' // user type
)

if (result.success) {
  const user = result.user
  // Create session, redirect to dashboard
}
```

### Creating a Session
```typescript
import { ServerSessionManager } from '@/lib/server-session-manager'

const token = await ServerSessionManager.createSession({
  id: user.id,
  email: user.email,
  name: user.full_name,
  user_type: user.user_type,
  is_verified: true,
  is_active: true
})

// Token is automatically set in HttpOnly cookie
```

### Validating a Session
```typescript
import { ServerSessionManager } from '@/lib/server-session-manager'

const session = await ServerSessionManager.getSession()

if (!session) {
  // Not authenticated
}

// session contains: { id, email, name, role, user_type, ... }
```

### Logging Out
```typescript
import { UnifiedAuth } from '@/lib/unified-auth'

await UnifiedAuth.logout()
// Clears cookie, invalidates DB session, clears legacy cookies
```

---

## Audit Log Event Types

```typescript
type AuthEventType = 
  | 'login_attempt'
  | 'login_success'
  | 'login_failure'
  | 'logout'
  | 'session_refresh'
  | 'session_expired'
  | 'magic_link_sent'
  | 'magic_link_verified'
  | 'magic_link_failed'
  | 'password_reset_request'  // Not used
  | 'password_reset_success'  // Not used
  | 'account_created'
  | 'account_deleted'
  | 'role_changed'
  | 'permissions_modified'
  | 'suspicious_activity'
  | 'session_hijack_attempt'
  | 'rate_limit_exceeded'
```

### Logging Example
```typescript
import { AuditLogger } from '@/lib/audit-logger'

await AuditLogger.logLoginSuccess(userId, {
  email: user.email,
  ip_address: request.headers.get('x-forwarded-for'),
  user_agent: request.headers.get('user-agent')
})
```

---

## Security Headers (next.config.js)

```javascript
{
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'; ...",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
}
```

---

## Performance Considerations

### Critical Indexes
```sql
-- Add these for optimal performance
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX idx_magic_links_token ON magic_links(token);
CREATE INDEX idx_users_email ON users(email);
```

### Session Validation Caching
```typescript
// Auth context caches validation for 10 seconds
// Reduces database load by ~90%
if (now - lastValidationRef.current < 10000 && user) {
  return true // Use cached result
}
```

### Rate Limit Cleanup
```typescript
// Run periodically (cron job)
import { RateLimiter } from '@/lib/rate-limit'

await RateLimiter.cleanup()
// Deletes records older than 24 hours
```

---

## HIPAA Compliance Notes

This system implements HIPAA-compliant features:
- ✅ Audit logs for all authentication events
- ✅ User ID tracking (not PII in logs)
- ✅ Session invalidation on logout
- ✅ Automatic session expiry
- ✅ Rate limiting to prevent brute force
- ✅ Encrypted sessions (JWT signed)

**Note:** Healthcare workers get shorter magic link expiry (15 min vs 24 hours) for enhanced security.

---

## Troubleshooting Decision Tree

```
Session issues?
├─ Cookie not set? → Check JWT_SECRET env var
├─ Cookie not sent? → Check domain/path/secure settings
├─ Token expired? → Session is 7 days, user must re-login
└─ Token invalid? → Check JWT_SECRET hasn't changed

Magic link issues?
├─ Email not received? → Check Brevo credentials
├─ Link expired? → Request new link (24h expiry)
├─ Link not working? → Check if already used (single-use)
└─ Wrong user type? → user_type must match account

Rate limit issues?
├─ Too many requests? → Wait 1 hour
├─ Legitimate user? → Increase limit in code
└─ Attack detected? → Check audit_logs table

Auth errors?
├─ 401 Unauthorized? → Session expired or invalid
├─ 403 Forbidden? → Wrong user role
└─ 429 Too Many Requests? → Rate limited
```

---

**For full documentation, see:** `AUTHENTICATION_ARCHITECTURE_DOCUMENTATION.md`

**Last Updated:** October 8, 2025  
**Version:** 1.0.0

