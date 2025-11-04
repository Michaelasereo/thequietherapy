# Booking System - Complete Code Overview

## 📋 **All Booking-Related Files**

### **1. API Routes (Backend)**

#### **`app/api/sessions/book/route.ts`** ⭐ **MAIN BOOKING API**
- **Purpose:** Main booking endpoint that handles session creation
- **Key Features:**
  - Authentication & authorization
  - Input validation (UUID, date, time, duration)
  - Therapist validation
  - Credit checking
  - Availability checking via AvailabilityManager
  - Calls `create_session_with_credit_deduction` RPC function
  - Daily.co room creation
  - Enhanced error logging
- **Status:** ✅ Currently active, has enhanced error logging

#### **`app/api/sessions/book/route-with-credits.ts`**
- **Purpose:** Alternative booking implementation using `get_available_credits` RPC
- **Key Features:**
  - Uses `user_session_credits` table
  - Different credit system (wallet-based)
- **Status:** ⚠️ Not currently used (alternative implementation)

#### **`app/api/sessions/book/route-fixed.ts`**
- **Purpose:** Backup/fixed version of booking route
- **Status:** ⚠️ Not currently used

---

### **2. Frontend Components**

#### **`components/booking/BookingConfirmation.tsx`** ⭐ **MAIN BOOKING UI**
- **Purpose:** Main booking confirmation component
- **Key Features:**
  - Displays booking details
  - Handles booking submission
  - Credit checking
  - Error handling with detailed logging
  - Success/error modals
  - Form validation
- **Status:** ✅ Currently active, has enhanced error logging

#### **`components/booking/BookingErrorModal.tsx`**
- **Purpose:** Error modal for booking failures
- **Key Features:**
  - Displays different error types
  - User-friendly error messages
  - Action buttons (Retry, Select New Time, Buy Credits)

#### **`components/booking-step-1.tsx`**
- **Purpose:** Step 1 of booking flow (Patient biodata)
- **Features:** Patient information form

#### **`components/booking-step-2.tsx`**
- **Purpose:** Step 2 of booking flow (Therapist selection)
- **Features:** Therapist selection interface

#### **`components/booking-step-3.tsx`**
- **Purpose:** Step 3 of booking flow (Time slot selection)
- **Features:** Calendar and time slot picker

#### **`components/booking-step-4.tsx`**
- **Purpose:** Step 4 of booking flow (Payment/Confirmation)
- **Features:** Payment and final confirmation

#### **`components/booking-progress.tsx`**
- **Purpose:** Progress indicator for booking steps

---

### **3. Pages**

#### **`app/dashboard/book/page.tsx`** ⭐ **MAIN BOOKING PAGE**
- **Purpose:** Main booking page for dashboard
- **Features:**
  - Multi-step booking flow
  - Integrates all booking steps
  - Handles booking completion
  - Redirects after successful booking

#### **`app/book-session/page.tsx`**
- **Purpose:** Alternative booking page (guest booking)
- **Features:** Similar to dashboard booking but for guests

---

### **4. Database Functions**

#### **`fix-booking-ambiguous-id-complete.sql`** ⭐ **CURRENT FIX**
- **Purpose:** Fixes ambiguous column reference error
- **Key Changes:**
  - Removes RETURNING clause (uses separate SELECT query)
  - Uses table aliases for all `id` references
  - Only checks `user_type = 'user'` for credits
  - Includes therapist validation
  - Includes time validation (past sessions)
- **Status:** ✅ Ready to run in Supabase

#### **`fix-booking-function-credit-sum.sql`**
- **Purpose:** Previous version of booking function fix
- **Status:** ⚠️ Superseded by `fix-booking-ambiguous-id-complete.sql`

#### **`create-atomic-booking-function.sql`**
- **Purpose:** Original atomic booking function
- **Status:** ⚠️ May have ambiguous column issues

---

### **5. Supporting Libraries**

#### **`lib/availability-manager.ts`**
- **Purpose:** Manages therapist availability checking
- **Key Features:**
  - Checks therapist status (uses `users` + `therapist_enrollments` tables)
  - Checks time slot conflicts
  - Returns availability status
- **Status:** ✅ Updated to not use `therapist_states` table

#### **`lib/session-status-updater.ts`**
- **Purpose:** Updates session statuses (scheduled, in_progress, completed)
- **Status:** ✅ Active

---

### **6. Credit Management**

#### **`app/api/user/credits/route.ts`**
- **Purpose:** User credits API endpoint
- **Key Features:**
  - Fetches user credits (only `user_type = 'user'`)
  - Credit history
  - Payment history
- **Status:** ✅ Updated to only check `user_type = 'user'`

#### **`app/api/credits/user/route.ts`**
- **Purpose:** Alternative credits endpoint
- **Status:** ✅ Updated to only check `user_type = 'user'`

