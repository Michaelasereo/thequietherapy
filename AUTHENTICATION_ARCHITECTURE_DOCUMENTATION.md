# Authentication System Architecture Documentation

## Table of Contents
1. [Overview](#overview)
2. [Authentication Flow Architecture](#authentication-flow-architecture)
3. [Security Implementation](#security-implementation)
4. [User Management](#user-management)
5. [Third-Party Integrations](#third-party-integrations)
6. [API Reference](#api-reference)
7. [Environment Variables](#environment-variables)
8. [Database Schema](#database-schema)
9. [Replication Guide](#replication-guide)

---

## Overview

This application uses a **passwordless authentication system** based on **magic links** (email-based one-time login links) with JWT session management. The system is built on top of Supabase for database and auth infrastructure, with custom middleware for enhanced security.

### Key Features
- ✅ Passwordless magic link authentication
- ✅ Role-based access control (RBAC) - 4 user types
- ✅ JWT-based session management with HttpOnly cookies
- ✅ Rate limiting and brute force protection
- ✅ HIPAA-compliant audit logging
- ✅ Atomic magic link verification (single-use tokens)
- ✅ Automatic session refresh and cleanup
- ✅ Cross-device session management

### Architecture Stack
- **Backend**: Next.js 15 (App Router)
- **Database**: PostgreSQL (via Supabase)
- **Auth Provider**: Custom + Supabase Auth
- **Email Service**: Brevo (formerly Sendinblue)
- **Token Library**: jose (JWT signing/verification)
- **Session Storage**: Database + HttpOnly cookies

---

## Authentication Flow Architecture

### 1. Registration/Signup Flow

```
┌─────────────┐
│   User      │
│ Enters      │
│ Email +     │
│ Name        │
└──────┬──────┘
       │
       ▼
┌──────────────────────────────────────┐
│ POST /api/auth/signup                │
│ - Validates email format             │
│ - Checks if user already exists      │
│ - Validates user type                │
│ - Enforces admin restrictions        │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ createMagicLinkForAuthType()         │
│ lib/auth.ts                          │
│ - Rate limit check (10/hour)         │
│ - Generate UUID token                │
│ - Set expiry (24h or 15min)          │
│ - Store in magic_links table         │
│ - Send email via Brevo               │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ User clicks link in email            │
│ GET /api/auth/verify-magic-link      │
│   ?token={uuid}&auth_type={type}     │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ verifyMagicLinkForAuthType()         │
│ - Rate limit check (3 attempts)      │
│ - Verify token exists & not used     │
│ - Check expiration                   │
│ - ATOMIC: Mark as used (race safe)   │
│ - Create user in DB + Supabase Auth  │
│ - Generate session token             │
│ - Store in user_sessions table       │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ ServerSessionManager.createSession() │
│ - Create JWT with user data          │
│ - Sign with JWT_SECRET               │
│ - Set HttpOnly cookie                │
│ - Redirect to dashboard              │
└──────────────────────────────────────┘
```

**Key Files:**
- `app/api/auth/signup/route.ts` - Signup endpoint
- `app/api/auth/send-magic-link/route.ts` - Magic link sender
- `app/api/auth/verify-magic-link/route.ts` - Verification handler
- `lib/auth.ts` - Core auth logic
- `lib/server-session-manager.ts` - JWT session management

### 2. Login Flow

```
┌─────────────┐
│   User      │
│ Enters      │
│ Email       │
└──────┬──────┘
       │
       ▼
┌──────────────────────────────────────┐
│ POST /api/auth/login                 │
│ - Validates email format             │
│ - Checks user exists in DB           │
│ - Validates user_type matches        │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ createMagicLinkForAuthType()         │
│ (Same as signup, but type='login')  │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ User clicks link → Verification      │
│ (Same flow as signup)                │
└──────────────────────────────────────┘
```

**Key Files:**
- `app/api/auth/login/route.ts` - Login endpoint
- Same verification flow as signup

### 3. Session Management

```
┌──────────────────────────────────────┐
│ Client Request with Cookie           │
│ Cookie: quiet_session=jwt_token      │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ middleware.ts (Protected Routes)     │
│ - Extracts JWT from cookie           │
│ - Validates with Supabase            │
│ - Checks expiration                  │
│ - Redirects if invalid               │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ API Routes                           │
│ ServerSessionManager.getSession()    │
│ - Verify JWT signature               │
│ - Check expiration                   │
│ - Return user data                   │
└──────────────────────────────────────┘
```

**Session Lifecycle:**
- **Duration**: 7 days from creation
- **Storage**: JWT in HttpOnly cookie + session record in DB
- **Refresh**: No automatic refresh (re-login required)
- **Invalidation**: On logout, marks session in DB as invalidated

**Key Files:**
- `middleware.ts` - Route protection
- `lib/server-session-manager.ts` - Session operations
- `lib/client-session-manager.ts` - Client-side session helpers
- `context/auth-context.tsx` - React auth context

### 4. Logout Flow

```
┌─────────────┐
│ User clicks │
│   Logout    │
└──────┬──────┘
       │
       ▼
┌──────────────────────────────────────┐
│ POST /api/auth/logout                │
│ UnifiedAuth.logout()                 │
│ - Get current session from cookie    │
│ - Mark session as invalidated in DB  │
│ - Clear HttpOnly cookie              │
│ - Clear legacy cookies               │
│ - Audit log: logout event            │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ Redirect to /login                   │
└──────────────────────────────────────┘
```

**Key Files:**
- `app/api/auth/logout/route.ts` - Logout endpoint
- `lib/unified-auth.ts` - Unified logout logic

---

## Security Implementation

### 1. Password Hashing
**NOT APPLICABLE** - This system uses passwordless authentication via magic links.

### 2. Token Generation & Validation

#### Magic Link Tokens
```typescript
// Generation (lib/auth.ts)
import { randomUUID } from 'crypto'

const token = randomUUID() // Cryptographically secure UUID v4
const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

// Healthcare users get shorter expiry for security
const isHealthcare = email.includes('@clinic.') || email.includes('.health')
const expiry = isHealthcare ? 15 * 60 * 1000 : 24 * 60 * 60 * 1000
```

#### JWT Session Tokens
```typescript
// Generation (lib/server-session-manager.ts)
import { SignJWT } from 'jose'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET)

const token = await new SignJWT({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  user_type: user.user_type,
  is_verified: user.is_verified,
  is_active: user.is_active
})
  .setProtectedHeader({ alg: 'HS256' })
  .setIssuedAt()
  .setExpirationTime('7d') // 7 days
  .sign(JWT_SECRET)

// Validation
import { jwtVerify } from 'jose'

const { payload } = await jwtVerify(token, JWT_SECRET)
// Returns user data if valid, throws if expired/invalid
```

**Security Configurations:**
- **Algorithm**: HS256 (HMAC with SHA-256)
- **Token Expiry**: 7 days
- **Secret**: Environment variable `JWT_SECRET`
- **Storage**: HttpOnly cookie (XSS-safe)

### 3. Token Storage Method

#### HttpOnly Cookies (Primary)
```typescript
// Setting cookie (lib/server-session-manager.ts)
response.cookies.set({
  name: 'quiet_session',
  value: jwtToken,
  httpOnly: true,              // ✅ XSS protection
  secure: NODE_ENV === 'production', // ✅ HTTPS only in prod
  sameSite: 'lax',             // ✅ CSRF protection
  maxAge: 7 * 24 * 60 * 60,    // 7 days
  path: '/',
})
```

**Why HttpOnly?**
- ❌ JavaScript cannot access the cookie (prevents XSS attacks)
- ✅ Automatically sent with every request to same domain
- ✅ Cannot be stolen via XSS exploits

#### Database Session Records
```typescript
// user_sessions table stores session metadata
{
  id: uuid,
  user_id: uuid (FK to users),
  session_token: text (JWT token),
  expires_at: timestamp,
  created_at: timestamp,
  last_accessed_at: timestamp,
  user_agent: text (optional),
  ip_address: inet (optional),
  invalidated_at: timestamp (null until logout)
}
```

### 4. CSRF Protection

**Implemented via:**
- **SameSite Cookie Attribute**: `sameSite: 'lax'`
- **Security Headers**: See `next.config.js`

```typescript
// next.config.js
{
  key: 'Content-Security-Policy',
  value: [
    "default-src 'self'",
    "frame-ancestors 'none'",  // Prevents clickjacking
    "form-action 'self'",       // Limits form submissions
  ].join('; ')
}
```

**Additional Headers:**
- `X-Frame-Options: DENY` - Prevents iframe embedding
- `X-Content-Type-Options: nosniff` - Prevents MIME sniffing
- `Strict-Transport-Security` - Forces HTTPS

### 5. Rate Limiting

**Implementation:** `lib/rate-limit.ts`

```typescript
export class RateLimiter {
  // Magic link requests: 10 per hour per email
  static async checkMagicLinkRequest(email: string): Promise<boolean> {
    return this.checkLimit({
      identifier: email.toLowerCase(),
      action: 'magic_link_request',
      maxAttempts: 10,
      windowMs: 60 * 60 * 1000 // 1 hour
    })
  }

  // Magic link verification: 3 attempts per token
  static async checkMagicLinkVerification(token: string): Promise<boolean> {
    return this.checkLimit({
      identifier: `token_${token}`,
      action: 'magic_link_verify',
      maxAttempts: 3,
      windowMs: 60 * 60 * 1000 // 1 hour
    })
  }

  // Auth attempts from IP: 100 per hour
  static async checkAuthAttempts(ipAddress: string): Promise<boolean> {
    return this.checkLimit({
      identifier: ipAddress,
      action: 'auth_attempt',
      maxAttempts: 100,
      windowMs: 60 * 60 * 1000
    })
  }
}
```

**Storage:** `rate_limit_attempts` table in PostgreSQL

**Key Features:**
- Per-email rate limiting for magic links
- Per-token verification limits (prevents brute force)
- Per-IP global rate limiting
- Automatic cleanup of old records

### 6. Input Validation & Sanitization

```typescript
// Email validation (app/api/auth/send-magic-link/route.ts)
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
if (!emailRegex.test(email.trim())) {
  return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
}

// User type validation (app/api/auth/signup/route.ts)
const validUserTypes = ['individual', 'therapist', 'partner', 'admin']
if (!validUserTypes.includes(userType)) {
  return NextResponse.json({ error: 'Invalid user type' }, { status: 400 })
}

// Admin signup restriction
if (userType === 'admin' && email !== 'michaelasereoo@gmail.com') {
  return NextResponse.json({ 
    error: 'Admin signup restricted' 
  }, { status: 403 })
}
```

### 7. Audit Logging (HIPAA-Compliant)

**Implementation:** `lib/audit-logger.ts`

```typescript
export class AuditLogger {
  static async logLoginSuccess(userId: string, metadata: AuditLogMetadata) {
    await this.logAuthEvent(userId, 'login_success', {
      ...metadata,
      message: 'User logged in successfully'
    })
  }

  static async logMagicLinkSent(email: string, metadata: AuditLogMetadata) {
    await this.logAuthEvent(null, 'magic_link_sent', {
      ...metadata,
      email,
      message: 'Magic link sent to user'
    })
  }

  static async logRateLimitExceeded(identifier: string, action: string) {
    // Critical: Log potential attacks
  }

  static async logSessionHijackAttempt(userId: string, metadata) {
    // Critical: Log suspicious activity
  }
}
```

**Logged Events:**
- `login_attempt`, `login_success`, `login_failure`
- `logout`
- `magic_link_sent`, `magic_link_verified`, `magic_link_failed`
- `session_refresh`, `session_expired`
- `rate_limit_exceeded`
- `suspicious_activity`, `session_hijack_attempt`

**Storage:** `audit_logs` table with:
- User ID
- Event type
- IP address
- User agent
- Device fingerprint
- Session ID
- Metadata (JSONB)
- Timestamp

---

## User Management

### 1. User Schema

**Primary Table:** `public.users`

```sql
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    user_type VARCHAR(50) DEFAULT 'individual' 
        CHECK (user_type IN ('individual', 'partner', 'therapist', 'admin')),
    partner_id UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    credits INTEGER DEFAULT 1,
    package_type VARCHAR(50) DEFAULT 'Basic',
    avatar_url TEXT
);
```

**Indexes:**
```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_user_type ON users(user_type);
CREATE INDEX idx_users_is_verified ON users(is_verified);
```

### 2. Role-Based Access Control (RBAC)

#### User Types / Roles

| Role         | Description                        | Access Level |
|--------------|------------------------------------|--------------|
| `individual` | Regular users (patients/clients)   | Standard     |
| `therapist`  | Licensed therapists                | Professional |
| `partner`    | Organization partners              | Organizational |
| `admin`      | Platform administrators            | Full access  |

#### Route Protection

**Middleware** (`middleware.ts`)
```typescript
export const config = {
  matcher: [
    '/admin/:path*',      // Admin only
    '/partner/:path*',    // Partner only
    '/therapist/:path*',  // Therapist only
    '/dashboard/:path*'   // Any authenticated user
  ]
}

export async function middleware(request: NextRequest) {
  const supabase = createServerClient(/* ... */)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}
```

**API Route Guards** (`lib/auth-guard.ts`)
```typescript
export function authGuard(
  handler: (request: NextRequest & { user?: any }) => Promise<NextResponse>,
  options?: {
    requiredRole?: 'individual' | 'therapist' | 'partner' | 'admin'
    allowedRoles?: Array<'individual' | 'therapist' | 'partner' | 'admin'>
  }
) {
  return async (request: NextRequest) => {
    const session = await ServerSessionManager.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (options?.requiredRole && session.role !== options.requiredRole) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (options?.allowedRoles && !options.allowedRoles.includes(session.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return handler({ ...request, user: session })
  }
}
```

**Usage Example:**
```typescript
// app/api/therapist/dashboard/route.ts
import { authGuard } from '@/lib/auth-guard'

export const GET = authGuard(
  async (request) => {
    const user = request.user
    // User is guaranteed to be a therapist here
    return NextResponse.json({ data: '...' })
  },
  { requiredRole: 'therapist' }
)
```

### 3. Password Reset Flow

**NOT IMPLEMENTED** - System uses passwordless authentication. Users can request a new magic link anytime.

### 4. Email Verification Process

**Verification is handled through magic links:**

1. User signs up → Magic link sent
2. User clicks link → Email automatically verified
3. `is_verified` flag set to `true` in database
4. User redirected to dashboard

**No separate email verification step required.**

---

## Third-Party Integrations

### 1. Supabase

**Purpose:** Backend-as-a-Service (Database + Auth)

**Configuration:**
```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

**Usage:**
- **Database**: PostgreSQL queries via Supabase client
- **Auth**: User management in Supabase Auth
- **RLS**: Row-Level Security policies
- **Storage**: File uploads (if needed)

**Sync Process:**
- Custom `users` table in public schema
- Synced with Supabase Auth via `lib/supabase-auth-sync.ts`
- Allows custom fields beyond Supabase Auth limitations

### 2. Brevo (Email Service)

**Purpose:** Magic link email delivery

**Configuration:**
```typescript
// lib/email.ts
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_PASS,
  },
})
```

**Email Templates:**
- **Signup**: Welcome email with magic link
- **Login**: Login magic link
- **Booking**: Session booking confirmation with magic link

**Key Function:**
```typescript
export async function sendMagicLinkEmail(
  email: string, 
  verificationUrl: string, 
  type: 'booking' | 'login' | 'signup',
  metadata?: any
) {
  const mailOptions = {
    from: 'Quiet <noreply@trpi.com>',
    to: email,
    subject: 'Login to Your Quiet Account',
    html: `
      <h2>Login to Quiet</h2>
      <p>Click the button below to securely log in:</p>
      <a href="${verificationUrl}">Login to Account</a>
      <p>This link will expire in 24 hours.</p>
    `
  }

  await transporter.sendMail(mailOptions)
}
```

### 3. No OAuth Providers

This system does **NOT** use OAuth providers (Google, GitHub, etc.). It's a completely custom magic link implementation.

### 4. API Key Management

**Environment Variables** (see below) are used for all API keys. No API key storage in database.

---

## API Reference

### Authentication Endpoints

#### POST `/api/auth/signup`
**Purpose:** Create new user account

**Request Body:**
```json
{
  "email": "user@example.com",
  "fullName": "John Doe",
  "userType": "individual"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification link sent to your email",
  "user": {
    "email": "user@example.com",
    "full_name": "John Doe"
  }
}
```

#### POST `/api/auth/login`
**Purpose:** Send login magic link

**Request Body:**
```json
{
  "email": "user@example.com",
  "userType": "individual"
}
```

#### POST `/api/auth/send-magic-link`
**Purpose:** Send magic link (unified endpoint)

**Request Body:**
```json
{
  "email": "user@example.com",
  "user_type": "individual",
  "type": "login" // or "signup"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Magic link sent! Please check your email."
}
```

**Rate Limits:**
- 10 requests per hour per email
- 3 requests per minute per email

#### GET `/api/auth/verify-magic-link`
**Purpose:** Verify magic link and create session

**Query Parameters:**
- `token`: UUID magic link token
- `auth_type`: User type (individual/therapist/partner/admin)

**Success:** Redirects to dashboard with session cookie set

**Error:** Redirects to error page

#### POST `/api/auth/logout`
**Purpose:** Invalidate session and clear cookies

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### GET `/api/auth/me`
**Purpose:** Get current user session

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "user_type": "individual",
    "is_authenticated": true
  }
}
```

---

## Environment Variables

### Required Variables

```bash
# ========================================
# DATABASE & AUTH (Supabase)
# ========================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ========================================
# JWT SESSION SECRET
# ========================================
JWT_SECRET=your-256-bit-secret-key-here-change-in-production

# ========================================
# EMAIL SERVICE (Brevo)
# ========================================
BREVO_SMTP_USER=your-brevo-smtp-login
BREVO_SMTP_PASS=your-brevo-smtp-password
SENDER_EMAIL=noreply@yourdomain.com

# ========================================
# APPLICATION
# ========================================
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NODE_ENV=production
```

### Optional Variables

```bash
# ========================================
# PAYMENT PROCESSING (Paystack)
# ========================================
PAYSTACK_SECRET_KEY=sk_live_...
PAYSTACK_PUBLIC_KEY=pk_live_...

# ========================================
# VIDEO CONFERENCING (Daily.co)
# ========================================
DAILY_API_KEY=your-daily-api-key
DAILY_DOMAIN=your-domain.daily.co

# ========================================
# AI FEATURES (OpenAI)
# ========================================
OPENAI_API_KEY=sk-...
```

### How to Generate JWT_SECRET

```bash
# Method 1: Using Node.js crypto
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Method 2: Using OpenSSL
openssl rand -hex 32

# Method 3: Using online generator
# Visit: https://generate-secret.now.sh/32
```

---

## Database Schema

### Core Auth Tables

#### 1. `users` Table
```sql
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    user_type VARCHAR(50) DEFAULT 'individual' 
        CHECK (user_type IN ('individual', 'partner', 'therapist', 'admin')),
    partner_id UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    credits INTEGER DEFAULT 1,
    package_type VARCHAR(50) DEFAULT 'Basic',
    avatar_url TEXT
);
```

#### 2. `user_sessions` Table
```sql
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    invalidated_at TIMESTAMP WITH TIME ZONE,
    user_agent TEXT,
    ip_address INET
);

CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);
```

#### 3. `magic_links` Table
```sql
CREATE TABLE magic_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    token TEXT NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('signup', 'login', 'password_reset')),
    auth_type VARCHAR(50) CHECK (auth_type IN ('individual', 'therapist', 'partner', 'admin')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB
);

CREATE INDEX idx_magic_links_email ON magic_links(email);
CREATE INDEX idx_magic_links_token ON magic_links(token);
CREATE INDEX idx_magic_links_expires_at ON magic_links(expires_at);
```

#### 4. `audit_logs` Table
```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    event_type VARCHAR(100) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    device_fingerprint TEXT,
    session_id UUID,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

#### 5. `rate_limit_attempts` Table
```sql
CREATE TABLE rate_limit_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    identifier VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_rate_limit_identifier ON rate_limit_attempts(identifier, action);
CREATE INDEX idx_rate_limit_created_at ON rate_limit_attempts(created_at);
```

### Row Level Security (RLS) Policies

```sql
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Service role has full access
CREATE POLICY "Service role can manage users" ON users
    FOR ALL USING (auth.role() = 'service_role');

-- Similar policies for other tables
```

---

## Replication Guide

### How to Replicate This Auth System in a New Project

#### Step 1: Install Dependencies

```bash
npm install @supabase/supabase-js @supabase/ssr jose nodemailer
npm install --save-dev @types/nodemailer
```

#### Step 2: Set Up Environment Variables

Create `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-key
JWT_SECRET=generate-a-secret
BREVO_SMTP_USER=your-smtp-user
BREVO_SMTP_PASS=your-smtp-password
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### Step 3: Create Database Schema

Run this SQL in Supabase SQL Editor:
```sql
-- Copy contents from complete-auth-schema.sql
-- Or run the setup script:
```

#### Step 4: Copy Core Auth Files

**Essential Files to Copy:**
```
lib/
  ├── auth.ts                    # Core auth logic
  ├── server-session-manager.ts  # JWT session management
  ├── client-session-manager.ts  # Client session helpers
  ├── unified-auth.ts            # Unified auth operations
  ├── rate-limit.ts              # Rate limiting
  ├── audit-logger.ts            # Audit logging
  ├── email.ts                   # Email sending
  └── supabase-auth-sync.ts      # Supabase sync

app/api/auth/
  ├── signup/route.ts            # Signup endpoint
  ├── login/route.ts             # Login endpoint
  ├── send-magic-link/route.ts   # Magic link sender
  ├── verify-magic-link/route.ts # Verification
  ├── logout/route.ts            # Logout
  └── me/route.ts                # Get current user

context/
  └── auth-context.tsx           # React auth context

middleware.ts                    # Route protection
```

#### Step 5: Update Next.js Config

Add security headers to `next.config.js`:
```javascript
async headers() {
  return [{
    source: '/(.*)',
    headers: [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    ]
  }]
}
```

#### Step 6: Create Auth Pages

```
app/
  ├── login/page.tsx
  ├── register/page.tsx
  └── dashboard/page.tsx
```

#### Step 7: Wrap App with AuthProvider

```typescript
// app/layout.tsx
import { AuthProvider } from '@/context/auth-context'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
```

#### Step 8: Use Auth in Components

```typescript
'use client'
import { useAuth } from '@/context/auth-context'

export default function MyComponent() {
  const { user, loading, isAuthenticated, logout } = useAuth()

  if (loading) return <div>Loading...</div>
  if (!isAuthenticated) return <div>Please log in</div>

  return (
    <div>
      <p>Welcome, {user.full_name}!</p>
      <button onClick={logout}>Logout</button>
    </div>
  )
}
```

#### Step 9: Protect API Routes

```typescript
// app/api/protected/route.ts
import { ServerSessionManager } from '@/lib/server-session-manager'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const session = await ServerSessionManager.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // User is authenticated
  return NextResponse.json({ data: 'protected data' })
}
```

### Key Principles to Maintain

1. **Always use HttpOnly cookies** for session storage
2. **Never trust client-side data** - always validate on server
3. **Implement rate limiting** on all auth endpoints
4. **Log all auth events** for audit trails
5. **Use atomic operations** for critical updates (magic link usage)
6. **Validate user input** - especially email formats
7. **Keep JWT secrets secure** - never commit to git
8. **Set appropriate cookie flags** - httpOnly, secure, sameSite

---

## Testing Checklist

### Manual Testing

- [ ] User can sign up with email
- [ ] Magic link received in email
- [ ] Click magic link → redirects to dashboard
- [ ] User session persists across page refreshes
- [ ] Logout clears session
- [ ] Cannot access protected routes without login
- [ ] Rate limiting works (try 10+ magic link requests)
- [ ] Magic link expires after 24 hours
- [ ] Cannot reuse same magic link twice
- [ ] Therapist/Partner/Admin roles have correct access

### Security Testing

- [ ] XSS attack via email input fails
- [ ] Session cookie is HttpOnly (check DevTools)
- [ ] CSRF protection works (try forged requests)
- [ ] Rate limiting prevents brute force
- [ ] Audit logs capture all auth events
- [ ] Logout invalidates session in database

---

## Troubleshooting

### Common Issues

**1. Magic link not received**
- Check Brevo SMTP credentials
- Check spam folder
- Verify email is valid
- Check server logs for email errors

**2. Session not persisting**
- Verify `JWT_SECRET` is set
- Check cookie is being set (DevTools → Application)
- Verify domain matches (localhost vs 127.0.0.1)
- Check cookie expiration

**3. "Unauthorized" errors**
- Check session expiration (7 days)
- Verify JWT_SECRET hasn't changed
- Clear cookies and re-login
- Check middleware is running

**4. Rate limit errors**
- Wait for rate limit window to expire (1 hour)
- Clear `rate_limit_attempts` table in dev
- Check rate limit configuration

---

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [jose (JWT) Library](https://github.com/panva/jose)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [HIPAA Compliance Guide](https://www.hhs.gov/hipaa/index.html)

---

## Contact & Support

For questions about this authentication system, consult:
- Project documentation in `/docs` folder
- Audit logs in database for debugging
- Server logs for runtime errors

---

**Last Updated:** October 8, 2025  
**Version:** 1.0.0  
**Maintained by:** Trpi Platform Team

