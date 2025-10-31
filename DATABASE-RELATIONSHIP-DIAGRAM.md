# 🗺️ DATABASE RELATIONSHIP DIAGRAM
## Visual Reference for TRPI Database Architecture

---

## 📊 COMPLETE DATABASE RELATIONSHIP MAP

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            TRPI DATABASE ARCHITECTURE                            │
│                         (Relationships & Dependencies)                           │
└─────────────────────────────────────────────────────────────────────────────────┘

                                    ┌──────────────┐
                                    │    USERS     │ (Central Hub)
                                    │  (ROOT TABLE)│
                                    └──────┬───────┘
                                           │
                     ┌─────────────────────┼─────────────────────┐
                     │                     │                     │
                     ▼                     ▼                     ▼
        ┌────────────────────┐  ┌──────────────────┐  ┌─────────────────────┐
        │ THERAPIST_PROFILES │  │THERAPIST_ENROLLMENTS│  │  USER_CREDITS      │
        │  (Public Data)     │  │  (Source of Truth) │  │  (New System)      │
        └────────────────────┘  └──────────────────┘  └─────────────────────┘
                 │                       │
                 │  ⚠️ MUST SYNC ⚠️     │
                 │                       │
        ┌────────┴───────────────────────┴────────┐
        │  DUPLICATED FIELDS (Sync Required):     │
        │  • profile_image_url ↔ avatar_url       │
        │  • bio ↔ bio                            │
        │  • experience_years ↔ experience_years  │
        │  • is_verified ↔ status='approved'      │
        └─────────────────────────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │AVAILABILITY_WEEKLY_SCHEDULES│
              │  (New Availability)    │
              └────────────────────────┘
                           │
                           │ Coexists with
                           ▼
              ┌────────────────────────┐
              │ AVAILABILITY_TEMPLATES │
              │   (Legacy System)      │
              └────────────────────────┘
                           │
                           │ Used by
                           ▼
                ┌──────────────────┐
                │    SESSIONS      │
                │  (Bookings)      │
                └──────┬───────────┘
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
    ┌─────────┐  ┌─────────┐  ┌──────────────┐
    │SESSION  │  │ CREDIT  │  │NOTIFICATIONS │
    │ NOTES   │  │TRANSACTIONS│  │             │
    └─────────┘  └─────────┘  └──────────────┘
```

---

## 🔄 DATA SYNC REQUIREMENTS

### 3-Way Avatar Sync (CRITICAL ⚠️)
```
┌─────────────────────────────────────────────────────────────────┐
│              AVATAR UPDATE MUST TOUCH ALL 3 TABLES              │
└─────────────────────────────────────────────────────────────────┘

Upload Profile Image
         │
         ├─────────► users.avatar_url = URL
         │
         ├─────────► therapist_enrollments.profile_image_url = URL
         │
         └─────────► therapist_profiles.profile_image_url = URL

⚠️ CURRENT BUG: Only updates therapist_enrollments!
```

---

## 🏗️ THERAPIST DATA ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────┐
│                 THERAPIST DATA FLOW                             │
└─────────────────────────────────────────────────────────────────┘

                    ENROLLMENT PHASE
                          │
                          ▼
          ┌──────────────────────────────┐
          │  THERAPIST_ENROLLMENTS       │
          │  (status = 'pending')        │
          │                              │
          │  • Full Name                 │
          │  • Email                     │
          │  • Phone                     │
          │  • MDCN Code                 │
          │  • Specialization            │
          │  • Bio                       │
          │  • Experience Years          │
          │  • License Documents         │
          │  • Profile Image URL  ◄──────┼── ⚠️ ONLY HERE initially
          └──────────────┬───────────────┘
                         │
                    ADMIN APPROVES
                         │
          ┌──────────────▼───────────────┐
          │ TherapistConsistencyManager  │
          │  .approveTherapist(email)    │
          └──────────────┬───────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
    ┌────────┐    ┌─────────────┐  ┌──────────────┐
    │ USERS  │    │THERAPIST    │  │THERAPIST     │
    │        │    │ENROLLMENTS  │  │PROFILES      │
    ├────────┤    ├─────────────┤  ├──────────────┤
    │✓verified│   │status=      │  │verification  │
    │✓active  │   │'approved'   │  │='approved'   │
    └────────┘    └─────────────┘  └──────────────┘
         │
         ▼
    CAN LOGIN & ACCEPT BOOKINGS
```

---

