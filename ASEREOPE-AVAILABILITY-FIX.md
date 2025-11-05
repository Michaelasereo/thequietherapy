# Fix: asereope@gmail.com Unable to Set Availability

## Problem

After deleting duplicate therapist records, `asereope@gmail.com` is still unable to set availability even though the first one was already approved.

## Root Cause

The availability system checks `availability_approved` which is calculated as:
```typescript
availability_approved = user.is_verified && user.is_active
```

After duplicate deletion, the therapist might have:
1. ✅ User record with `is_verified = true` and `is_active = true`
2. ❌ But enrollment might be missing, not linked, or have `is_active = false`
3. ❌ Profile might be missing or not verified

The availability page (line 28) checks:
```typescript
setAvailabilityApproved(therapistInfo.availability_approved || false)
```

And only shows availability controls if `availabilityApproved` is `true` (lines 111, 158, 200, 215, 236).

## Solution

Run the SQL script: `fix-therapist-availability-asereope.sql`

This script will:

1. **Diagnose the current status**:
   - Check user table status
   - Check enrollment table status
   - Check profile table status
   - Calculate `availability_approved` value

2. **Fix user table**:
   - Ensure `is_verified = true`
   - Ensure `is_active = true`

3. **Fix enrollment table**:
   - Create enrollment if missing
   - Set `status = 'approved'`
   - Set `is_active = true`
   - Set `is_verified = true`
   - Link `user_id` properly

4. **Fix profile table**:
   - Create profile if missing
   - Set `is_verified = true`
   - Set `verification_status = 'approved'`

5. **Verify the fix**:
   - Check all tables are in sync
   - Confirm `availability_approved` calculation returns `true`

## Expected Result

After running the script:
- ✅ `users.is_verified = true`
- ✅ `users.is_active = true`
- ✅ `therapist_enrollments.status = 'approved'`
- ✅ `therapist_enrollments.is_active = true`
- ✅ `therapist_profiles.is_verified = true`
- ✅ `availability_approved = true` (calculated)
- ✅ Therapist can set availability

## How to Use

1. Open Supabase SQL Editor
2. Run the script: `fix-therapist-availability-asereope.sql`
3. Review the diagnostic output (Steps 1-3)
4. The fix will run automatically (Steps 4-8)
5. Verify the final status (Step 9)

## Verification

After running the script, the therapist should:
- See the availability toggle (not the "not approved" alert)
- Be able to set weekly schedule
- Be able to toggle active/inactive status
- See all availability controls on the page

## If Issue Persists

If the therapist still can't set availability after running the script:

1. **Check browser console** for errors
2. **Check API response** - call `/api/therapist/profile` and verify:
   ```json
   {
     "therapist": {
       "availability_approved": true,
       "is_verified": true,
       "is_active": true
     }
   }
   ```
3. **Clear browser cache** and refresh
4. **Check if therapist is logged in** with the correct account
5. **Verify no duplicate records** still exist

## Related Files

- `app/api/therapist/profile/route.ts` - Calculates `availability_approved`
- `app/therapist/dashboard/availability/page.tsx` - Checks `availabilityApproved`
- `app/api/therapist/availability/route.ts` - Handles availability updates

