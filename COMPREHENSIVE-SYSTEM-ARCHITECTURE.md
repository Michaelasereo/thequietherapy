# 🏗️ COMPREHENSIVE SYSTEM ARCHITECTURE ANALYSIS
## TRPI Therapy Platform - Complete Technical Documentation

**Generated**: October 20, 2025  
**Purpose**: Complete system architecture, data flows, and cross-system dependencies  
**Status**: Production System Analysis

---

## 📋 TABLE OF CONTENTS

1. [Database Schema & Relationships](#1-database-schema--relationships)
2. [Data Flow Dependencies](#2-data-flow-dependencies)
3. [State Management Hierarchy](#3-state-management-hierarchy)
4. [Cross-System Impact Patterns](#4-cross-system-impact-patterns)
5. [API Endpoint Dependencies](#5-api-endpoint-dependencies)
6. [Breakage Points & Risk Matrix](#6-breakage-points--risk-matrix)
7. [Recommended Fix Order](#7-recommended-fix-order)

---

## 1. DATABASE SCHEMA & RELATIONSHIPS

### 1.1 Core Tables Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CORE ENTITIES                             │
├─────────────────────────────────────────────────────────────────┤
│  users (Central Auth Table)                                      │
│  ├── therapist_profiles (1:1 relationship)                       │
│  ├── therapist_enrollments (1:1 relationship)                    │
│  ├── sessions (1:many as user or therapist)                      │
│  ├── user_credits (1:1 relationship)                             │
│  ├── patient_biodata (1:1 relationship)                          │
│  └── availability_weekly_schedules (1:1 for therapists)          │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Detailed Table Relationships

#### **USERS TABLE** (Central Hub)
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    user_type VARCHAR(50) CHECK (user_type IN ('individual', 'therapist', 'admin', 'partner')),
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    credits INTEGER DEFAULT 0,  -- ⚠️ LEGACY FIELD (being replaced)
    avatar_url TEXT,  -- ⚠️ May also appear as profile_image_url
    session_token VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Foreign Key Relationships:**
- **OUTGOING**: `id` → referenced by 15+ tables
- **INCOMING**: None (root table)

**Critical Dependencies:**
1. `therapist_profiles.user_id` → `users.id` (ON DELETE CASCADE)
2. `therapist_enrollments.user_id` → `users.id` (ON DELETE CASCADE)
3. `sessions.user_id` → `users.id` (ON DELETE CASCADE)
4. `sessions.therapist_id` → `users.id` (ON DELETE CASCADE)
5. `availability_weekly_schedules.therapist_id` → `users.id`
6. `user_credits.user_id` → `users.id` (ON DELETE CASCADE)
7. `partner_credits.partner_id` → `users.id`

---

#### **THERAPIST_ENROLLMENTS TABLE** (Enrollment/Approval System)
```sql
CREATE TABLE therapist_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    mdcn_code VARCHAR(50),  -- ⚠️ Renamed from licensed_qualification
    specialization TEXT,
    bio TEXT,
    experience_years INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Document storage
    license_document TEXT,
    id_document TEXT,
    
    -- Profile image tracking
    profile_image_url TEXT,  -- ⚠️ CRITICAL: Primary image field
    
    -- Edit tracking
    edited_fields TEXT[],
    original_enrollment_data JSONB,
    profile_updated_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id),
    UNIQUE(email)
);
```

**⚠️ CRITICAL SYNC REQUIREMENT**: Must stay synchronized with `users` table  
**Sync Manager**: `TherapistConsistencyManager` class handles atomicity

**Duplicated/Synced Fields** (Consistency Risk):
- `full_name` ↔ `users.full_name`
- `email` ↔ `users.email`
- `is_active` ↔ `users.is_active`
- `is_verified` ↔ mapped to `status='approved'`
- `profile_image_url` ↔ `users.avatar_url` (⚠️ NAME MISMATCH)

---

#### **THERAPIST_PROFILES TABLE** (Public Profile Data)
```sql
CREATE TABLE therapist_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    specializations TEXT[],
    bio TEXT,
    session_rate DECIMAL(10,2) DEFAULT 0.00,
    languages TEXT[],
    experience_years INTEGER DEFAULT 0,
    profile_image_url VARCHAR(500),  -- ⚠️ ANOTHER IMAGE FIELD
    verification_status VARCHAR(50) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected', 'approved')),
    is_verified BOOLEAN DEFAULT false,
    availability_status VARCHAR(50) DEFAULT 'available',
    total_sessions INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);
```

**⚠️ CRITICAL SYNC REQUIREMENT**: Must stay synchronized with `therapist_enrollments`

**Duplicated/Synced Fields** (Consistency Risk):
- `bio` ↔ `therapist_enrollments.bio`
- `experience_years` ↔ `therapist_enrollments.experience_years`
- `profile_image_url` ↔ `therapist_enrollments.profile_image_url` ↔ `users.avatar_url` (**⚠️ 3-WAY SYNC**)
- `verification_status` ↔ `therapist_enrollments.status`
- `is_verified` ↔ `therapist_enrollments.is_verified` ↔ `users.is_verified`

---

#### **SESSIONS TABLE** (Booking System)
```sql
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    therapist_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Date/Time storage (⚠️ MULTIPLE FORMATS)
    session_date DATE,  -- NEW: YYYY-MM-DD
    session_time TIME,  -- NEW: HH:MM
    start_time TIMESTAMPTZ NOT NULL,  -- LEGACY: Full datetime
    end_time TIMESTAMPTZ,  -- LEGACY: Full datetime
    scheduled_date DATE,  -- DUPLICATE of session_date
    scheduled_time TIME,  -- DUPLICATE of session_time
    
    duration INTEGER DEFAULT 60,  -- Minutes
    duration_minutes INTEGER,  -- DUPLICATE of duration
    actual_duration_minutes INTEGER,
    planned_duration_minutes INTEGER,
    
    status VARCHAR(50) DEFAULT 'scheduled',
    title VARCHAR(255),
    description TEXT,
    notes TEXT,
    
    -- Daily.co integration
    daily_room_name VARCHAR(255),
    daily_room_url VARCHAR(500),
    
    -- Credits
    credit_used_id UUID,
    is_free_session BOOLEAN DEFAULT false,
    
    -- Scheduling
    scheduled_by_therapist BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**⚠️ CRITICAL ISSUE**: `session_type` column referenced in code but **DOES NOT EXIST** in schema

**Date/Time Fields Redundancy**:
- **4 different date fields**: `session_date`, `scheduled_date`, `start_time::date`, `end_time::date`
- **4 different time fields**: `session_time`, `scheduled_time`, `start_time::time`, `end_time::time`
- **3 duration fields**: `duration`, `duration_minutes`, `planned_duration_minutes`

---

#### **AVAILABILITY_WEEKLY_SCHEDULES TABLE** (New Availability System)
```sql
CREATE TABLE availability_weekly_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    therapist_id UUID REFERENCES users(id) ON DELETE CASCADE,
    template_name VARCHAR(100) DEFAULT 'primary',
    weekly_availability JSONB NOT NULL,  -- WeeklyAvailability object
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**WeeklyAvailability JSONB Structure**:
```typescript
{
  standardHours: {
    monday: { enabled: boolean, timeSlots: [...], generalHours: {...} },
    tuesday: { enabled: boolean, timeSlots: [...], generalHours: {...} },
    // ... rest of week
  },
  overrides: [...],  // Specific date overrides
  sessionSettings: {
    duration: number,
    bufferTime: number,
    maxDailyBookings: number
  }
}
```

**⚠️ COEXISTS WITH**: `availability_templates` (legacy), `therapist_availability` (older legacy)

---

#### **USER_CREDITS & PARTNER_CREDITS** (Credit System)
```sql
-- Individual user credits
CREATE TABLE user_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    user_type VARCHAR(20),
    credits_balance INTEGER DEFAULT 0,
    credits_purchased INTEGER DEFAULT 0,
    credits_used INTEGER DEFAULT 0,
    last_credit_purchase_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, user_type)
);

-- Partner-allocated credits
CREATE TABLE partner_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID REFERENCES users(id),
    employee_email VARCHAR(255) NOT NULL,
    employee_name VARCHAR(255),
    credits_allocated INTEGER DEFAULT 1,
    credits_used INTEGER DEFAULT 0,
    session_duration_minutes INTEGER DEFAULT 25,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired', 'revoked')),
    session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
    used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**⚠️ CRITICAL**: `users.credits` field is **LEGACY** and being phased out  
**New System**: Uses `user_credits` and `partner_credits` tables

---

### 1.3 Data Synchronization Matrix

| Field Name | users | therapist_enrollments | therapist_profiles | Notes |
|------------|-------|----------------------|-------------------|-------|
| `full_name` | ✅ | ✅ | ❌ | 2-way sync required |
| `email` | ✅ | ✅ | ❌ | 2-way sync required |
| `is_active` | ✅ | ✅ | ❌ | 2-way sync required |
| `is_verified` | ✅ | ✅ | ✅ | 3-way sync required |
| `profile_image_url` | `avatar_url` | ✅ | ✅ | **⚠️ 3-WAY SYNC WITH NAME MISMATCH** |
| `bio` | ❌ | ✅ | ✅ | 2-way sync required |
| `experience_years` | ❌ | ✅ | ✅ | 2-way sync required |
| `specialization(s)` | ❌ | `specialization` (TEXT) | `specializations` (TEXT[]) | **⚠️ TYPE MISMATCH** |

**🚨 HIGH RISK FIELDS**:
1. **`profile_image_url` / `avatar_url`**: 3-way sync with different names
2. **`specialization` vs `specializations`**: Singular vs plural, different types
3. **`is_verified`**: Mapped to `status='approved'` in enrollments
4. **`credits`**: Legacy field still referenced in some code

---

## 2. DATA FLOW DEPENDENCIES

### 2.1 Therapist Onboarding Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                    THERAPIST ONBOARDING FLOW                      │
└──────────────────────────────────────────────────────────────────┘

1. ENROLLMENT SUBMISSION
   /api/therapist/enroll (POST)
   ↓
   Creates: therapist_enrollments (status='pending')
   
2. ADMIN REVIEW
   /api/admin/approve-verification (POST)
   ↓
   Uses: TherapistConsistencyManager.approveTherapist()
   ↓
   Updates (ATOMIC):
     - users (is_verified=true, is_active=true)
     - therapist_enrollments (status='approved', is_active=true)
     - therapist_profiles (verification_status='approved', is_verified=true)
   
3. PROFILE SETUP
   /api/therapist/update-profile (PUT)
   ↓
   Updates: therapist_enrollments
   Emits Event: THERAPIST_EVENTS.PROFILE_UPDATED
   ↓
   Context Updates:
     - TherapistUserContext (local state)
     - TherapistDashboardContext (dashboard state)

4. AVAILABILITY SETUP
   /api/therapist/availability/template (POST)
   ↓
   Updates:
     - availability_weekly_schedules (new format)
     - availability_templates (legacy format)
   Invalidates: AvailabilityCache
   ↓
   Affects:
     - Booking system (/api/availability/slots)
     - Calendar display (/api/availability/days)
```

---

### 2.2 Avatar/Profile Image Update Flow

```
┌──────────────────────────────────────────────────────────────────┐
│               AVATAR UPDATE FLOW (CRITICAL SYNC)                  │
└──────────────────────────────────────────────────────────────────┘

Component: ProfileImageUpload.tsx
↓
1. Upload to Storage
   /api/therapist/upload-avatar (POST)
   ↓
   Storage: Supabase Storage Bucket
   Returns: Public URL
   
2. Database Update
   Updates: therapist_enrollments.profile_image_url
   ⚠️ DOES NOT UPDATE: users.avatar_url or therapist_profiles.profile_image_url
   
3. Event Emission
   therapistEvents.emit(THERAPIST_EVENTS.AVATAR_UPDATED, {
     profile_image_url: newUrl
   })
   
4. Context Updates
   TherapistUserContext listens → updates local state
   ↓
   Components Re-render:
     - ProfileHeader
     - DashboardSidebar
     - TherapistCard
   
5. ⚠️ MISSING SYNC
   therapist_profiles.profile_image_url NOT updated
   users.avatar_url NOT updated
   → Different systems see different images
```

**🚨 CRITICAL BUG**: Avatar update only touches ONE table, not all three!

---

### 2.3 Booking Flow with Credits

```
┌──────────────────────────────────────────────────────────────────┐
│                      BOOKING FLOW                                 │
└──────────────────────────────────────────────────────────────────┘

1. USER SELECTS TIME SLOT
   Component: TimeSlotGrid.tsx
   ↓
   Fetches: /api/availability/slots?therapist_id=X&date=Y
   ↓
   Sources Data From:
     - availability_weekly_schedules (new system)
     - Sessions table (to exclude booked slots)
   
2. CREDIT CHECK
   /api/credits/user (GET)
   ↓
   Queries:
     - user_credits (individual credits)
     - partner_credits (partner-allocated credits)
   ↓
   Returns: Available credits with session duration
   
3. BOOKING CREATION
   /api/sessions/book-simple (POST)
   ↓
   Validates:
     - user_id exists in users table (FK constraint)
     - therapist_id exists in users table (FK constraint)
     - Available time slot (not double-booked)
   ↓
   Creates Session:
     - user_id, therapist_id
     - session_date, session_time (new format)
     - start_time, end_time (legacy format)
     - duration, duration_minutes (duplicate)
     - ⚠️ session_type field REMOVED (doesn't exist in schema)
   
4. CREDIT DEDUCTION
   Uses: use_partner_credit() or use_user_credits()
   ↓
   Updates:
     - user_credits.credits_used++
     - partner_credits.status='used', session_id=X
   ↓
   Creates: credit_transactions record
   
5. NOTIFICATIONS
   Creates: notifications record
   Sends: Email/SMS confirmations
```

---

### 2.4 Availability Change Impact Chain

```
┌──────────────────────────────────────────────────────────────────┐
│              AVAILABILITY CHANGE IMPACT CHAIN                     │
└──────────────────────────────────────────────────────────────────┘

Trigger: Therapist edits availability
↓
API: /api/therapist/availability/template (POST)
↓
┌─────────────────────────────────────────────────────────────────┐
│ 1. DATABASE UPDATES                                              │
├─────────────────────────────────────────────────────────────────┤
│ • availability_weekly_schedules.weekly_availability (JSONB)     │
│ • availability_templates (legacy - for backward compatibility)  │
└─────────────────────────────────────────────────────────────────┘
↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. CACHE INVALIDATION                                            │
├─────────────────────────────────────────────────────────────────┤
│ • AvailabilityCache.invalidate(therapist_id)                    │
│ • Duration: 30 seconds (reduced from 5 minutes)                 │
└─────────────────────────────────────────────────────────────────┘
↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. AFFECTED API ENDPOINTS                                        │
├─────────────────────────────────────────────────────────────────┤
│ ✅ /api/availability/slots (booking time slots)                 │
│    • Bypasses cache with cache: 'no-store'                      │
│    • Returns: Fresh slots from database                         │
│                                                                  │
│ ✅ /api/availability/days (calendar dates)                      │
│    • Fixed to use new WeeklyAvailability format                 │
│    • Returns: Dates with availability                           │
│                                                                  │
│ ⚠️ /api/therapist/availability/weekly (GET)                     │
│    • May still cache on client side                             │
└─────────────────────────────────────────────────────────────────┘
↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. CLIENT-SIDE UPDATES                                           │
├─────────────────────────────────────────────────────────────────┤
│ • AvailabilityManager component                                 │
│ • DatePicker component (calendar view)                          │
│ • TimeSlotGrid component (booking interface)                    │
│ • TherapistDashboardContext (dashboard state)                   │
└─────────────────────────────────────────────────────────────────┘
↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. REAL-TIME SYNCHRONIZATION                                     │
├─────────────────────────────────────────────────────────────────┤
│ ⚠️ NO WEBSOCKET/REALTIME UPDATES                                │
│ • Users must refresh to see changes                             │
│ • Cache-busting via timestamp query params                      │
│ • Aggressive no-cache headers on API responses                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. STATE MANAGEMENT HIERARCHY

### 3.1 Context Provider Tree

```
App Root
│
├── AuthProvider (Global Auth State)
│   ├── State: user, loading, isAuthenticated, userType
│   ├── Methods: login(), signup(), logout(), refreshUser(), validateSession()
│   └── Storage: ClientSessionManager (localStorage)
│
├── GlobalStateProvider (Cross-Dashboard Communication)
│   ├── State: activeUsers, activeSessions, systemMetrics, notifications
│   ├── Methods: syncData(), broadcastEvent(), updateUserStatus()
│   └── Used By: Admin dashboard for system-wide monitoring
│
├── TherapistUserProvider (Therapist Auth Context)
│   ├── State: therapist, loading, isAuthenticated
│   ├── Methods: refreshTherapist(), updateTherapist(), logout()
│   ├── Event Listeners: AVATAR_UPDATED, PROFILE_UPDATED
│   └── Depends On: AuthProvider (wraps and extends)
│
├── TherapistDashboardProvider (Therapist Dashboard State)
│   ├── State: stats, upcomingSessions, recentActivity, iconStates
│   ├── Methods: fetchStats(), fetchSessions(), refreshDashboard()
│   └── Depends On: TherapistUserProvider
│
├── DashboardProvider (Individual User Dashboard State)
│   ├── State: stats, credits, sessions, iconStates
│   ├── Methods: fetchDashboardData(), refreshCreditBalance()
│   └── Depends On: AuthProvider
│
├── AdminDashboardProvider (Admin Dashboard State)
│   ├── State: users, therapists, pendingVerifications, systemMetrics
│   ├── Methods: approveTherapist(), rejectTherapist(), refreshData()
│   └── Depends On: AuthProvider
│
└── PartnerDashboardProvider (Partner Dashboard State)
    ├── State: members, creditAllocations, usage
    ├── Methods: addMember(), allocateCredits(), viewReports()
    └── Depends On: AuthProvider
```

---

### 3.2 Event System (Therapist Context)

```typescript
// lib/events.ts
export const THERAPIST_EVENTS = {
  AVATAR_UPDATED: 'therapist:avatar:updated',
  PROFILE_UPDATED: 'therapist:profile:updated',
  AVAILABILITY_UPDATED: 'therapist:availability:updated',
  SESSION_BOOKED: 'therapist:session:booked'
}

// Event Flow:
ProfileImageUpload.tsx
  ↓ therapistEvents.emit(AVATAR_UPDATED, {...})
  ↓
TherapistUserContext (listener)
  ↓ setTherapist({...currentState, profile_image_url: newUrl})
  ↓
Components Re-render:
  - ProfileHeader
  - DashboardLayout
  - TherapistCard
```

**⚠️ EVENT SYSTEM LIMITATIONS**:
- Only works within same browser tab (no cross-tab sync)
- Does NOT update database (manual API call required)
- Does NOT trigger server-side updates

---

### 3.3 Component Dependency Graph

```
┌──────────────────────────────────────────────────────────────────┐
│                  COMPONENT DEPENDENCY TREE                        │
└──────────────────────────────────────────────────────────────────┘

TherapistDashboard Page
├── Uses: useTherapistUser() → TherapistUserContext
├── Uses: useTherapistDashboard() → TherapistDashboardContext
│
├── ProfileHeader Component
│   ├── Reads: therapist.profile_image_url
│   ├── Reads: therapist.full_name
│   └── Updates On: AVATAR_UPDATED event
│
├── AvailabilityManager Component
│   ├── Reads: therapist.id
│   ├── Updates: availability_weekly_schedules
│   ├── Emits: AVAILABILITY_UPDATED event
│   └── Affects: Booking system, Calendar
│
├── SessionList Component
│   ├── Reads: therapist.id
│   ├── Fetches: /api/sessions?therapist_id=X
│   └── Updates On: SESSION_BOOKED event
│
└── StatsCards Component
    ├── Reads: dashboard.stats
    ├── Fetches: /api/dashboard/stats
    └── Auto-refresh: Every 60 seconds

UserBookingFlow
├── Uses: useAuth() → AuthProvider
├── Uses: useDashboard() → DashboardProvider
│
├── TherapistSelector Component
│   ├── Fetches: /api/therapists (GET)
│   └── Filters: verification_status='verified'
│
├── DatePicker Component
│   ├── Fetches: /api/availability/days?therapist_id=X
│   └── Depends On: availability_weekly_schedules
│
├── TimeSlotGrid Component
│   ├── Fetches: /api/availability/slots?therapist_id=X&date=Y
│   ├── Cache: 'no-store' (no caching)
│   └── Depends On: availability_weekly_schedules, sessions
│
└── BookingConfirmation Component
    ├── Posts: /api/sessions/book-simple
    ├── Requires: user_id, therapist_id, session_date, start_time
    └── Triggers: Credit deduction, Email notifications
```

---

## 4. CROSS-SYSTEM IMPACT PATTERNS

### 4.1 Avatar Update Impact

```
┌──────────────────────────────────────────────────────────────────┐
│              WHEN AVATAR IS UPDATED                               │
└──────────────────────────────────────────────────────────────────┘

ACTION: Therapist uploads new profile image

┌─────────────────────────────────────────────────────────────────┐
│ TABLES AFFECTED                                                  │
├─────────────────────────────────────────────────────────────────┤
│ ✅ therapist_enrollments.profile_image_url → UPDATED            │
│ ❌ users.avatar_url → NOT UPDATED (BUG!)                        │
│ ❌ therapist_profiles.profile_image_url → NOT UPDATED (BUG!)    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ CONTEXTS AFFECTED                                                │
├─────────────────────────────────────────────────────────────────┤
│ ✅ TherapistUserContext → Updates via event listener            │
│ ⚠️ TherapistDashboardContext → May show stale data             │
│ ❌ AdminDashboardContext → Shows old image from users table     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ APIs AFFECTED                                                    │
├─────────────────────────────────────────────────────────────────┤
│ ✅ /api/therapist/profile → Returns updated enrollment data     │
│ ❌ /api/therapists → Returns old therapist_profiles data        │
│ ❌ /api/admin/therapists → Returns old users data               │
└─────────────────────────────────────────────────────────────────┘

🚨 CRITICAL BUG: Avatar visible in therapist dashboard but NOT in:
   - Public therapist listing
   - Admin dashboard
   - Booking interface
```

---

### 4.2 Therapist Approval Impact

```
┌──────────────────────────────────────────────────────────────────┐
│              WHEN THERAPIST IS APPROVED                           │
└──────────────────────────────────────────────────────────────────┘

ACTION: Admin approves therapist enrollment

┌─────────────────────────────────────────────────────────────────┐
│ TABLES AFFECTED (via TherapistConsistencyManager)                │
├─────────────────────────────────────────────────────────────────┤
│ ✅ users.is_verified → TRUE                                      │
│ ✅ users.is_active → TRUE                                        │
│ ✅ therapist_enrollments.status → 'approved'                     │
│ ✅ therapist_enrollments.is_active → TRUE                        │
│ ✅ therapist_enrollments.approved_at → NOW()                     │
│ ⚠️ therapist_profiles.verification_status → 'approved' (if exists)│
│ ⚠️ therapist_profiles.is_verified → TRUE (if exists)            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ SYSTEMS ENABLED                                                  │
├─────────────────────────────────────────────────────────────────┤
│ ✅ Therapist can log in                                          │
│ ✅ Therapist appears in /api/therapists listing                  │
│ ✅ Therapist can set availability                                │
│ ✅ Therapist can accept bookings                                 │
│ ⚠️ Therapist profile may still be incomplete                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ NOTIFICATIONS/COMMUNICATIONS                                     │
├─────────────────────────────────────────────────────────────────┤
│ ⚠️ NO automatic approval email sent                             │
│ ⚠️ NO onboarding instructions sent                              │
│ ⚠️ NO welcome dashboard notification                            │
└─────────────────────────────────────────────────────────────────┘
```

---

### 4.3 Availability Change Impact

```
┌──────────────────────────────────────────────────────────────────┐
│              WHEN AVAILABILITY CHANGES                            │
└──────────────────────────────────────────────────────────────────┘

ACTION: Therapist updates weekly availability

┌─────────────────────────────────────────────────────────────────┐
│ TABLES AFFECTED                                                  │
├─────────────────────────────────────────────────────────────────┤
│ ✅ availability_weekly_schedules.weekly_availability → UPDATED   │
│ ✅ availability_templates (legacy) → SYNCED                      │
│ ❌ therapist_profiles.availability_status → NOT UPDATED          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ CACHES AFFECTED                                                  │
├─────────────────────────────────────────────────────────────────┤
│ ✅ AvailabilityCache.invalidate(therapist_id)                    │
│ ✅ HTTP cache bypassed with no-store headers                     │
│ ✅ Client-side cache bypassed with timestamp params              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ BOOKING FLOWS IMPACTED                                           │
├─────────────────────────────────────────────────────────────────┤
│ ✅ /api/availability/slots → Returns fresh slots                 │
│ ✅ /api/availability/days → Returns updated calendar             │
│ ✅ DatePicker → Shows new available dates                        │
│ ✅ TimeSlotGrid → Shows new time slots                           │
│ ⚠️ Existing bookings NOT affected (as expected)                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ USER VISIBILITY                                                  │
├─────────────────────────────────────────────────────────────────┤
│ ✅ Changes visible immediately (no page refresh required)        │
│ ✅ Real-time via cache-busting                                   │
│ ❌ No WebSocket/realtime notification                            │
└─────────────────────────────────────────────────────────────────┘
```

---

### 4.4 Session Booking Impact

```
┌──────────────────────────────────────────────────────────────────┐
│              WHEN SESSION IS BOOKED                               │
└──────────────────────────────────────────────────────────────────┘

ACTION: User books therapy session

┌─────────────────────────────────────────────────────────────────┐
│ TABLES AFFECTED                                                  │
├─────────────────────────────────────────────────────────────────┤
│ ✅ sessions → NEW ROW CREATED                                    │
│ ✅ user_credits.credits_used → INCREMENTED                       │
│ ✅ partner_credits.status → 'used' (if partner credit)          │
│ ✅ credit_transactions → NEW TRANSACTION LOGGED                  │
│ ⚠️ notifications → NEW NOTIFICATION (if implemented)            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ AVAILABILITY AFFECTED                                            │
├─────────────────────────────────────────────────────────────────┤
│ ✅ Time slot becomes unavailable immediately                     │
│ ✅ /api/availability/slots excludes booked time                  │
│ ✅ No double-booking possible (database constraint)              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ DASHBOARDS AFFECTED                                              │
├─────────────────────────────────────────────────────────────────┤
│ ⚠️ TherapistDashboard → Refresh required to see new booking     │
│ ⚠️ UserDashboard → Refresh required to see booking              │
│ ⚠️ No real-time notification system                             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ STATISTICS AFFECTED                                              │
├─────────────────────────────────────────────────────────────────┤
│ ⚠️ therapist_profiles.total_sessions → NOT auto-updated         │
│ ⚠️ Requires trigger or manual update                            │
│ ⚠️ Dashboard stats may be stale                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. API ENDPOINT DEPENDENCIES

### 5.1 Therapist Management APIs

| Endpoint | Method | Tables Accessed | Context Updates | Sync Manager |
|----------|--------|----------------|-----------------|--------------|
| `/api/therapist/enroll` | POST | `therapist_enrollments` | None | No |
| `/api/therapist/profile` | GET | `therapist_enrollments` | TherapistUserContext | No |
| `/api/therapist/update-profile` | PUT | `therapist_enrollments` | TherapistUserContext (via event) | No |
| `/api/therapist/upload-avatar` | POST | `therapist_enrollments` | TherapistUserContext (via event) | **⚠️ Should sync all 3 tables** |
| `/api/admin/approve-verification` | POST | `users`, `therapist_enrollments`, `therapist_profiles` | AdminDashboardContext | ✅ Yes (TherapistConsistencyManager) |
| `/api/admin/unapprove-therapist` | POST | `users`, `therapist_profiles` | AdminDashboardContext | No |
| `/api/admin/therapist-rate` | PUT | `therapist_profiles` | None | No |
| `/api/therapists` | GET | `users`, `therapist_profiles` | None | No |
| `/api/therapists/[id]` | GET | `users`, `therapist_profiles`, `therapist_enrollments` | None | No |

---

### 5.2 Availability Management APIs

| Endpoint | Method | Tables Accessed | Cache Invalidation | Real-time Updates |
|----------|--------|----------------|-------------------|-------------------|
| `/api/therapist/availability/template` | POST | `availability_weekly_schedules`, `availability_templates` | ✅ Yes | ❌ No |
| `/api/therapist/availability/template` | GET | `availability_weekly_schedules`, `availability_templates` | N/A | N/A |
| `/api/therapist/availability/weekly` | POST | `availability_weekly_schedules` | ✅ Yes | ❌ No |
| `/api/therapist/availability/weekly` | GET | `availability_weekly_schedules` | N/A | ⚠️ May cache |
| `/api/availability/slots` | GET | `availability_weekly_schedules`, `sessions` | N/A (cache: no-store) | ❌ No |
| `/api/availability/days` | GET | `availability_weekly_schedules` | N/A | ❌ No |

---

### 5.3 Booking & Sessions APIs

| Endpoint | Method | Tables Accessed | Credit System | Notifications |
|----------|--------|----------------|---------------|---------------|
| `/api/sessions/book-simple` | POST | `sessions`, `user_credits`, `partner_credits` | ✅ Deducts | ⚠️ TODO |
| `/api/sessions/book` | POST | `sessions`, `user_credits`, `therapist_profiles` | ✅ Deducts | ⚠️ TODO |
| `/api/sessions` | GET | `sessions`, `users` | N/A | N/A |
| `/api/sessions/[id]` | GET | `sessions`, `users`, `therapist_profiles` | N/A | N/A |
| `/api/sessions/[id]` | PUT | `sessions` | N/A | ⚠️ TODO |
| `/api/sessions/[id]` | DELETE | `sessions`, `user_credits` | ⚠️ Refund logic? | ⚠️ TODO |

---

### 5.4 Credits Management APIs

| Endpoint | Method | Tables Accessed | Transaction Logging | Partner System |
|----------|--------|----------------|-------------------|----------------|
| `/api/credits/user` | GET | `user_credits`, `partner_credits` | N/A | ✅ Yes |
| `/api/credits/user` | POST | `user_credits`, `credit_transactions` | ✅ Yes | ❌ No |
| `/api/partner/allocate-credits` | POST | `partner_credits`, `users` | ⚠️ Partial | ✅ Yes |
| `/api/partner/bulk-upload-members` | POST | `users`, `partner_credits` | ❌ No | ✅ Yes |

---

## 6. BREAKAGE POINTS & RISK MATRIX

### 6.1 Critical Breakage Points

| # | Issue | Risk Level | Impact | Current Status |
|---|-------|-----------|--------|----------------|
| 1 | **Avatar 3-way sync failure** | 🔴 HIGH | Avatar shows in therapist dashboard but not in public listing or admin | BROKEN |
| 2 | **session_type column missing** | 🔴 HIGH | Booking API returns 500 error | FIXED (removed from code) |
| 3 | **Specialization type mismatch** | 🟡 MEDIUM | `specialization` (TEXT) vs `specializations` (TEXT[]) | ACTIVE BUG |
| 4 | **Credits field duplication** | 🟡 MEDIUM | `users.credits` (legacy) vs `user_credits.credits_balance` | Migration incomplete |
| 5 | **Date/time field redundancy** | 🟡 MEDIUM | 4 date fields, 4 time fields in sessions table | Confusion risk |
| 6 | **Availability cache staleness** | 🟢 LOW | Fixed with aggressive cache-busting | FIXED |
| 7 | **No real-time updates** | 🟡 MEDIUM | Dashboards require manual refresh | BY DESIGN |
| 8 | **therapist_profiles orphaned records** | 🟡 MEDIUM | Profile may exist without enrollment or vice versa | Inconsistency risk |

---

### 6.2 Data Consistency Risks

```
┌──────────────────────────────────────────────────────────────────┐
│              DATA CONSISTENCY RISK MATRIX                         │
└──────────────────────────────────────────────────────────────────┘

HIGH RISK (Immediate Attention Required)
├── profile_image_url sync across 3 tables
│   Impact: Visual inconsistency, user confusion
│   Frequency: Every avatar update
│   Fix Priority: 🔴 CRITICAL
│
├── is_verified sync between users and therapist_enrollments
│   Impact: Access control failures, security risk
│   Frequency: Every approval/rejection
│   Fix Priority: 🔴 CRITICAL (partially mitigated by TherapistConsistencyManager)
│
└── specialization vs specializations type mismatch
    Impact: Data loss, search failures
    Frequency: Every profile update
    Fix Priority: 🔴 CRITICAL

MEDIUM RISK (Plan for Fix)
├── credits vs user_credits
│   Impact: Incorrect billing, credit tracking errors
│   Frequency: Every credit transaction
│   Fix Priority: 🟡 MEDIUM (migration in progress)
│
├── Date/time field redundancy in sessions
│   Impact: Query confusion, timezone bugs
│   Frequency: Every booking
│   Fix Priority: 🟡 MEDIUM (consolidate to one format)
│
└── therapist_profiles orphaned records
    Impact: Data integrity issues
    Frequency: Occasional
    Fix Priority: 🟡 MEDIUM (audit and cleanup)

LOW RISK (Monitor)
├── Availability cache
│   Impact: Stale booking data
│   Frequency: After availability changes
│   Fix Priority: 🟢 LOW (already fixed)
│
└── Dashboard refresh requirements
    Impact: User experience (not critical)
    Frequency: Constant
    Fix Priority: 🟢 LOW (consider WebSocket in future)
```

---

### 6.3 Foreign Key Constraint Map

```
┌──────────────────────────────────────────────────────────────────┐
│              FOREIGN KEY DEPENDENCIES                             │
└──────────────────────────────────────────────────────────────────┘

users.id (ROOT)
├── ON DELETE CASCADE
│   ├── therapist_profiles.user_id
│   ├── therapist_enrollments.user_id
│   ├── sessions.user_id
│   ├── sessions.therapist_id
│   ├── user_credits.user_id
│   ├── patient_biodata.user_id
│   ├── session_notes.user_id
│   ├── session_notes.therapist_id
│   ├── notifications.user_id
│   ├── payments.user_id
│   └── reviews.user_id
│
├── ON DELETE SET NULL
│   ├── sessions.cancelled_by
│   └── partner_credits.session_id
│
└── NO CASCADE (reference only)
    └── availability_weekly_schedules.therapist_id

⚠️ CRITICAL: Deleting a user cascades to 10+ tables!
⚠️ CRITICAL: Must ensure cleanup order to avoid orphaned records
```

---

## 7. RECOMMENDED FIX ORDER

### 7.1 Phase 1: Critical Data Consistency (Week 1)

**Priority 1: Fix Avatar 3-Way Sync**
```typescript
// When avatar updates, update ALL three tables atomically
async function updateTherapistAvatar(email: string, avatarUrl: string) {
  // 1. Update therapist_enrollments
  await supabase
    .from('therapist_enrollments')
    .update({ profile_image_url: avatarUrl })
    .eq('email', email)
  
  // 2. Update users
  await supabase
    .from('users')
    .update({ avatar_url: avatarUrl })
    .eq('email', email)
  
  // 3. Update therapist_profiles
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single()
  
  await supabase
    .from('therapist_profiles')
    .update({ profile_image_url: avatarUrl })
    .eq('user_id', user.id)
}
```

**Priority 2: Fix Specialization Type Mismatch**
```sql
-- Option A: Consolidate to TEXT[] in both tables
ALTER TABLE therapist_enrollments 
ALTER COLUMN specialization TYPE TEXT[] 
USING ARRAY[specialization];

-- Option B: Keep both, but sync properly
-- Update API to handle both TEXT and TEXT[] formats
```

**Priority 3: Extend TherapistConsistencyManager**
```typescript
// Add profile_image_url to consistency checks
static async validateConsistency(email: string) {
  // Check users.avatar_url === therapist_enrollments.profile_image_url
  // Check therapist_profiles.profile_image_url === therapist_enrollments.profile_image_url
  // Auto-fix if inconsistent
}
```

---

### 7.2 Phase 2: Session Schema Cleanup (Week 2)

**Priority 4: Consolidate Date/Time Fields**
```sql
-- Keep only the new format
ALTER TABLE sessions 
DROP COLUMN IF EXISTS scheduled_date,
DROP COLUMN IF EXISTS scheduled_time,
DROP COLUMN IF EXISTS start_time,  -- Remove TIMESTAMPTZ
DROP COLUMN IF EXISTS end_time,    -- Remove TIMESTAMPTZ
DROP COLUMN IF EXISTS duration;    -- Keep duration_minutes only

-- Update all APIs to use session_date, session_time, duration_minutes
```

**Priority 5: Audit and Fix Orphaned Records**
```sql
-- Find therapist_profiles without matching therapist_enrollments
SELECT tp.* 
FROM therapist_profiles tp
LEFT JOIN therapist_enrollments te ON tp.user_id = te.user_id
WHERE te.id IS NULL;

-- Find therapist_enrollments without matching users
SELECT te.* 
FROM therapist_enrollments te
LEFT JOIN users u ON te.email = u.email
WHERE u.id IS NULL;

-- Fix or delete orphaned records
```

---

### 7.3 Phase 3: Credit System Migration (Week 3)

**Priority 6: Complete Credits Migration**
```sql
-- Migrate remaining users.credits to user_credits table
INSERT INTO user_credits (user_id, user_type, credits_balance)
SELECT id, user_type, credits
FROM users
WHERE credits > 0
ON CONFLICT (user_id, user_type) DO UPDATE
SET credits_balance = user_credits.credits_balance + EXCLUDED.credits_balance;

-- After migration complete:
ALTER TABLE users DROP COLUMN credits;
```

**Priority 7: Add Database Triggers**
```sql
-- Auto-update therapist_profiles.profile_image_url when users.avatar_url changes
CREATE OR REPLACE FUNCTION sync_avatar_to_profile()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE therapist_profiles 
  SET profile_image_url = NEW.avatar_url
  WHERE user_id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_avatar_on_user_update
AFTER UPDATE OF avatar_url ON users
FOR EACH ROW
EXECUTE FUNCTION sync_avatar_to_profile();
```

---

### 7.4 Phase 4: Real-Time Improvements (Week 4)

**Priority 8: Add WebSocket/Realtime Updates** ⚠️ Optional but Recommended
```typescript
// Use Supabase Realtime for live updates
const channel = supabase
  .channel('availability_changes')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'availability_weekly_schedules'
  }, (payload) => {
    // Refresh affected components
    refreshAvailability(payload.new.therapist_id)
  })
  .subscribe()
```

**Priority 9: Add Notification System**
```typescript
// When therapist approved
async function notifyTherapistApproval(email: string) {
  // 1. Create notification record
  await supabase.from('notifications').insert({
    user_id: userId,
    title: 'Application Approved!',
    message: 'Your therapist application has been approved.',
    type: 'system'
  })
  
  // 2. Send email
  await sendEmail({
    to: email,
    subject: 'Welcome to TRPI',
    template: 'therapist-approval'
  })
}
```

---

## 8. ARCHITECTURE RECOMMENDATIONS

### 8.1 Single Source of Truth Pattern

**Current Problem**: Data duplicated across 3 tables without clear owner

**Recommended Pattern**:
```
therapist_enrollments (SOURCE OF TRUTH)
├── Owns: All therapist data including image, bio, specializations
├── Synced To: users (is_verified, is_active, avatar_url)
├── Synced To: therapist_profiles (public-facing data only)
└── Sync Method: Database triggers + API consistency layer
```

---

### 8.2 Event-Driven Architecture

**Current Problem**: Manual state updates, no real-time sync

**Recommended Pattern**:
```typescript
// Central event bus
export const platformEvents = new EventEmitter()

// Event types
export const PLATFORM_EVENTS = {
  THERAPIST: {
    APPROVED: 'therapist:approved',
    PROFILE_UPDATED: 'therapist:profile:updated',
    AVATAR_UPDATED: 'therapist:avatar:updated',
    AVAILABILITY_CHANGED: 'therapist:availability:changed'
  },
  SESSION: {
    BOOKED: 'session:booked',
    CANCELLED: 'session:cancelled',
    STARTED: 'session:started',
    COMPLETED: 'session:completed'
  },
  CREDITS: {
    ALLOCATED: 'credits:allocated',
    USED: 'credits:used',
    EXPIRED: 'credits:expired'
  }
}

// Usage:
platformEvents.on(PLATFORM_EVENTS.SESSION.BOOKED, async (session) => {
  // Update therapist dashboard
  // Send notifications
  // Update availability cache
  // Log analytics
})
```

---

### 8.3 API Response Caching Strategy

**Current Implementation**: Aggressive no-cache headers

**Recommended Strategy**:
```typescript
// Different cache strategies for different data types
const CACHE_STRATEGIES = {
  // Never cache - always fresh
  NO_CACHE: ['availability/slots', 'sessions/active'],
  
  // Short cache (30s) - frequently changing
  SHORT_CACHE: ['availability/days', 'dashboard/stats'],
  
  // Medium cache (5min) - occasionally changing
  MEDIUM_CACHE: ['therapists', 'user/profile'],
  
  // Long cache (1hr) - rarely changing
  LONG_CACHE: ['therapists/[id]', 'static content']
}
```

---

## 9. TESTING CHECKLIST

### 9.1 Critical Path Tests

- [ ] Therapist enrollment → approval → login flow
- [ ] Avatar upload → verify visible in all 3 tables
- [ ] Profile edit → verify synced to correct tables
- [ ] Availability update → verify booking system reflects changes within 30s
- [ ] Session booking → verify credits deducted, slot unavailable
- [ ] Session booking → verify therapist/user can't double-book
- [ ] Partner credit allocation → verify employee can book with partner credits
- [ ] Admin unapprove therapist → verify therapist can't receive bookings

---

### 9.2 Data Consistency Tests

- [ ] Run TherapistConsistencyManager.auditAllTherapists()
- [ ] Verify no orphaned therapist_profiles records
- [ ] Verify no orphaned therapist_enrollments records
- [ ] Verify all therapists have matching is_verified across tables
- [ ] Verify all therapists have matching profile_image_url across tables
- [ ] Verify all sessions have valid user_id and therapist_id (FK constraints)

---

## 10. EMERGENCY ROLLBACK PLAN

### 10.1 If Avatar Sync Fix Breaks

```sql
-- Rollback: Remove triggers
DROP TRIGGER IF EXISTS sync_avatar_on_user_update ON users;
DROP TRIGGER IF EXISTS sync_avatar_on_enrollment_update ON therapist_enrollments;
DROP FUNCTION IF EXISTS sync_avatar_to_profile();

-- Revert to manual sync in API endpoints
```

### 10.2 If Session Schema Changes Break

```sql
-- Rollback: Re-add removed columns
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS scheduled_date DATE,
ADD COLUMN IF NOT EXISTS scheduled_time TIME,
ADD COLUMN IF NOT EXISTS start_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS end_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS duration INTEGER;

-- Backfill from session_date/session_time
UPDATE sessions 
SET 
  scheduled_date = session_date,
  scheduled_time = session_time,
  start_time = (session_date || ' ' || session_time)::TIMESTAMPTZ,
  duration = duration_minutes
WHERE session_date IS NOT NULL;
```

---

## 11. GLOSSARY

| Term | Definition |
|------|------------|
| **WeeklyAvailability** | JSONB object storing therapist's weekly schedule in new format |
| **availability_templates** | Legacy table for backward compatibility |
| **TherapistConsistencyManager** | Class ensuring atomic updates across users/therapist_enrollments |
| **profile_image_url** | Field name in therapist tables (vs `avatar_url` in users) |
| **session_date/session_time** | New date/time format (separate DATE and TIME fields) |
| **start_time/end_time** | Legacy format (TIMESTAMPTZ fields) |
| **user_credits** | New credit tracking system (replacing `users.credits`) |
| **partner_credits** | Credits allocated by partner organizations to employees |

---

## 12. CONCLUSION

### Key Takeaways

1. **Database Schema**: 15+ interconnected tables with complex FK relationships
2. **Critical Bug**: Avatar updates only touch 1 of 3 tables (profile_image_url sync failure)
3. **Data Duplication**: 8 fields duplicated across 2-3 tables without proper sync
4. **Fixed Issues**: session_type column removed, availability caching fixed
5. **Migration In Progress**: Credits system moving from users.credits to user_credits table
6. **No Real-Time**: All updates require manual refresh or cache-busting

### Immediate Actions Required

🔴 **CRITICAL (This Week)**:
1. Fix avatar 3-way sync
2. Fix specialization type mismatch
3. Extend TherapistConsistencyManager to all duplicated fields

🟡 **HIGH (Next 2 Weeks)**:
4. Consolidate session date/time fields
5. Complete credits migration
6. Add database triggers for auto-sync

🟢 **MEDIUM (Next Month)**:
7. Implement real-time updates via WebSocket
8. Add comprehensive notification system
9. Create automated consistency audits

---

**Document Version**: 1.0  
**Last Updated**: October 20, 2025  
**Maintained By**: System Architecture Team  
**Review Cycle**: Monthly or after major changes