## 💳 CREDIT SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────┐
│                    CREDIT TRACKING SYSTEM                        │
└─────────────────────────────────────────────────────────────────┘

                        ┌──────────┐
                        │  USERS   │
                        └────┬─────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
     ┌──────────────┐ ┌─────────────┐ ┌─────────────┐
     │USER_CREDITS  │ │PARTNER      │ │users.credits│
     │(New System)  │ │CREDITS      │ │(LEGACY ⚠️)  │
     ├──────────────┤ ├─────────────┤ └─────────────┘
     │• balance     │ │• allocated  │       │
     │• purchased   │ │• used       │   BEING PHASED
     │• used        │ │• status     │      OUT
     └──────┬───────┘ └──────┬──────┘
            │                │
            │                │
            ├────────────────┤
            │                │
            ▼                ▼
     ┌────────────────────────────┐
     │  CREDIT_TRANSACTIONS       │
     │  (Audit Log)               │
     ├────────────────────────────┤
     │• transaction_type          │
     │• credits_amount            │
     │• balance_before            │
     │• balance_after             │
     │• reference_id (session_id) │
     └────────────────────────────┘
                  │
                  ▼
           ┌─────────────┐
           │  SESSIONS   │
           │ (credit_used)│
           └─────────────┘
```

---

## 📅 AVAILABILITY SYSTEM LAYERS

```
┌─────────────────────────────────────────────────────────────────┐
│              3-LAYER AVAILABILITY SYSTEM                         │
└─────────────────────────────────────────────────────────────────┘

LAYER 1: NEW SYSTEM (Primary) ✅
┌─────────────────────────────────────┐
│ AVAILABILITY_WEEKLY_SCHEDULES       │
├─────────────────────────────────────┤
│ weekly_availability (JSONB):        │
│   {                                 │
│     standardHours: {                │
│       monday: { enabled, slots },   │
│       tuesday: { enabled, slots },  │
│       ...                           │
│     },                              │
│     overrides: [...],               │
│     sessionSettings: {...}          │
│   }                                 │
└───────────────┬─────────────────────┘
                │
                │ Synced to ▼
                │
LAYER 2: LEGACY SYSTEM (Backward Compat) ⚠️
┌───────────────▼─────────────────────┐
│ AVAILABILITY_TEMPLATES              │
├─────────────────────────────────────┤
│ • day_of_week                       │
│ • time_slots (array)                │
│ • is_active                         │
└───────────────┬─────────────────────┘
                │
                │ Old system ▼
                │
LAYER 3: OLDEST SYSTEM (Deprecated) 🗑️
┌───────────────▼─────────────────────┐
│ THERAPIST_AVAILABILITY              │
├─────────────────────────────────────┤
│ • day_of_week                       │
│ • start_time                        │
│ • end_time                          │
│ • is_available                      │
└─────────────────────────────────────┘

         ALL LAYERS FEED INTO
                │
                ▼
     ┌────────────────────────┐
     │ /api/availability/slots│
     │ (Booking Interface)    │
     └────────────────────────┘
```

---

## 🔗 SESSION BOOKING FLOW

```
┌─────────────────────────────────────────────────────────────────┐
│                   SESSION BOOKING FLOW                           │
└─────────────────────────────────────────────────────────────────┘

    USER SELECTS TIME SLOT
           │
           ▼
    Check Credits Available
           │
    ┌──────┴──────┐
    │             │
    ▼             ▼
USER_CREDITS  PARTNER_CREDITS
(individual)  (company-paid)
    │             │
    └──────┬──────┘
           │
           ▼
    Validate Slot Available
           │
    ┌──────┴──────────────────┐
    │  Query Availability:    │
    │  1. Weekly Schedule     │
    │  2. Existing Sessions   │
    │  3. Overrides           │
    └──────┬──────────────────┘
           │
           ▼
    Create SESSION Record
           │
    ┌──────┴──────┐
    │ FOREIGN KEYS│
    ├─────────────┤
    │• user_id    │───────► USERS.id
    │• therapist_id│──────► USERS.id
    └──────┬──────┘
           │
           ▼
    Deduct Credit
           │
    ┌──────┴──────┐
    │             │
    ▼             ▼
USER_CREDITS  PARTNER_CREDITS
.used++       .status='used'
    │             │
    └──────┬──────┘
           │
           ▼
    Log CREDIT_TRANSACTION
           │
           ▼
    Create NOTIFICATION
           │
           ▼
    Send Email/SMS
           │
           ▼
    BOOKING COMPLETE ✅
```

---

## ⚡ FOREIGN KEY CASCADE IMPACT

```
┌─────────────────────────────────────────────────────────────────┐
│          WHAT HAPPENS WHEN YOU DELETE A USER                     │
└─────────────────────────────────────────────────────────────────┘

        DELETE FROM users WHERE id = '...'
                      │
                      ▼
        ┌─────────────────────────┐
        │  ON DELETE CASCADE      │
        │  (Automatic Deletion)   │
        └─────────────────────────┘
                      │
    ┌─────────────────┼─────────────────┐
    │                 │                 │
    ▼                 ▼                 ▼
┌─────────┐   ┌──────────────┐  ┌──────────────┐
│THERAPIST│   │  THERAPIST   │  │   SESSIONS   │
│PROFILES │   │ ENROLLMENTS  │  │(as user_id OR│
│DELETED  │   │   DELETED    │  │therapist_id) │
└─────────┘   └──────────────┘  │   DELETED    │
                                └──────────────┘
    │                 │                 │
    ▼                 ▼                 ▼
