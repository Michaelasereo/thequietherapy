# Booking 409 Conflict Error - Fix Guide

## 🔍 **Error Analysis**

**Error:** `409 Conflict - "Time slot is not available: Therapist is... available for bookings"`

**Root Cause:** The AvailabilityManager is failing the therapist status check, indicating the therapist is not active or not approved.

---

## ✅ **Required Actions**

### **Step 1: Update Database Function** ⚠️ **CRITICAL**

The API code has been deployed, but the database function still uses old logic. You MUST run the SQL script in Supabase:

**File:** `fix-booking-function-credit-sum.sql`

**Steps:**
1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste the contents of `fix-booking-function-credit-sum.sql`
3. Click "Run" to execute
4. Verify the function was updated successfully

**OR** run the comprehensive fix:
- File: `fix-all-booking-issues.sql` (recommended - includes all fixes)

---

### **Step 2: Verify Therapist Status**

The error suggests the therapist is not active or not approved. Check:

1. **Therapist User Status:**
   ```sql
   SELECT id, email, user_type, is_active, is_verified
   FROM users
   WHERE id = 'ac7aaa37-0681-48f5-b93f-140dd2ea65f2';
   ```
   - Must have: `user_type = 'therapist'`, `is_active = true`, `is_verified = true`

2. **Therapist Enrollment Status:**
   ```sql
   SELECT id, email, status, is_active
   FROM therapist_enrollments
   WHERE email = (SELECT email FROM users WHERE id = 'ac7aaa37-0681-48f5-b93f-140dd2ea65f2');
   ```
   - Must have: `status = 'approved'`, `is_active = true`

3. **Therapist Availability:**
   ```sql
   SELECT therapist_id, weekly_availability, is_active
   FROM availability_weekly_schedules
   WHERE therapist_id = 'ac7aaa37-0681-48f5-b93f-140dd2ea65f2'
   AND is_active = true;
   ```
   - Must have: `is_active = true` and `weekly_availability` configured

---

### **Step 3: Check AvailabilityManager Logic**

The AvailabilityManager checks:
1. Therapist status (must be 'active')
2. Weekly availability exists
3. Time falls within available hours
4. No conflicting bookings

If any of these fail, it returns a 409 Conflict error.

---

## 🔧 **Quick Fix SQL Script**

If the therapist is missing approval, run this:

```sql
-- Approve therapist enrollment
UPDATE therapist_enrollments
SET status = 'approved', is_active = true, updated_at = NOW()
WHERE email = (SELECT email FROM users WHERE id = 'ac7aaa37-0681-48f5-b93f-140dd2ea65f2');

-- Ensure therapist user is active
UPDATE users
SET is_active = true, is_verified = true, updated_at = NOW()
WHERE id = 'ac7aaa37-0681-48f5-b93f-140dd2ea65f2'
AND user_type = 'therapist';
```

---

## 📋 **Complete Fix Checklist**

- [ ] Run `fix-booking-function-credit-sum.sql` in Supabase
- [ ] Verify therapist user is active and verified
- [ ] Verify therapist enrollment is approved
- [ ] Verify therapist has weekly availability configured
- [ ] Test booking again

---

## 🚨 **If Still Failing**

If booking still fails after running the SQL script:

1. **Check server logs** for detailed error messages
2. **Verify the database function** was updated:
   ```sql
   SELECT proname, prosrc 
   FROM pg_proc 
   WHERE proname = 'create_session_with_credit_deduction';
   ```
   - Should show `user_type = 'user'` in the credit check

3. **Check AvailabilityManager** is returning correct status:
   - The therapist must have `status = 'active'` in AvailabilityManager
   - This is checked by `getTherapistStatus()` function

---

## ✅ **After Fix**

Once the database function is updated and therapist is approved:
- Booking should work correctly
- Credits will be deducted properly
- Sessions will be created atomically

---

**Next Steps:**
1. Run `fix-booking-function-credit-sum.sql` in Supabase
2. Verify therapist status (use SQL queries above)
3. Test booking again
