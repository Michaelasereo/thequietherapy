# 🎯 ARCHITECTURE QUICK REFERENCE
## TRPI Therapy Platform - Critical Paths & Issues

**For**: Development Team  
**Purpose**: Quick reference for common issues and critical data flows  
**See Full Documentation**: `COMPREHENSIVE-SYSTEM-ARCHITECTURE.md`

---

## 🚨 CRITICAL BUGS (Fix Immediately)

### Bug #1: Avatar 3-Way Sync Failure
**Problem**: Avatar updates only touch `therapist_enrollments.profile_image_url`  
**Missing**: `users.avatar_url` and `therapist_profiles.profile_image_url`  
**Impact**: Avatar visible in therapist dashboard but NOT in public listing or admin  
**Fix Location**: `/app/api/therapist/upload-avatar`

### Bug #2: Specialization Type Mismatch  
**Problem**: `therapist_enrollments.specialization` (TEXT) ≠ `therapist_profiles.specializations` (TEXT[])  
**Impact**: Data loss when syncing between tables  
**Fix**: Standardize to TEXT[] in both tables

### Bug #3: session_type Column Missing
**Problem**: Code references non-existent column  
**Status**: ✅ FIXED (removed from `/app/api/sessions/book-simple/route.ts`)

---

## 📊 DATABASE CORE RELATIONSHIPS

```
users (ROOT)
├── therapist_profiles (1:1, ON DELETE CASCADE)
├── therapist_enrollments (1:1, ON DELETE CASCADE) ⚠️ Must stay synced with users
├── sessions (1:many, ON DELETE CASCADE)
│   ├── as user_id
│   └── as therapist_id
├── user_credits (1:1, ON DELETE CASCADE)
├── partner_credits (1:many)
└── availability_weekly_schedules (1:1 for therapists)
```

---

## ⚠️ FIELDS THAT MUST STAY SYNCED

| Field | users | therapist_enrollments | therapist_profiles | Sync Method |
|-------|-------|----------------------|-------------------|-------------|
| **Image** | `avatar_url` | `profile_image_url` | `profile_image_url` | ❌ BROKEN |
| **Name** | `full_name` | `full_name` | - | ✅ TherapistConsistencyManager |
| **Email** | `email` | `email` | - | ✅ TherapistConsistencyManager |
| **Active** | `is_active` | `is_active` | - | ✅ TherapistConsistencyManager |
| **Verified** | `is_verified` | `status='approved'` | `is_verified` | ⚠️ Partial |
| **Bio** | - | `bio` | `bio` | ❌ Manual |
| **Experience** | - | `experience_years` | `experience_years` | ❌ Manual |

---

## 🔄 CRITICAL DATA FLOWS

### Flow 1: Therapist Approval
```
Admin Dashboard
↓
/api/admin/approve-verification (POST)
↓
TherapistConsistencyManager.approveTherapist(email)
↓
ATOMIC UPDATE:
├── users: is_verified=true, is_active=true
├── therapist_enrollments: status='approved', is_active=true
└── therapist_profiles: verification_status='approved' (if exists)
↓
Therapist can login and accept bookings
```

### Flow 2: Avatar Update (BROKEN)
```
ProfileImageUpload Component
↓
/api/therapist/upload-avatar (POST)
↓
✅ Updates: therapist_enrollments.profile_image_url
❌ Missing: users.avatar_url
❌ Missing: therapist_profiles.profile_image_url
↓
Event: THERAPIST_EVENTS.AVATAR_UPDATED
↓
TherapistUserContext updates local state
↓
⚠️ Result: Avatar visible in therapist dashboard only!
```

### Flow 3: Availability Update (FIXED)
```
AvailabilityManager Component
↓
/api/therapist/availability/template (POST)
↓
Updates:
├── availability_weekly_schedules (new format)
└── availability_templates (legacy format)
↓
Cache Invalidation: invalidateTherapistAvailability(therapist_id)
↓
Affects:
├── /api/availability/slots (booking system)
├── /api/availability/days (calendar)
└── All booking interfaces
↓
✅ Changes visible immediately (cache-busted)
```

### Flow 4: Session Booking
```
BookingConfirmation Component
↓
/api/sessions/book-simple (POST)
↓
Validates:
├── user_id exists (FK constraint)
├── therapist_id exists (FK constraint)
└── Time slot available
↓
Creates:
├── sessions record
├── credit_transactions record
└── Updates user_credits or partner_credits
↓
Time slot becomes unavailable immediately
⚠️ Dashboards require manual refresh
```

---

## 🔌 API ENDPOINT CHEATSHEET