┌──────────┐  ┌──────────────┐ ┌──────────────┐
│  USER    │  │   SESSION    │ │NOTIFICATIONS │
│ CREDITS  │  │    NOTES     │ │   DELETED    │
│ DELETED  │  │   DELETED    │ └──────────────┘
└──────────┘  └──────────────┘
                      │
                      ▼
              ┌──────────────┐
              │   PAYMENTS   │
              │   DELETED    │
              └──────────────┘
                      │
                      ▼
              ┌──────────────┐
              │   REVIEWS    │
              │   DELETED    │
              └──────────────┘

⚠️ CRITICAL WARNING:
   Deleting a therapist user deletes ALL their sessions,
   including sessions with other users!
   
   This affects:
   • Patient session history
   • Credit usage records
   • Rating/review data
   • Payment records
```

---

## 🎯 CONSISTENCY MANAGER SCOPE

```
┌─────────────────────────────────────────────────────────────────┐
│            THERAPIST CONSISTENCY MANAGER                         │
│         (What it syncs vs. what it doesn't)                      │
└─────────────────────────────────────────────────────────────────┘

✅ CURRENTLY SYNCED (via TherapistConsistencyManager)
┌──────────────────────────────────────────────────────────┐
│  FIELD          │  users  │  enrollments  │   profiles   │
├──────────────────────────────────────────────────────────┤
│  full_name      │    ✅   │      ✅       │      -       │
│  email          │    ✅   │      ✅       │      -       │
│  is_active      │    ✅   │      ✅       │      -       │
│  is_verified    │    ✅   │  (via status) │      ✅      │
└──────────────────────────────────────────────────────────┘

❌ NOT SYNCED (Manual update required)
┌──────────────────────────────────────────────────────────┐
│  FIELD              │  users  │  enrollments │  profiles │
├──────────────────────────────────────────────────────────┤
│  profile_image_url  │avatar_url│     ✅      │    ❌     │ ⚠️ BUG
│  bio                │    -    │     ✅      │    ❌     │ ⚠️ BUG
│  experience_years   │    -    │     ✅      │    ❌     │ ⚠️ BUG
│  specialization(s)  │    -    │  TEXT       │  TEXT[]   │ ⚠️ TYPE MISMATCH
└──────────────────────────────────────────────────────────┘

RECOMMENDED: Extend TherapistConsistencyManager to sync ALL fields
```

---

## 📱 CONTEXT PROVIDER DEPENDENCIES

```
┌─────────────────────────────────────────────────────────────────┐
│              REACT CONTEXT DEPENDENCY TREE                       │
└─────────────────────────────────────────────────────────────────┘

                        App Root
                            │
                    ┌───────┴───────┐
                    │  AuthProvider │
                    │  (Global Auth)│
                    └───────┬───────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌────────────────┐  ┌────────────────┐  ┌────────────────┐
│ TherapistUser  │  │   Dashboard    │  │     Admin      │
│   Provider     │  │   Provider     │  │   Dashboard    │
│ (Extends Auth) │  │ (User Context) │  │   Provider     │
└───────┬────────┘  └────────────────┘  └────────────────┘
        │
        ▼
┌────────────────┐
│  Therapist     │
│  Dashboard     │
│  Provider      │
│ (Depends on    │
│TherapistUser)  │
└────────────────┘

EVENT FLOW:
Avatar Updated
     │
     ▼
TherapistUserProvider (listener)
     │
     ▼
Local State Updated
     │
     ▼
Components Re-render:
  • ProfileHeader
  • DashboardSidebar
  • TherapistCard
```

---

## 🔍 DEBUGGING CHECKLIST

When investigating data inconsistency issues:

```
1. Check TherapistConsistencyManager
   → Run auditAllTherapists()
   → Look for sync failures

2. Check Avatar Sync
   ✓ users.avatar_url
   ✓ therapist_enrollments.profile_image_url
   ✓ therapist_profiles.profile_image_url
   → All three should match!

3. Check Specialization Type
   ✓ therapist_enrollments.specialization (TEXT)
   ✓ therapist_profiles.specializations (TEXT[])
   → May need conversion

4. Check Credit Balance
   ✓ users.credits (LEGACY - being phased out)
   ✓ user_credits.credits_balance (NEW)
   ✓ partner_credits (if applicable)

5. Check Session Foreign Keys
   ✓ sessions.user_id → users.id exists?
   ✓ sessions.therapist_id → users.id exists?
   → Both must be valid UUIDs in users table

6. Check Availability Cache
   → Try cache-busting with ?_t=timestamp
   → Check cache headers on API response
```

---

**Document Version**: 1.0  
**Last Updated**: October 20, 2025  
**See Also**: 
- `COMPREHENSIVE-SYSTEM-ARCHITECTURE.md` (Full details)
- `ARCHITECTURE-QUICK-REFERENCE.md` (Quick fixes)