#### **`app/api/dashboard/stats/route.ts`**
- **Purpose:** Dashboard statistics including credits
- **Status:** ✅ Fixed to only check `user_type = 'user'`

---

### **7. SQL Scripts (Database)**

#### **`fix-booking-ambiguous-id-complete.sql`** ⭐ **RUN THIS ONE**
- **Purpose:** Fixes ambiguous column reference
- **Status:** ✅ Ready to deploy

#### **`fix-booking-function-credit-sum.sql`**
- **Purpose:** Previous fix attempt
- **Status:** ⚠️ Superseded

#### **`fix-all-booking-issues.sql`**
- **Purpose:** Comprehensive booking fixes
- **Status:** ⚠️ May be outdated

#### **`fix-therapist-status-booking.sql`**
- **Purpose:** Fixes therapist status for booking
- **Status:** ✅ Updated (no longer uses `therapist_states` table)

---

## 🔄 **Booking Flow**

### **Step 1: User Initiates Booking**
1. User selects therapist → `booking-step-2.tsx`
2. User selects time slot → `booking-step-3.tsx`
3. User confirms booking → `BookingConfirmation.tsx`

### **Step 2: Frontend Submits Booking**
```typescript
// BookingConfirmation.tsx
POST /api/sessions/book
{
  therapist_id: "...",
  session_date: "2025-11-04",
  start_time: "10:00",
  duration: 60
}
```

### **Step 3: API Route Processing** (`app/api/sessions/book/route.ts`)
1. ✅ Authentication check
2. ✅ Input validation (UUID, date, time, duration)
3. ✅ Therapist validation (exists, active, verified, approved)
4. ✅ Credit check (only `user_type = 'user'`)
5. ✅ Date/time validation (not in past)
6. ✅ Availability check via `AvailabilityManager`
7. ✅ Call database function `create_session_with_credit_deduction`

### **Step 4: Database Function** (`create_session_with_credit_deduction`)
1. ✅ Acquire advisory lock
2. ✅ Therapist validation
3. ✅ Time validation (future sessions only)
4. ✅ Conflict check
5. ✅ Credit check (only `user_type = 'user'`)
6. ✅ Insert session record
7. ✅ Deduct credit (only `user_type = 'user'`)
8. ✅ Create notifications
9. ✅ Return session data

### **Step 5: Post-Booking**
1. ✅ Create Daily.co room
2. ✅ Update session with room URL
3. ✅ Return success response

---

## 🐛 **Current Issue**

### **Problem:**
```
Error: column reference "id" is ambiguous
Code: 42702
Details: It could refer to either a PL/pgSQL variable or a table column.
```

### **Root Cause:**
The database function `create_session_with_credit_deduction` has:
- `RETURNS TABLE(id UUID, ...)` - return column named `id`
- References to `sessions.id` - table column named `id`
- PostgreSQL can't determine which `id` is being referenced

### **Solution:**
Run `fix-booking-ambiguous-id-complete.sql` in Supabase SQL Editor

**Key Fixes in the SQL:**
1. Removed `RETURNING id` clause (uses separate SELECT query instead)
2. All `id` references use table alias (`s.id` or `sessions.id`)
3. DELETE statement uses table alias (`s.id`)

---

## 📝 **Files to Review**

### **Critical Files (Must Review):**
1. ✅ `app/api/sessions/book/route.ts` - Main booking API
2. ✅ `components/booking/BookingConfirmation.tsx` - Booking UI
3. ✅ `fix-booking-ambiguous-id-complete.sql` - Database function fix
4. ✅ `lib/availability-manager.ts` - Availability checking

### **Supporting Files:**
1. `app/dashboard/book/page.tsx` - Booking page
2. `app/api/user/credits/route.ts` - Credits API
3. `app/api/dashboard/stats/route.ts` - Dashboard stats

---

## 🚀 **Next Steps**

1. **Run SQL Script:** Execute `fix-booking-ambiguous-id-complete.sql` in Supabase
2. **Test Booking:** Try booking a session after running the script
3. **Verify:** Check that booking succeeds and credits are deducted

---

## 📊 **Code Structure**

```
Booking System
├── Frontend
│   ├── Pages
│   │   ├── app/dashboard/book/page.tsx
│   │   └── app/book-session/page.tsx
│   └── Components
│       ├── BookingConfirmation.tsx ⭐
│       ├── BookingErrorModal.tsx
│       ├── booking-step-1.tsx
│       ├── booking-step-2.tsx
│       ├── booking-step-3.tsx
│       └── booking-step-4.tsx
├── Backend
│   ├── API Routes
│   │   └── app/api/sessions/book/route.ts ⭐
│   └── Libraries
│       ├── lib/availability-manager.ts
│       └── lib/session-status-updater.ts
└── Database
    ├── Functions
    │   └── create_session_with_credit_deduction ⭐
    └── SQL Scripts
        └── fix-booking-ambiguous-id-complete.sql ⭐
```