### Therapist Management
- `POST /api/therapist/enroll` - Submit application
- `GET /api/therapist/profile` - Get therapist data
- `PUT /api/therapist/update-profile` - Update profile ⚠️ Only updates therapist_enrollments
- `POST /api/therapist/upload-avatar` - Upload image ⚠️ BROKEN (doesn't sync all tables)
- `POST /api/admin/approve-verification` - Approve therapist ✅ Uses TherapistConsistencyManager

### Availability
- `POST /api/therapist/availability/template` - Save availability ✅ Cache invalidated
- `GET /api/availability/slots` - Get bookable time slots ✅ No caching
- `GET /api/availability/days` - Get calendar dates ✅ Fixed to use new format

### Bookings
- `POST /api/sessions/book-simple` - Create booking ✅ Fixed (removed session_type)
- `GET /api/sessions` - List sessions
- `GET /api/credits/user` - Check credit balance

---

## 🎯 STATE MANAGEMENT

### Context Hierarchy
```
AuthProvider (Global)
├── TherapistUserProvider (Therapist Auth)
│   ├── State: therapist, loading, isAuthenticated
│   ├── Listeners: AVATAR_UPDATED, PROFILE_UPDATED
│   └── Used by: TherapistDashboard, ProfileHeader
│
├── TherapistDashboardProvider (Dashboard State)
│   ├── State: stats, upcomingSessions, recentActivity
│   └── Depends on: TherapistUserProvider
│
├── DashboardProvider (User Dashboard)
│   └── State: stats, credits, sessions
│
└── AdminDashboardProvider (Admin Dashboard)
    └── State: users, therapists, pendingVerifications
```

### Event System
```typescript
// lib/events.ts
THERAPIST_EVENTS = {
  AVATAR_UPDATED: 'therapist:avatar:updated',  // Emitted after avatar upload
  PROFILE_UPDATED: 'therapist:profile:updated', // Emitted after profile edit
  AVAILABILITY_UPDATED: 'therapist:availability:updated'
}

// Usage:
therapistEvents.emit(AVATAR_UPDATED, { profile_image_url: newUrl })
therapistEvents.on(AVATAR_UPDATED, (data) => updateLocalState(data))
```

---

## 🛠️ IMMEDIATE FIX CHECKLIST

### Priority 1: Fix Avatar Sync
- [ ] Update `/app/api/therapist/upload-avatar` to update all 3 tables
- [ ] Test avatar visible in therapist dashboard
- [ ] Test avatar visible in public therapist listing
- [ ] Test avatar visible in admin dashboard

### Priority 2: Fix Specialization Type
- [ ] Migrate `therapist_enrollments.specialization` to TEXT[]
- [ ] Update all APIs to handle TEXT[] format
- [ ] Update TherapistConsistencyManager to sync specializations

### Priority 3: Add Consistency Audits
- [ ] Run `TherapistConsistencyManager.auditAllTherapists()`
- [ ] Fix any inconsistencies found
- [ ] Set up automated weekly audit

---

## 📝 CODE SNIPPETS

### Fix Avatar Upload (Priority 1)
```typescript
// app/api/therapist/upload-avatar/route.ts
export async function POST(request: NextRequest) {
  // ... upload to storage ...
  
  // ✅ UPDATE ALL THREE TABLES
  
  // 1. Update therapist_enrollments
  await supabase
    .from('therapist_enrollments')
    .update({ profile_image_url: avatarUrl })
    .eq('email', session.email)
  
  // 2. Update users
  await supabase
    .from('users')
    .update({ avatar_url: avatarUrl })
    .eq('email', session.email)
  
  // 3. Update therapist_profiles
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('email', session.email)
    .single()
  
  await supabase
    .from('therapist_profiles')
    .update({ profile_image_url: avatarUrl })
    .eq('user_id', user.id)
  
  // 4. Emit event
  therapistEvents.emit(THERAPIST_EVENTS.AVATAR_UPDATED, { profile_image_url: avatarUrl })
}
```

### Run Consistency Audit
```typescript
// scripts/audit-therapist-consistency.ts
import { TherapistConsistencyManager } from '@/lib/therapist-consistency'

async function audit() {
  const results = await TherapistConsistencyManager.auditAllTherapists()
  
  console.log('Audit Results:')
  console.log('Total:', results.total)
  console.log('Consistent:', results.consistent)
  console.log('Inconsistent:', results.inconsistent)
  
  if (results.issues.length > 0) {
    console.log('\n⚠️ Issues Found:')
    results.issues.forEach(issue => {
      console.log(`\n${issue.email}:`)
      issue.problems.forEach(problem => console.log(`  - ${problem}`))
    })
  }
}

audit()
```

---

## 📚 RELATED DOCUMENTS

- **Full Architecture**: `COMPREHENSIVE-SYSTEM-ARCHITECTURE.md`
- **Availability Fixes**: `REAL-TIME-AVAILABILITY-FIX.md`
- **Booking Fix**: `BOOKING-FIX-SUMMARY.md`
- **Database Query Flow**: `DATABASE-QUERY-FLOW.md`
- **Partner Credits**: `PARTNER_CREDIT_ALLOCATION_FIX.md`
- **Payment System**: `PAYMENT_CREDITS_SYSTEM_DOCUMENTATION.md`

---

## 🚀 QUICK WINS

1. **Fix Avatar Sync** - 30 minutes, high impact
2. **Add Database Trigger for Avatar** - 15 minutes, prevents future issues
3. **Run Consistency Audit** - 5 minutes, identify hidden issues
4. **Add Session Schema Validation** - 20 minutes, prevent booking errors

---

**Last Updated**: October 20, 2025  
**Maintained By**: Development Team  
**Review**: After every major change

