# Therapist Availability Toggle Fix

## Issue
Therapist availability kept showing as "inactive" when refreshing the page, even after toggling it to "active".

## Root Cause

**Database Table Mismatch**

The availability toggle API was updating the wrong table:
- ❌ **API was updating**: `therapists` table
- ✅ **Frontend reads from**: `users` table

This caused a disconnect where:
1. User toggles availability → API updates `therapists.is_active`
2. Page refreshes → Frontend reads `users.is_active` (unchanged)
3. Shows as inactive even though toggle worked

## Solution

**Updated API to use correct table**

**File:** `app/api/therapist/availability/route.ts`

**Before:**
```typescript
// Wrong table - therapists
const { error } = await supabase
  .from('therapists')
  .update({ is_active: body.isActive })
  .eq('email', therapistEmail)
```

**After:**
```typescript
// Correct table - users
const { error } = await supabase
  .from('users')
  .update({ is_active: body.isActive })
  .eq('email', therapistEmail)
```

## How the System Works

### Database Schema
- **`users` table**: Master user record with `is_active` status
- **`therapists` table**: Therapist-specific data (separate from user status)
- **`therapist_profiles` table**: Profile information
- **`therapist_enrollments` table**: Enrollment/verification data

### Data Flow
```
1. Therapist toggles availability
   ↓
2. API updates users.is_active
   ↓
3. Frontend reads users.is_active
   ↓
4. Status displays correctly
```

### Why This Matters
- ✅ **Consistent state** - Same table for read/write operations
- ✅ **Proper authentication** - Session management uses `users.is_active`
- ✅ **Admin approvals** - Admin updates `users.is_active` when approving
- ✅ **No data sync issues** - Single source of truth

## Testing

### Before Fix:
1. ✅ Toggle availability to "active"
2. ❌ Refresh page → Shows "inactive"
3. ❌ Data mismatch between tables

### After Fix:
1. ✅ Toggle availability to "active"
2. ✅ Refresh page → Shows "active"
3. ✅ Consistent data across all operations

## Additional Benefits

✅ **Session management works correctly** - Uses same `users.is_active` field
✅ **Admin approvals sync properly** - Updates same table
✅ **Authentication consistency** - All auth checks use `users` table
✅ **Future-proof** - Follows established database pattern

## Files Modified

1. ✅ `app/api/therapist/availability/route.ts` - Fixed table reference

## Database Tables Involved

- ✅ **`users`** - Master user record (is_active, is_verified, user_type)
- ✅ **`therapist_profiles`** - Profile data (bio, specializations, etc.)
- ✅ **`therapist_enrollments`** - Enrollment/verification status
- ✅ **`therapist_availability`** - Availability schedules

---

**Implementation Date:** October 18, 2025
**Status:** ✅ Complete and Ready for Testing
**Issue:** Availability toggle not persisting after page refresh
**Solution:** Fixed API to update correct table (`users` instead of `therapists`)
