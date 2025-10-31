# 🎯 Booking System Code Review

## 📋 Executive Summary

**Status**: Multiple booking endpoints exist causing confusion. The main booking flow has therapist lookup issues.

**Critical Issues**:
1. **Two booking endpoints** - `/api/sessions/book` (main) and `/api/sessions/book-simple` (simpler, used by frontend)
2. **Therapist ID mismatch** - Different therapist IDs being used (9412940e vs 1229dfcb)
3. **Conflict detection** working but **doesn't prevent overlap** - previous booking at 21:00-22:00, user tried to book 22:00-23:00
4. **Database function broken** - `check_booking_conflict` function needs fixing

---

## 🔍 Key Findings from Terminal Logs

### 🚨 CRITICAL ROOT CAUSE DISCOVERED

**Line 803**: `user_id: null` - The `therapist_enrollments` table has a NULL `user_id` field!

This is why the therapist lookup is failing. The booking endpoint queries:
```typescript
therapist_profiles!inner (
  verification_status,
  is_verified
)
```

But `therapist_profiles` doesn't have data! The therapist data is in `therapist_enrollments` with `user_id: null`.

**Evidence from logs**:
```
Line 773-778: therapist_profiles query returns 0 rows (PGRST116)
Line 788-820: therapist_enrollments found by EMAIL, not user_id
Line 803: user_id: null ❌
Line 824-863: User data exists in users table with ID '1229dfcb...'
```

### Issue 1: Broken Data Relationship

**Problem**: `therapist_enrollments.user_id` is NULL, breaking the foreign key relationship.

**Impact**: 
- Therapist profile queries fail
- Booking endpoint can't verify therapist
- Database integrity issues

**Fix Needed**: Link therapist_enrollments to users table properly.

---

### Issue 2: Different Therapist IDs

```
Line 918: therapist_id: '9412940e-8445-4903-a6a2-16009ecebb36'  (book-simple)
Line 962: therapist_id: '1229dfcb-db86-43d0-ad3b-988fcef6c2e1' (book)
```

**Analysis**: Two different therapist IDs being used. One from users table, one from somewhere else. The IDs don't match, causing confusion.

---

### Issue 3: Booking Actually Succeeded via book-simple

```
Line 927-937: Found existing booking at 21:00-22:00
Line 943: ✅ Session created successfully: 619c6ff2-c23b-44df-b585-f63715df0bd2
```

**Analysis**: The `book-simple` endpoint successfully created a booking. But the booking used wrong therapist_id (9412940e instead of 1229dfcb).

---

### Issue 4: Session Query Returns 0

```
Line 970: ✅ Sessions fetched successfully: 0
```

**Analysis**: Sessions exist but queries don't find them because:
1. Wrong therapist_id in session records
2. Or query filtering is broken
3. Or user_id mismatch

---

## 📁 Code Structure Analysis

### 1. `/api/sessions/book/route.ts` (Main Endpoint - 332 lines)

**Flow**:
1. ✅ Authenticate user
2. ✅ Validate therapist exists and is active
3. ✅ Check user credits
4. ✅ Validate booking time
5. ✅ Use AvailabilityManager to check conflicts (Client-side check)
6. ✅ Call `create_session_with_credit_deduction` SQL function
7. ✅ Create Daily.co room
8. ✅ Return success

**Problems**:
- Therapist lookup query requires `therapist_profiles.verification_status = 'approved'` which may be failing
- Uses AvailabilityManager which may not catch database-level conflicts
- Relies on SQL function for atomicity

**Lines 68-87**: Therapist validation query is very strict:
```typescript
.eq('therapist_profiles.verification_status', 'approved')
.single()
```

---

### 2. `/api/sessions/book-simple/route.ts` (Simple Endpoint - 145 lines)

**Flow**:
1. ❌ No authentication check
2. ❌ No credit check
3. ✅ Manual conflict check (lines 56-77) - just queries existing bookings
4. ✅ Direct INSERT into sessions table
5. ✅ Returns success

**Problems**:
- NO authentication - any user can call this
- NO credit deduction
- NO atomic transaction
- Bypasses all business logic

**Critical**: This is being used by the frontend but it's completely bypassing the main booking logic!

---

### 3. `create_session_with_credit_deduction` (SQL Function)

**Features**:
- ✅ Advisory locks to prevent race conditions
- ✅ Double-checks conflicts in database
- ✅ Atomic credit deduction
- ✅ Rollback on failure
- ✅ Notification queuing

**Problems**:
- Line 49: Calls `check_booking_conflict` which is broken (see below)
- Complex logic with multiple failure points

---

### 4. `check_booking_conflict` Function

**Current State**: BROKEN - mixing TIME and TIMESTAMP types

**Line 93-96** in old version compares:
```sql
(s.scheduled_time <= p_start_time AND s.end_time > p_start_time)
```
This compares TIME with TIMESTAMP causing incorrect results.

**Fixed Version**: Uses proper timestamp conversion
```sql
p_start_timestamp := (p_session_date || ' ' || p_start_time)::TIMESTAMP WITH TIME ZONE;
AND s.start_time < p_end_timestamp AND s.end_time > p_start_timestamp;
```

---

## 🔧 Recommended Fixes

### 🚨 Priority 0: Fix Database Integrity (CRITICAL)

**Issue**: `therapist_enrollments.user_id` is NULL for therapist with ID `c368e1b0-4762-4fbb-ba1d-d8851794ca92`

