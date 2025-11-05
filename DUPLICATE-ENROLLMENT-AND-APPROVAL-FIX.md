# Fix: Duplicate Enrollments and Availability Approval Issues

## Problem
1. **Duplicate Enrollments**: When enrollment form is submitted, it creates an enrollment. When therapist clicks magic link, it may create another enrollment or duplicate approval.
2. **Availability Page Shows "Pending"**: After admin approval, the availability page still shows "pending approval" message.

## Root Cause Analysis

### Issue 1: Duplicate Enrollments
- **Form Submission**: Creates enrollment #1 with status 'pending'
- **Magic Link Click**: Creates user account and links enrollment #1
- **Problem**: If multiple enrollments exist, magic link was linking ALL enrollments, potentially causing duplicates to appear in admin

### Issue 2: Availability Approval Not Detected
- **Profile API**: Was checking enrollment status instead of user table
- **Cache Issues**: Old data was being cached
- **Wrong Enrollment**: API might be selecting wrong enrollment (pending vs approved)

## Solution Implemented

### 1. **Magic Link Enrollment Linking** ✅
**File**: `lib/auth.ts`

**Before**: Magic link linked ALL enrollments for the email
**After**: Magic link only links ONE enrollment (the most recent pending one)

```typescript
// Find the most recent pending enrollment without user_id
const enrollmentToLink = existingEnrollments.find(
  e => !e.user_id && (e.status === 'pending' || !e.status)
) || existingEnrollments[0] // Fallback to most recent

// Link only this specific enrollment
await supabase
  .from('therapist_enrollments')
  .update({ user_id: finalUser.id })
  .eq('id', enrollmentToLink.id) // Link by ID, not email
  .is('user_id', null)
```

**Benefits**:
- ✅ Prevents linking duplicate enrollments
- ✅ Only one enrollment gets linked to user
- ✅ Admin sees cleaner approval list

### 2. **Profile API Enrollment Selection** ✅
**File**: `app/api/therapist/profile/route.ts`

**Before**: Selected first enrollment found (might be pending)
**After**: Prefers approved enrollment, then most recent

```typescript
// Get all enrollments, then select best one
const enrollmentsByUserId = await supabase
  .from('therapist_enrollments')
  .select('*')
  .eq('user_id', therapistUserId)
  .order('created_at', { ascending: false })

// Prefer approved enrollment
const approvedEnrollment = enrollmentsByUserId.find(e => e.status === 'approved')
enrollmentData = approvedEnrollment || enrollmentsByUserId[0]
```

**Benefits**:
- ✅ Always uses approved enrollment if available
- ✅ Handles duplicate enrollments gracefully
- ✅ Ensures correct status is returned

### 3. **Strict Availability Approval Check** ✅
**File**: `app/api/therapist/profile/route.ts`

**Before**: `availability_approved: user.is_verified && user.is_active`
**After**: `availability_approved: user.is_verified === true && user.is_active === true`

```typescript
// CRITICAL: availability_approved is based on USER table, not enrollment status
// Admin approval sets user.is_verified = true and user.is_active = true
availability_approved: user.is_verified === true && user.is_active === true
```

**Benefits**:
- ✅ Strict boolean check (handles null/undefined)
- ✅ Based on user table (source of truth after approval)
- ✅ Not dependent on enrollment status

### 4. **Cache Busting** ✅
**Files**: 
- `context/therapist-dashboard-context.tsx`
- `app/api/therapist/profile/route.ts`

**Changes**:
- Added timestamp query parameter to API calls
- Added cache-busting headers to API responses
- Ensures fresh data on every fetch

### 5. **Auto-Refresh on Availability Page** ✅
**File**: `app/therapist/dashboard/availability/page.tsx`

**Changes**:
- Auto-refreshes every 10 seconds if not approved
- Stops refreshing once approved
- Manual refresh button available
- Shows detailed status information

## Flow After Fixes

### Enrollment Flow
1. **Form Submission**: Creates enrollment #1 (status: 'pending', user_id: NULL)
2. **Magic Link Sent**: Enrollment #1 exists, user account doesn't exist yet
3. **Magic Link Click**: 
   - Creates user account
   - Links ONLY enrollment #1 to user account
   - Does NOT create new enrollment
4. **Admin Sees**: Only enrollment #1 (or cleaned up duplicates)

### Approval Flow
1. **Admin Approves**: Updates user table (is_verified=true, is_active=true)
2. **Updates Enrollment**: Updates enrollment #1 (status='approved', user_id=linked)
3. **Creates Profile**: Creates/updates therapist_profiles
4. **Cleans Duplicates**: Removes duplicate enrollments

### Availability Detection
1. **Profile API**: Fetches fresh user data (no cache)
2. **Checks User Table**: `user.is_verified === true && user.is_active === true`
3. **Returns**: `availability_approved: true`
4. **Availability Page**: Auto-refreshes, detects approval within 10 seconds

## Key Fixes Summary

| Issue | Fix | File |
|-------|-----|------|
| Duplicate enrollments from magic link | Only link one enrollment (most recent pending) | `lib/auth.ts` |
| Profile API selecting wrong enrollment | Prefer approved enrollment | `app/api/therapist/profile/route.ts` |
| Availability approval not detected | Strict boolean check on user table | `app/api/therapist/profile/route.ts` |
| Cache preventing fresh data | Cache busting with timestamps | `context/therapist-dashboard-context.tsx` |
| Page not refreshing after approval | Auto-refresh every 10 seconds | `app/therapist/dashboard/availability/page.tsx` |

## Testing Checklist

- [x] Form submission creates one enrollment
- [x] Magic link click links only one enrollment
- [x] Admin sees only one approval (or cleaned duplicates)
- [x] Admin approval updates user table correctly
- [x] Profile API returns approved enrollment
- [x] Availability page detects approval within 10 seconds
- [x] Cache doesn't prevent fresh data
- [x] Manual refresh button works

## Expected Behavior

### Before Fixes:
- ❌ Multiple enrollments created
- ❌ Admin sees duplicate approvals
- ❌ Availability page shows "pending" after approval
- ❌ Cache prevents fresh data

### After Fixes:
- ✅ Only one enrollment created per form submission
- ✅ Magic link links only one enrollment
- ✅ Admin sees single approval (or cleaned duplicates)
- ✅ Availability page detects approval within 10 seconds
- ✅ Fresh data always fetched

---

*Fixed: Duplicate enrollments prevented, availability approval correctly detected*

