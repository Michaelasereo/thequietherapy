# TRPI Therapy Platform - Project Overview

**Last Updated**: October 21, 2025  
**Version**: 1.0  
**Purpose**: Primary reference for ongoing development

---

## Table of Contents

1. [Project Introduction](#1-project-introduction)
2. [Quick Start for Developers](#2-quick-start-for-developers)
3. [Architecture at a Glance](#3-architecture-at-a-glance)
4. [Folder Structure & Conventions](#4-folder-structure--conventions)
5. [Data Models & Database](#5-data-models--database)
6. [State Management](#6-state-management)
7. [API Endpoints Reference](#7-api-endpoints-reference)
8. [Key Components Catalog](#8-key-components-catalog)
9. [Third-Party Integrations](#9-third-party-integrations)
10. [Known Issues & Fragile Areas](#10-known-issues--fragile-areas)
11. [Development Guidelines](#11-development-guidelines)
12. [Useful References](#12-useful-references)

---

## 1. Project Introduction

### What is TRPI?

TRPI (The Quiet Therapy Platform) is a comprehensive mental health therapy platform connecting patients with licensed therapists in Nigeria. The platform provides secure video conferencing, session management, credit-based payments, and AI-powered session notes.

### Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Framework** | Next.js | 15.2.4 |
| **UI Library** | React | 19.x |
| **Language** | TypeScript | 5.9.2 |
| **Database** | Supabase (PostgreSQL) | Latest |
| **Styling** | Tailwind CSS | 3.4.17 |
| **UI Components** | Radix UI + shadcn/ui | Latest |
| **Authentication** | Custom Magic Link + Supabase | - |
| **Deployment** | Netlify | - |

### Business Domains

1. **Therapy Booking System**: Users book sessions with therapists
2. **Therapist Management**: Enrollment, verification, profile management
3. **Video Sessions**: Real-time therapy via Daily.co integration
4. **Credit System**: Individual and partner-based credit allocation
5. **Admin Dashboard**: User management, therapist approval, analytics
6. **Partner Portal**: Organizations manage employee therapy benefits

### Target Users

- **Individual Users**: Patients seeking therapy
- **Therapists**: Licensed mental health professionals
- **Partners**: Organizations providing therapy benefits
- **Admins**: Platform administrators

---

## 2. Quick Start for Developers

### Prerequisites

```bash
Node.js >= 18.0.0
npm >= 9.0.0
```

### Installation

```bash
# Clone repository
git clone <repository-url>
cd trpi-app

# Install dependencies
npm install

# Set up environment variables (see .env.example)
cp .env.example .env.local
```

### Required Environment Variables

```env
# Supabase (Database)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Authentication
JWT_SECRET=your-256-bit-secret-key

# Daily.co (Video Sessions)
DAILY_API_KEY=your_daily_api_key
DAILY_DOMAIN=your_domain.daily.co

# OpenAI (AI SOAP Notes - Optional)
OPENAI_API_KEY=your_openai_key

# Paystack (Payments)
PAYSTACK_SECRET_KEY=your_paystack_secret
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=your_paystack_public_key

# Brevo (Email)
BREVO_API_KEY=your_brevo_api_key
SENDER_EMAIL=noreply@yourdomain.com

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Development Workflow

```bash
# Start development server
npm run dev
# → http://localhost:3000

# Run linter
npm run lint

# Build for production
npm run build

# Start production server
npm start
```

### Key npm Scripts

```bash
npm run dev                 # Development server
npm run build              # Production build
npm run start              # Start production server
npm run lint               # Run ESLint
npm run test:db            # Test database connection
npm run test:production    # Production readiness tests
```

### First-Time Setup Checklist

- [ ] Install dependencies (`npm install`)
- [ ] Configure environment variables
- [ ] Verify Supabase connection
- [ ] Run database migrations (see `database-schema.sql`)
- [ ] Create test users (see setup SQL scripts)
- [ ] Test authentication flow
- [ ] Verify video session works (Daily.co)

---

## 3. Architecture at a Glance

### High-Level System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                        │
├─────────────────────────────────────────────────────────────┤
│  React Components  │  Context Providers  │  Custom Hooks    │
│  Pages (App Router)│  State Management   │  UI Components   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                  API ROUTES (Next.js)                        │
├─────────────────────────────────────────────────────────────┤
│  /api/auth/*       │  /api/sessions/*    │  /api/credits/*  │
│  /api/therapist/*  │  /api/availability/*│  /api/partner/*  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                BUSINESS LOGIC (lib/)                         │
├─────────────────────────────────────────────────────────────┤
│  Auth Services     │  Availability Mgmt  │  Credit Tracking │
│  Session Manager   │  Database Utils     │  AI Services     │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┬──────────────┐
        ↓              ↓              ↓              ↓
┌─────────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│  Supabase   │  │ Daily.co │  │ Paystack │  │  OpenAI  │
│ (Database)  │  │  (Video) │  │(Payment) │  │   (AI)   │
└─────────────┘  └──────────┘  └──────────┘  └──────────┘
```

### User Types & Roles

| Role | Description | Access Level |
|------|-------------|--------------|
| **individual** | Regular users booking therapy | User dashboard, booking, sessions |
| **therapist** | Licensed mental health professionals | Therapist dashboard, availability, sessions, notes |
| **partner** | Organizations providing employee benefits | Partner dashboard, member management, credit allocation |
| **admin** | Platform administrators | Admin dashboard, user management, therapist approval |

### Key Architectural Patterns

1. **Next.js App Router**: File-based routing with server/client components
2. **Context API**: Client-side state management (auth, dashboards)
3. **API Routes**: Server-side business logic and data access
4. **Server Components**: Default server-side rendering
5. **Middleware**: Route protection and authentication
6. **Event System**: Custom event emitter for cross-component communication

### Authentication Flow

```
User Login/Signup
    ↓
Magic Link Email Sent
    ↓
User Clicks Link
    ↓
Token Validated (JWT)
    ↓
Session Created (Cookie + Database)
    ↓
User Authenticated
    ↓
Role-Based Redirect
```

---

## 4. Folder Structure & Conventions

### Project Root

```
trpi-app/
├── app/                    # Next.js App Router (pages + API routes)
├── components/             # Reusable React components
├── context/               # React Context providers
├── hooks/                 # Custom React hooks
├── lib/                   # Business logic, services, utilities
├── public/                # Static assets
├── styles/                # Global styles
├── supabase/              # Database schema files
├── scripts/               # Utility scripts
├── tests/                 # Test files
├── *.md                   # Documentation files
└── *.sql                  # Database migration scripts
```

### `/app` - Pages and API Routes

```
app/
├── (routes)               # Pages
│   ├── page.tsx          # Homepage
│   ├── login/            # Login page
│   ├── signup/           # Signup page
│   ├── dashboard/        # User dashboard
│   ├── therapist/        # Therapist section
│   │   ├── dashboard/    # Therapist dashboard
│   │   ├── enroll/       # Therapist enrollment
│   │   └── login/        # Therapist login
│   ├── partner/          # Partner section
│   ├── admin/            # Admin section
│   ├── book-session/     # Booking flow
│   ├── session/[id]/     # Session details
│   └── video-session/    # Video call interface
│
└── api/                   # API endpoints
    ├── auth/             # Authentication endpoints
    ├── sessions/         # Session management
    ├── therapist/        # Therapist-specific APIs
    ├── availability/     # Availability management
    ├── credits/          # Credit system
    ├── partner/          # Partner management
    ├── admin/            # Admin operations
    ├── payments/         # Payment processing
    └── daily/            # Video session management
```

### `/components` - UI Components

```
components/
├── ui/                    # Base UI components (shadcn/ui)
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   └── ...
├── booking/              # Booking flow components
│   ├── DatePicker.tsx
│   ├── TimeSlotGrid.tsx
│   └── BookingConfirmation.tsx
├── availability/         # Availability management
│   ├── AvailabilityManager.tsx
│   ├── WeeklyCalendar.tsx
│   └── TimeSlotEditor.tsx
├── admin/                # Admin components
├── therapist-enrollment-steps/ # Multi-step enrollment
└── [feature-specific]/   # Other feature components
```

### `/lib` - Business Logic

```
lib/
├── supabase.ts           # Supabase client initialization
├── auth/                 # Authentication utilities
│   ├── session.ts        # Session management
│   ├── magic-link.ts     # Magic link generation
│   └── cookies.ts        # Cookie handling
├── availability-service.ts    # Availability logic
├── session-management.ts      # Session CRUD operations
├── credit-tracking-service.ts # Credit system
├── therapist-consistency.ts   # Data consistency manager
├── daily.ts              # Daily.co integration
├── paystack.ts           # Paystack integration
├── ai-services.ts        # AI SOAP notes
└── utils.ts              # Shared utilities
```

### `/context` - State Management

```
context/
├── auth-context.tsx                # Global auth state
├── dashboard-context.tsx           # User dashboard state
├── therapist-user-context.tsx      # Therapist auth state
├── therapist-dashboard-context.tsx # Therapist dashboard state
├── partner-dashboard-context.tsx   # Partner dashboard state
├── admin-dashboard-context.tsx     # Admin dashboard state
└── global-state-context.tsx        # Cross-dashboard sync
```

### `/hooks` - Custom Hooks

```
hooks/
├── useDashboardState.ts            # User dashboard data
├── useTherapistDashboardState.ts   # Therapist dashboard data
├── useUserCredits.ts               # Credit balance
├── useUserSessions.ts              # User sessions
└── usePatientData.ts               # Patient information
```

### Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| **Components** | PascalCase | `BookingConfirmation.tsx` |
| **Hooks** | camelCase with `use` prefix | `useUserCredits.ts` |
| **Utilities** | kebab-case | `availability-service.ts` |
| **API Routes** | kebab-case | `book-simple/route.ts` |
| **Types** | PascalCase | `interface UserSession` |
| **Constants** | UPPER_SNAKE_CASE | `THERAPIST_EVENTS` |

---

## 5. Data Models & Database

### Core Tables Overview

| Table Name | Purpose | Key Relationships |
|------------|---------|-------------------|
| `users` | Central user registry | Referenced by all user-related tables |
| `therapist_profiles` | Public therapist data | FK: `user_id` → `users.id` |
| `therapist_enrollments` | Therapist enrollment/approval | FK: `user_id` → `users.id` |
| `sessions` | Therapy session bookings | FK: `user_id`, `therapist_id` → `users.id` |
| `availability_weekly_schedules` | Therapist availability (new format) | FK: `therapist_id` → `users.id` |
| `user_credits` | Individual user credits | FK: `user_id` → `users.id` |
| `partner_credits` | Partner-allocated credits | FK: `partner_id` → `users.id` |
| `session_notes` | Session transcripts and notes | FK: `session_id` → `sessions.id` |
| `patient_biodata` | Patient health information | FK: `user_id` → `users.id` |
| `magic_links` | Authentication tokens | Email-based lookup |

### Entity Relationship Diagram

```
┌──────────────┐
│    users     │ (Central Hub)
│  id (PK)     │
│  email       │
│  user_type   │
└──────┬───────┘
       │
       ├─────────────────────────────────────────┐
       │                                         │
       ↓                                         ↓
┌──────────────────────┐              ┌──────────────────────┐
│ therapist_profiles   │              │therapist_enrollments │
│  id (PK)             │              │  id (PK)             │
│  user_id (FK)        │              │  user_id (FK)        │
│  specializations     │              │  status              │
│  profile_image_url   │              │  profile_image_url   │
└──────────────────────┘              └──────────────────────┘

       │
       ├─────────────┬─────────────┬──────────────┐
       ↓             ↓             ↓              ↓
┌──────────┐  ┌─────────────┐  ┌────────────┐  ┌─────────────┐
│ sessions │  │user_credits │  │  patient   │  │availability │
│  id (PK) │  │  id (PK)    │  │  biodata   │  │  _weekly_   │
│user_id FK│  │user_id (FK) │  │  id (PK)   │  │  schedules  │
│therapist │  │credits_bal  │  │user_id(FK) │  │therapist_id │
│  _id (FK)│  └─────────────┘  └────────────┘  └─────────────┘
└──────────┘
```

### Critical Data Relationships

**Foreign Key Cascade Rules:**

```sql
-- Most relationships use CASCADE
therapist_profiles.user_id → users.id (ON DELETE CASCADE)
therapist_enrollments.user_id → users.id (ON DELETE CASCADE)
sessions.user_id → users.id (ON DELETE CASCADE)
sessions.therapist_id → users.id (ON DELETE CASCADE)

-- ⚠️ CRITICAL: Deleting a user cascades to 10+ tables!
```

### Data Synchronization Requirements

**⚠️ CRITICAL SYNC**: These fields must stay synchronized across multiple tables:

| Field | Table 1 | Table 2 | Table 3 | Sync Status |
|-------|---------|---------|---------|-------------|
| **Profile Image** | `users.avatar_url` | `therapist_enrollments.profile_image_url` | `therapist_profiles.profile_image_url` | ⚠️ **BROKEN** (only 1/3 updates) |
| **Full Name** | `users.full_name` | `therapist_enrollments.full_name` | - | ✅ Via TherapistConsistencyManager |
| **Email** | `users.email` | `therapist_enrollments.email` | - | ✅ Via TherapistConsistencyManager |
| **Verified Status** | `users.is_verified` | `therapist_enrollments.status` | `therapist_profiles.is_verified` | ✅ Via TherapistConsistencyManager |
| **Bio** | - | `therapist_enrollments.bio` | `therapist_profiles.bio` | ⚠️ Manual sync required |
| **Experience** | - | `therapist_enrollments.experience_years` | `therapist_profiles.experience_years` | ⚠️ Manual sync required |

**Key Database Files:**
- `database-schema.sql` - Complete schema
- `COMPREHENSIVE-SYSTEM-ARCHITECTURE.md` Section 1 - Detailed relationships
- `DATABASE-QUERY-FLOW.md` - Query patterns

---

## 6. State Management

### Context Provider Hierarchy

```typescript
// Root layout (app/layout.tsx)
<AuthProvider>                    // Global authentication
  <GlobalStateProvider>           // Cross-dashboard sync
    
    {/* User-specific contexts */}
    <DashboardProvider>           // Individual user dashboard
      {/* Individual user pages */}
    </DashboardProvider>
    
    {/* Therapist-specific contexts */}
    <TherapistUserProvider>       // Therapist authentication
      <TherapistDashboardProvider> // Therapist dashboard
        {/* Therapist pages */}
      </TherapistDashboardProvider>
    </TherapistUserProvider>
    
    {/* Partner-specific contexts */}
    <PartnerDashboardProvider>    // Partner dashboard
      {/* Partner pages */}
    </PartnerDashboardProvider>
    
    {/* Admin-specific contexts */}
    <AdminDashboardProvider>      // Admin dashboard
      {/* Admin pages */}
    </AdminDashboardProvider>
    
  </GlobalStateProvider>
</AuthProvider>
```

### Context Usage Guide

| Context | When to Use | Key State | Key Methods |
|---------|-------------|-----------|-------------|
| `AuthProvider` | Global auth check, user info | `user`, `isAuthenticated`, `loading` | `login()`, `logout()`, `refreshUser()` |
| `DashboardProvider` | Individual user dashboard | `stats`, `credits`, `sessions` | `fetchDashboardData()`, `refreshCreditBalance()` |
| `TherapistUserProvider` | Therapist-specific auth | `therapist`, `isAuthenticated` | `refreshTherapist()`, `updateTherapist()` |
| `TherapistDashboardProvider` | Therapist dashboard | `stats`, `upcomingSessions`, `iconStates` | `fetchStats()`, `fetchSessions()` |
| `PartnerDashboardProvider` | Partner dashboard | `members`, `creditAllocations` | `addMember()`, `allocateCredits()` |
| `AdminDashboardProvider` | Admin dashboard | `users`, `therapists`, `pendingVerifications` | `approveTherapist()`, `rejectTherapist()` |

### Event System

```typescript
// lib/events.ts
export const THERAPIST_EVENTS = {
  AVATAR_UPDATED: 'therapist:avatar:updated',
  PROFILE_UPDATED: 'therapist:profile:updated',
  AVAILABILITY_UPDATED: 'therapist:availability:updated',
  SESSION_BOOKED: 'therapist:session:booked'
}

// Usage: Emit event
therapistEvents.emit(THERAPIST_EVENTS.AVATAR_UPDATED, { profile_image_url: newUrl })

// Usage: Listen to event
useEffect(() => {
  const handler = (data) => {
    setTherapist(prev => ({ ...prev, ...data }))
  }
  therapistEvents.on(THERAPIST_EVENTS.AVATAR_UPDATED, handler)
  return () => therapistEvents.off(THERAPIST_EVENTS.AVATAR_UPDATED, handler)
}, [])
```

### Client vs Server State

| State Type | Storage | Use Case | Example |
|------------|---------|----------|---------|
| **Client State** | React Context | UI state, form data | Booking flow progress |
| **Server State** | Supabase + API | Persistent data | User profile, sessions |
| **Session State** | Cookies + localStorage | Authentication | JWT token, user ID |
| **Cache State** | In-memory cache | Performance optimization | Availability cache (30s TTL) |

---

## 7. API Endpoints Reference

### Authentication & User Management

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/auth/login` | POST | None | Email login (magic link) |
| `/api/auth/signup` | POST | None | User registration |
| `/api/auth/verify` | GET | None | Verify magic link token |
| `/api/auth/logout` | POST | Required | End user session |
| `/api/auth/me` | GET | Required | Get current user |
| `/api/user/profile` | GET | Required | Get user profile |
| `/api/user/profile` | PUT | Required | Update user profile |

### Therapist Management

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/therapist/enroll` | POST | None | Therapist enrollment |
| `/api/therapist/profile` | GET | Therapist | Get therapist profile |
| `/api/therapist/update-profile` | PUT | Therapist | Update therapist profile |
| `/api/therapist/upload-avatar` | POST | Therapist | Upload profile image |
| `/api/therapists` | GET | None | List verified therapists |
| `/api/therapists/[id]` | GET | None | Get therapist details |

### Availability Management

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/therapist/availability/template` | POST | Therapist | Save availability template |
| `/api/therapist/availability/template` | GET | Therapist | Get availability template |
| `/api/therapist/availability/weekly` | POST | Therapist | Update weekly schedule |
| `/api/therapist/availability/weekly` | GET | None | Get weekly schedule |
| `/api/availability/slots` | GET | None | Get available time slots |
| `/api/availability/days` | GET | None | Get available dates |

### Session & Booking Management

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/sessions/book-simple` | POST | Required | Book a session (simplified) |
| `/api/sessions/book` | POST | Required | Book a session (full) |
| `/api/sessions` | GET | Required | List user sessions |
| `/api/sessions/[id]` | GET | Required | Get session details |
| `/api/sessions/[id]` | PUT | Required | Update session |
| `/api/sessions/[id]` | DELETE | Required | Cancel session |
| `/api/sessions/upcoming` | GET | Required | Get upcoming sessions |
| `/api/sessions/complete` | POST | Therapist | Complete session with notes |

### Credits & Payments

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/credits/user` | GET | Required | Get user credit balance |
| `/api/credits/user` | POST | Required | Add credits to user |
| `/api/credit-packages` | GET | None | List credit packages |
| `/api/payments/initialize` | POST | Required | Initialize payment |
| `/api/paystack/webhook` | POST | None | Paystack webhook handler |

### Partner Management

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/partner/dashboard` | GET | Partner | Get partner dashboard |
| `/api/partner/members` | GET | Partner | List partner members |
| `/api/partner/allocate-credits` | POST | Partner | Allocate credits to member |
| `/api/partner/bulk-upload-members` | POST | Partner | CSV upload of members |

### Admin Operations

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/admin/users` | GET | Admin | List all users |
| `/api/admin/therapists` | GET | Admin | List all therapists |
| `/api/admin/approve-verification` | POST | Admin | Approve therapist |
| `/api/admin/unapprove-therapist` | POST | Admin | Unapprove therapist |
| `/api/admin/stats` | GET | Admin | Get system statistics |

### Video Session Management

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/daily/create-room` | POST | Required | Create Daily.co room |
| `/api/daily/get-room` | GET | Required | Get room details |
| `/api/daily/delete-room` | DELETE | Required | Delete room |
| `/api/transcribe` | POST | Required | Transcribe audio to text |

---

## 8. Key Components Catalog

### Booking Flow Components

```
Booking Flow:
1. TherapistCard (components/therapist-card.tsx)
   → Select therapist from list

2. DatePicker (components/booking/DatePicker.tsx)
   → Select available date
   → Fetches: /api/availability/days

3. TimeSlotGrid (components/booking/TimeSlotGrid.tsx)
   → Select available time slot
   → Fetches: /api/availability/slots

4. BookingConfirmation (components/booking/BookingConfirmation.tsx)
   → Confirm booking details
   → Creates session: /api/sessions/book-simple
```

### Availability Management

```typescript
// components/availability/AvailabilityManager.tsx
// Main availability management interface
- WeeklyCalendar: Set standard weekly hours
- TimeSlotEditor: Define time slots per day
- SessionSettingsEditor: Session duration, buffer time
- AvailabilityOverrides: Date-specific overrides
```

### Video Session Interface

```typescript
// app/video-session/[sessionId]/page.tsx
// Video call interface with Daily.co
- VideoCallInterface: Main video component
- DailyAudioRecorder: Session recording
- SessionChat: In-session messaging
- PostSessionModal: Post-session feedback
```

### Dashboard Components

**User Dashboard:**
- `components/dashboard-sidebar.tsx` - Navigation
- `components/dashboard-stats-card.tsx` - Statistics
- `components/user-credits-display.tsx` - Credit balance

**Therapist Dashboard:**
- `components/therapist-dashboard-sidebar.tsx` - Navigation
- `components/therapist-header.tsx` - Profile header
- `app/therapist/dashboard/availability/page.tsx` - Availability management

**Admin Dashboard:**
- `components/admin/admin-sidebar.tsx` - Navigation
- `components/admin/user-management.tsx` - User management
- `components/admin/pending-verifications-card.tsx` - Approval queue

### Reusable UI Components

Located in `components/ui/` (shadcn/ui components):

```typescript
// Form Components
<Button>, <Input>, <Label>, <Select>, <Checkbox>, <Switch>

// Layout
<Card>, <Dialog>, <Sheet>, <Tabs>, <Accordion>

// Feedback
<Alert>, <Toast>, <Progress>, <Skeleton>

// Navigation
<DropdownMenu>, <NavigationMenu>, <Popover>

// Data Display
<Table>, <Avatar>, <Badge>, <Tooltip>
```

---

## 9. Third-Party Integrations

### Daily.co (Video Conferencing)

**Purpose**: Real-time video therapy sessions

```typescript
// lib/daily.ts
import DailyIframe from '@daily-co/daily-js'

// Create room
await createDailyRoom(sessionId)

// Join room
const callFrame = DailyIframe.createFrame({
  url: dailyRoomUrl,
  showLeaveButton: true,
  iframeStyle: { width: '100%', height: '100%' }
})
```

**Features Used:**
- Room creation/deletion
- Video/audio calls
- Screen sharing
- Recording (browser-based, not Daily's raw audio)
- Participant management

**Environment Variables:**
```env
DAILY_API_KEY=your_daily_api_key
DAILY_DOMAIN=your_domain.daily.co
```

### Paystack (Payment Processing)

**Purpose**: Credit purchases and payments

```typescript
// lib/paystack.ts
import { Paystack } from 'paystack'

// Initialize payment
const response = await paystack.transaction.initialize({
  email: user.email,
  amount: amount * 100, // Kobo
  callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/verify-payment`
})
```

**Features Used:**
- Payment initialization
- Webhook verification
- Transaction verification
- Refund processing

**Environment Variables:**
```env
PAYSTACK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_...
```

### OpenAI / DeepSeek (AI SOAP Notes)

**Purpose**: Generate clinical notes from session transcripts

```typescript
// lib/ai-services.ts
import OpenAI from 'openai'

// Generate SOAP notes
const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [
    { role: 'system', content: 'You are a mental health professional...' },
    { role: 'user', content: transcript }
  ]
})
```

**Features Used:**
- Transcript generation (Whisper API)
- SOAP note generation
- Session summary

**Environment Variables:**
```env
OPENAI_API_KEY=sk-...
DEEPSEEK_API_KEY=your_deepseek_key  # Alternative
```

### Brevo (Email Service)

**Purpose**: Transactional emails

```typescript
// lib/email.ts
import { sendEmail } from './email'

// Send magic link
await sendEmail({
  to: email,
  subject: 'Your Login Link',
  template: 'magic-link',
  data: { loginUrl, firstName }
})
```

**Email Types:**
- Magic link authentication
- Booking confirmations
- Session reminders
- Payment receipts

**Environment Variables:**
```env
BREVO_API_KEY=your_brevo_api_key
SENDER_EMAIL=noreply@yourdomain.com
```

### Supabase (Database + Storage)

**Purpose**: PostgreSQL database and file storage

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Query
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId)
  .single()

// Upload file
const { data, error } = await supabase
  .storage
  .from('avatars')
  .upload(filePath, file)
```

**Features Used:**
- PostgreSQL database
- Row-level security (RLS)
- File storage
- Real-time subscriptions (planned)

**Environment Variables:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## 10. Known Issues & Fragile Areas

### 🔴 Critical Issues

#### 1. Avatar 3-Way Sync Failure

**Problem**: When therapist updates avatar, only 1 of 3 tables is updated

```typescript
// Current (BROKEN):
// Only updates therapist_enrollments.profile_image_url
await supabase
  .from('therapist_enrollments')
  .update({ profile_image_url: newUrl })

// MISSING: users.avatar_url
// MISSING: therapist_profiles.profile_image_url
```

**Impact**: Avatar visible in therapist dashboard but NOT in public listing or admin dashboard

**Fix**: See `COMPREHENSIVE-SYSTEM-ARCHITECTURE.md` Section 7.1

---

#### 2. Specialization Type Mismatch

**Problem**: Field name and type differ between tables

```sql
-- therapist_enrollments
specialization TEXT  -- Singular, TEXT type

-- therapist_profiles
specializations TEXT[]  -- Plural, ARRAY type
```

**Impact**: Data loss when syncing between tables

**Fix**: Standardize to TEXT[] in both tables

---

### 🟡 Medium Priority Issues

#### 3. Date/Time Field Redundancy

**Problem**: Multiple duplicate fields in sessions table

```sql
-- Sessions table has 4 date fields and 4 time fields:
session_date DATE
scheduled_date DATE  -- Duplicate
start_time TIMESTAMPTZ
end_time TIMESTAMPTZ

session_time TIME
scheduled_time TIME  -- Duplicate
duration INTEGER
duration_minutes INTEGER  -- Duplicate
```

**Impact**: Query confusion, potential timezone bugs

**Recommendation**: Consolidate to single format

---

#### 4. Credit System Migration Incomplete

**Problem**: Legacy `users.credits` field still exists alongside new `user_credits` table

```sql
-- OLD (still referenced in some code):
users.credits INTEGER

-- NEW (preferred):
user_credits.credits_balance INTEGER
```

**Impact**: Incorrect credit tracking if using wrong field

**Status**: Migration in progress

---

### 🟢 Known Limitations

#### 5. No Real-Time Updates

**Limitation**: Dashboard updates require manual refresh

**Workaround**: 
- Aggressive cache-busting
- Client-side polling
- Event system for same-tab updates

**Future**: Consider WebSocket/Supabase Realtime

---

#### 6. No Automated Therapist Notifications

**Limitation**: No automatic emails when therapist is approved

**Workaround**: Manual email or admin notification

**Future**: Add to approval workflow

---

### Common Pitfalls

1. **Authentication Check**: Always use `authGuard()` or `requireAuth()` in API routes
2. **Date Handling**: Be consistent with timezone (use `session_date` + `session_time`)
3. **Credit Deduction**: Always use transaction wrapper to prevent race conditions
4. **Avatar Updates**: Remember to update all 3 tables (or use TherapistConsistencyManager)
5. **Cache Invalidation**: Call `AvailabilityCache.invalidate()` after availability changes
6. **Event Listeners**: Always clean up event listeners in `useEffect` return

**For complete risk matrix and recommended fix order, see:**
- `COMPREHENSIVE-SYSTEM-ARCHITECTURE.md` Section 6 & 7
- `ARCHITECTURE-QUICK-REFERENCE.md` - Critical Bugs

---

## 11. Development Guidelines

### Authentication Patterns

**API Route Protection:**

```typescript
// Option 1: Using authGuard (recommended)
import { authGuard } from '@/lib/auth-guard'

export const GET = authGuard(async (request) => {
  // request.user is available
  const userId = request.user.id
  // ... your logic
}, { requiredRole: 'therapist' })

// Option 2: Using requireAuth
import { requireAuth } from '@/lib/server-auth'

export async function GET(request: NextRequest) {
  const session = await requireAuth(['therapist', 'admin'])
  // ... your logic
}
```

**Client-Side Protection:**

```typescript
// Use context hook
const { user, isAuthenticated, loading } = useAuth()

if (loading) return <Spinner />
if (!isAuthenticated) redirect('/login')

// Or use therapist-specific context
const { therapist, isAuthenticated } = useTherapistUser()
```

### Error Handling Conventions

```typescript
// API Routes
try {
  // ... logic
  return NextResponse.json({ success: true, data })
} catch (error) {
  console.error('Error description:', error)
  return NextResponse.json(
    { error: 'User-friendly message' },
    { status: 500 }
  )
}

// Components
try {
  await someAsyncOperation()
  toast.success('Operation successful')
} catch (error) {
  console.error('Error:', error)
  toast.error('Something went wrong. Please try again.')
}
```

### Cache Management Strategies

**Availability Cache (30-second TTL):**

```typescript
// After updating availability
AvailabilityCache.invalidate(therapistId)

// Force no-cache in API response
return NextResponse.json(data, {
  headers: {
    'Cache-Control': 'no-store, no-cache, must-revalidate'
  }
})

// Client-side cache busting
const cacheBuster = Date.now()
fetch(`/api/availability/slots?therapist_id=${id}&_t=${cacheBuster}`, {
  cache: 'no-store'
})
```

### Database Query Patterns

**Always use parameterized queries:**

```typescript
// ✅ GOOD
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId)

// ❌ BAD (SQL injection risk)
const { data } = await supabase.rpc('raw_query', {
  query: `SELECT * FROM users WHERE id = '${userId}'`
})
```

**Use transactions for multi-table updates:**

```typescript
// Use TherapistConsistencyManager for therapist updates
await TherapistConsistencyManager.approveTherapist(email)

// This ensures atomic updates across:
// - users
// - therapist_enrollments  
// - therapist_profiles
```

### Testing Approach

**Manual Testing:**

```bash
# Test authentication
npm run test:auth

# Test video integration
npm run test:video

# Test booking flow
npm run test:booking

# Test database connection
npm run test:db
```

**Database Testing:**

```sql
-- Run consistency audit
SELECT * FROM audit_therapist_consistency();

-- Verify foreign key constraints
SELECT * FROM information_schema.table_constraints
WHERE constraint_type = 'FOREIGN KEY';
```

### Code Review Checklist

Before submitting PR:

- [ ] Authentication properly implemented
- [ ] Error handling added
- [ ] Cache invalidation considered
- [ ] Multi-table sync handled correctly
- [ ] TypeScript types defined
- [ ] API endpoints documented
- [ ] No console.logs in production code
- [ ] Environment variables documented
- [ ] Database migrations included (if schema changed)

---

## 12. Useful References

### Architecture Documentation

| Document | Purpose | When to Read |
|----------|---------|--------------|
| `COMPREHENSIVE-SYSTEM-ARCHITECTURE.md` | Complete technical deep dive (1339 lines) | Understanding entire system |
| `ARCHITECTURE-QUICK-REFERENCE.md` | Quick lookup for common issues | Daily development |
| `DATABASE-RELATIONSHIP-DIAGRAM.md` | Visual database structure | Working with data models |
| `DATABASE-QUERY-FLOW.md` | Query patterns and data flow | Understanding data access |
| `ARCHITECTURE-INDEX.md` | Guide to all architecture docs | Finding specific information |

### Feature-Specific Documentation

| Document | Purpose |
|----------|---------|
| `REAL-TIME-AVAILABILITY-FIX.md` | Availability system fixes |
| `CALENDAR-AVAILABILITY-FIX-PERMANENT.md` | Calendar sync fixes |
| `PARTNER_CREDIT_ALLOCATION_FIX.md` | Partner credit system |
| `PAYMENT_CREDITS_SYSTEM_DOCUMENTATION.md` | Credit and payment flows |
| `AUTHENTICATION_ARCHITECTURE_DOCUMENTATION.md` | Auth system deep dive |

### Setup & Deployment

| Document | Purpose |
|----------|---------|
| `DEPLOYMENT_COMPLETE.md` | Deployment guide |
| `PRODUCTION_READINESS_CHECKLIST.md` | Pre-launch checklist |
| `ENVIRONMENT_SETUP_GUIDE.md` | Development environment |
| `DATABASE_SETUP_GUIDE.md` | Database initialization |

### SQL Scripts Reference

**Schema Creation:**
- `database-schema.sql` - Complete database schema
- `complete-auth-schema.sql` - Authentication tables
- `create-therapist-profiles-table.sql` - Therapist tables

**Migrations:**
- `add-missing-columns.sql` - Schema updates
- `fix-therapist-database-schema.sql` - Therapist fixes
- `emergency-database-fixes.sql` - Emergency patches

**Data Management:**
- `CLEAR-ALL-DATA-FOR-FRESH-START.sql` - Reset database
- `setup-quick-test-accounts.sql` - Create test users
- `PHASE-1-SAFETY-NET.sql` - Safety checks

### Testing Guides

| Document | Purpose |
|----------|---------|
| `MANUAL_TESTING_GUIDE.md` | Manual test procedures |
| `END_TO_END_TESTING_GUIDE.md` | E2E test scenarios |
| `QUICK_MANUAL_TEST_GUIDE.md` | Quick smoke tests |
| `VIDEO_TESTING_GUIDE.md` | Video feature testing |

### Quick Command Reference

```bash
# Development
npm run dev                    # Start dev server
npm run build                  # Production build
npm run lint                   # Run linter

# Database
npm run test:db               # Test DB connection
psql $DATABASE_URL            # Connect to DB

# Testing
npm run test:auth             # Test authentication
npm run test:video:e2e        # Test video features
npm run test:booking          # Test booking flow

# Deployment
git push origin main          # Auto-deploy via Netlify
```

### Environment Variables Quick Reference

```env
# Essential (Required)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
JWT_SECRET=
NEXT_PUBLIC_APP_URL=

# Optional (Feature-Specific)
DAILY_API_KEY=              # Video sessions
PAYSTACK_SECRET_KEY=        # Payments
OPENAI_API_KEY=            # AI notes
BREVO_API_KEY=             # Emails
```

### Support Resources

**Internal:**
- Slack: #trpi-development
- Documentation: This file + linked docs
- Issue Tracker: GitHub Issues

**External:**
- Next.js: https://nextjs.org/docs
- Supabase: https://supabase.com/docs
- Daily.co: https://docs.daily.co
- Tailwind CSS: https://tailwindcss.com/docs

---

## Appendix: Quick Links

### Most Referenced Files

```
# Read First
PROJECT_OVERVIEW.md (this file)
ARCHITECTURE-QUICK-REFERENCE.md
DATABASE-RELATIONSHIP-DIAGRAM.md

# Core Code
lib/supabase.ts
lib/auth-guard.ts
lib/availability-service.ts
context/auth-context.tsx

# Key Components
components/booking/TimeSlotGrid.tsx
components/availability/AvailabilityManager.tsx
app/therapist/dashboard/page.tsx
app/dashboard/page.tsx
```

### Development Workflow

```
1. Pull latest code: git pull origin main
2. Create feature branch: git checkout -b feature/your-feature
3. Make changes
4. Test locally: npm run dev
5. Lint: npm run lint
6. Commit: git commit -m "feat: your feature"
7. Push: git push origin feature/your-feature
8. Create PR on GitHub
9. After approval & merge → Auto-deploys to production
```

---

**Document Status**: ✅ Ready for Use  
**Last Review**: October 21, 2025  
**Next Review**: Monthly or after major changes  
**Maintained By**: Development Team

**Questions or Updates?**  
Open an issue on GitHub or contact the dev team.

---

**Happy Coding! 🚀**

