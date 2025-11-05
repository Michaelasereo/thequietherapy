# Duplicate Therapist Error Analysis & Solution

## Error Summary

### 1. **404 Errors on Routes**
The following routes are returning 404 errors:
- `/logout`
- `/approve-verification`
- `/settings`
- `/analytics`
- `/sessions`
- `/reports`

**Cause**: These are likely Next.js routing issues or deployment configuration problems. However, the main issue is the missing enrollment data.

### 2. **"Therapist enrollment not found" Error**
```
❌ Approval failed: {error: 'Therapist enrollment not found'}
POST https://thequietherapy.live/api/admin/approve-verification 404 (Not Found)
Therapist ID: 376d605e-4b2e-478d-a866-47b17f5b3720
```

**Root Cause**: 
- A therapist exists in the `users` table (ID: `376d605e-4b2e-478d-a866-47b17f5b3720`)
- But there's **NO corresponding entry** in the `therapist_enrollments` table
- The approval API (`/api/admin/approve-verification`) requires an enrollment record to process approvals

**How the API Works**:
1. First tries to find enrollment by the provided ID
2. If not found, tries to find by user ID
3. If still not found, tries to find enrollment by user's email
4. If no enrollment exists, returns error: "Therapist enrollment not found"

## Solution

### SQL Script Created: `remove-duplicate-therapists-no-enrollment.sql`

This script will:

1. **Find all therapists with no enrollment**
   - Identifies therapists in `users` table that have no corresponding `therapist_enrollments` record

2. **Identify duplicate therapists**
   - Finds therapists with the same email address
   - Determines which duplicates have enrollments and which don't

3. **Remove duplicates intelligently**:
   - **If duplicates exist and some have enrollments**: Keep those with enrollments, delete those without
   - **If duplicates exist and none have enrollments**: Keep the oldest one, delete the rest
   - **If single therapist with no enrollment**: Delete it

4. **Clean up related data**:
   - Deletes sessions (both as therapist and as patient)
   - Deletes availability schedules
   - Deletes therapist profiles
   - Deletes user credits
   - Deletes from users table

5. **Verification**:
   - Shows remaining therapists with no enrollment (should be empty after cleanup)
   - Shows remaining duplicates (should be empty after cleanup)

## How to Use

1. **Review the data first** (Steps 1-3 in the SQL script):
   ```sql
   -- Run Steps 1-3 to see what will be deleted
   ```

2. **Execute the cleanup** (Step 4):
   ```sql
   -- Step 4 contains the DO block that performs the deletion
   ```

3. **Verify the cleanup** (Steps 5-6):
   ```sql
   -- Verify no therapists with no enrollment remain
   -- Verify no duplicates remain
   ```

4. **Manual cleanup** (if needed):
   - Delete from Supabase Auth (`auth.users`) via Dashboard if needed
   - The script will notify you about auth users that need manual deletion

## Important Notes

⚠️ **Before running the deletion script**:
- Review Steps 1-3 to see exactly what will be deleted
- Make sure you understand which therapists will be removed
- The script keeps therapists with enrollments and removes duplicates without enrollments

⚠️ **After running the script**:
- Check Supabase Auth Dashboard for orphaned auth users
- Verify that the approval process works for remaining therapists
- Test the approval flow with a therapist that has an enrollment

## Expected Outcome

After running the script:
- ✅ No therapists will exist in `users` table without a corresponding `therapist_enrollments` record
- ✅ No duplicate therapists (same email) will exist
- ✅ The approval API will work correctly for all remaining therapists
- ✅ The 404 error for "Therapist enrollment not found" will be resolved

## Next Steps

1. Run the SQL script in Supabase SQL Editor
2. Review the output to confirm deletions
3. Test the approval process with a therapist that has an enrollment
4. If 404 errors persist for routes, check Next.js routing configuration