**Fix**:
```sql
-- Link therapist_enrollments to users table
UPDATE therapist_enrollments te
SET user_id = u.id
FROM users u
WHERE te.email = u.email
  AND te.user_id IS NULL
  AND u.user_type = 'therapist';

-- Verify the fix
SELECT te.id, te.email, te.user_id, u.id as actual_user_id, u.user_type
FROM therapist_enrollments te
LEFT JOIN users u ON te.user_id = u.id
WHERE te.email = 'michaelasereo@gmail.com';
```

**Also create a proper therapist_profiles entry**:
```sql
-- Insert into therapist_profiles if missing
INSERT INTO therapist_profiles (
  therapist_id,
  user_id,
  verification_status,
  is_verified,
  created_at,
  updated_at
)
SELECT 
  u.id,
  u.id,
  'approved',
  true,
  NOW(),
  NOW()
FROM users u
WHERE u.email = 'michaelasereo@gmail.com'
  AND u.user_type = 'therapist'
  AND NOT EXISTS (
    SELECT 1 FROM therapist_profiles tp WHERE tp.therapist_id = u.id
  );
```

---

### Priority 1: Unify Booking Endpoints

**Action**: Remove `/api/sessions/book-simple` or make it call the main booking endpoint internally.

**Reason**: Having two endpoints causes confusion and security issues.

**Implementation**:
```typescript
// In book-simple/route.ts
export async function POST(request: NextRequest) {
  // Forward to main booking endpoint
  const bookResponse = await fetch('/api/sessions/book', {
    method: 'POST',
    headers: request.headers,
    body: JSON.stringify(transformRequest(request))
  })
  return bookResponse
}
```

---

### Priority 2: Fix Therapist Lookup

**Problem**: The query is too strict and fails when therapist_profiles doesn't exist or isn't approved.

**Current**:
```typescript
therapist_profiles!inner (
  verification_status,
  is_verified
)
.eq('therapist_profiles.verification_status', 'approved')
```

**Fix**: Make therapist_profiles optional and validate separately:
```typescript
therapist_profiles (
  verification_status,
  is_verified
)
```

Then check:
```typescript
if (therapist.therapist_profiles?.verification_status !== 'approved') {
  throw new NotFoundError('Therapist not verified')
}
```

---

### Priority 3: Apply SQL Fix

**Action**: Run `fix-booking-conflicts.sql` in Supabase

**Reason**: The conflict detection function is broken and causes false positives/negatives.

---

### Priority 4: Add Database Constraint

**Add exclusion constraint to prevent double bookings at database level**:

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE UNIQUE INDEX idx_sessions_no_overlap 
ON sessions USING gist (
  therapist_id WITH =, 
  tstzrange(start_time, end_time) WITH &&
) 
WHERE status IN ('scheduled', 'confirmed', 'in_progress');
```

This prevents ANY overlapping bookings even if application logic fails.

---

## 🧪 Testing Checklist

- [ ] Book session with valid therapist → Success
- [ ] Book overlapping session → Failure with clear error
- [ ] Book after booking success → Session appears in dashboard
- [ ] Test with different therapist IDs → Consistent results
- [ ] Test without credits → Clear error message
- [ ] Test with unverified therapist → Clear error message
- [ ] Test concurrent bookings → One succeeds, others fail

---

## 📊 Data Flow

```
Frontend → /api/sessions/book-simple (WRONG)
         ↓
    Direct INSERT (NO AUTH, NO CREDITS)
         ↓
    Returns 200 OK
         ↓
Dashboard Refresh → /api/sessions/book (CORRECT)
         ↓
    Therapist lookup FAILS (404)
         ↓
    User sees error but booking exists

CORRECT FLOW SHOULD BE:
Frontend → /api/sessions/book
         ↓
    Authentication ✅
         ↓
    Therapist validation ✅
         ↓
    Credit check ✅
         ↓
    AvailabilityManager ✅
         ↓
    SQL Function (atomic) ✅
         ↓
    Success
```

---

## 🚨 Security Issues

1. **No authentication in book-simple** - Any user can book without logging in
2. **No credit deduction** - Users can book infinite sessions
3. **No rate limiting** - API can be abused
4. **No input validation** - SQL injection possible through user fields

---

## 💡 Architecture Recommendations

1. **Single Booking Endpoint**: Use only `/api/sessions/book`
2. **Remove book-simple**: Or make it a thin wrapper
3. **Add GraphQL**: Consider GraphQL for better API consistency
4. **Add WebSockets**: Real-time availability updates
5. **Add Caching**: Cache therapist availability for performance
6. **Add Monitoring**: Track booking success/failure rates

---

## 📞 Questions for Senior Developer

1. Why do we have two booking endpoints?
2. Should `book-simple` be removed or is it legacy code?
3. Is the therapist_profiles join correct?
4. Should we add database-level exclusion constraints?
5. What's the proper way to handle therapist verification?
6. Should AvailabilityManager be authoritative or advisory?
7. How should we handle timezone issues? (GMT+1 hardcoded)

---

## 🎯 Summary

**Root Cause**: Multiple booking endpoints, broken SQL conflict detection, overly strict therapist validation.

**Solution**: 
1. Unify endpoints
2. Fix SQL function
3. Add database constraints
4. Fix therapist lookup logic

**Priority**: HIGH - This affects core booking functionality

**Estimated Fix Time**: 2-4 hours

