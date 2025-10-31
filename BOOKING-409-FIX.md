# Booking 409 Conflict Error - FIXED

## 🔍 **Root Cause**

The booking API was returning **409 conflict errors** with messages like:
- "Time slot is not available"
- "Therapist is not available"

This was **NOT** due to actual booking conflicts, but because of a missing data sync in the approval process.

### **The Problem**

When a therapist is approved:
1. ✅ `users` table gets `is_verified = true`, `is_active = true`
2. ✅ `therapist_enrollments` table gets `status = 'approved'`
3. ❌ **`therapist_profiles` table was NOT getting `verification_status = 'approved'`**

### **Why It Failed**

The booking API checks this query:
```typescript
.eq('therapist_profiles.verification_status', 'approved')  // Line 86
```

If `therapist_profiles.verification_status` wasn't set to `'approved'`, the therapist query would return 0 results, making it appear like the therapist doesn't exist, which then triggers the availability conflict error (409).

---

## ✅ **The Fix**

### **1. Updated TherapistConsistencyManager** (`lib/therapist-consistency.ts`)

Added code to update `therapist_profiles` table during approval:

```typescript
// Update therapist_profiles table (CRITICAL for booking API)
if (userData?.id) {
  const { error: profileError } = await supabase
    .from('therapist_profiles')
    .update({ 
      verification_status: 'approved',
      is_verified: true,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userData.id)
}
```

**This ensures all future approvals will sync across all 3 tables.**

### **2. Created Dev API to Fix Existing Data** (`app/api/dev/fix-therapist-profiles/route.ts`)

An API endpoint that fixes all existing approved therapists by:
- Updating `therapist_profiles.verification_status` to `'approved'`
- Creating missing `therapist_profiles` records for approved therapists

### **3. SQL Script** (`fix-therapist-booking-issue.sql`)

If you prefer to fix via SQL directly, use this script:
```sql
-- Updates existing profiles
UPDATE therapist_profiles tp
SET verification_status = 'approved', is_verified = true
WHERE EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = tp.user_id 
      AND u.user_type = 'therapist'
      AND u.is_verified = true
);

-- Creates missing profiles
INSERT INTO therapist_profiles (user_id, verification_status, is_verified)
SELECT id, 'approved', true
FROM users
WHERE user_type = 'therapist' AND is_verified = true
  AND NOT EXISTS (SELECT 1 FROM therapist_profiles WHERE user_id = users.id);
```

---

## 🚀 **How to Apply the Fix**

### **Option A: Use the Dev API (Recommended for deployed site)**

```bash
curl -X POST https://thequietherapy.live/api/dev/fix-therapist-profiles
```

This will:
- Find all approved therapists
- Update their `therapist_profiles` records
- Return a summary of what was fixed

### **Option B: Run SQL Script**

Execute `fix-therapist-booking-issue.sql` in your Supabase SQL editor.

### **Option C: Manual Fix for Specific Therapist**

If you just need to fix one therapist quickly:

```sql
UPDATE therapist_profiles
SET verification_status = 'approved', is_verified = true
WHERE user_id = (
  SELECT id FROM users WHERE email = 'therapist@email.com'
);
```

---

## 🎯 **Testing**

After applying the fix:

1. **Check therapist is bookable:**
   ```bash
   # Should return therapist data
   curl "https://thequietherapy.live/api/sessions/book" \
     -H "Cookie: your-session-cookie" \
     -d '{"therapist_id": "therapist-uuid"}'
   ```

2. **Verify in database:**
   ```sql
   SELECT u.email, u.is_verified, tp.verification_status
   FROM users u
   JOIN therapist_profiles tp ON u.id = tp.user_id
   WHERE u.user_type = 'therapist' AND u.is_verified = true;
   ```

   All should show `verification_status = 'approved'`

3. **Try booking a session** - should no longer get 409 errors

---

## 📋 **For Future Reference**

**Always ensure these 3 tables stay in sync for therapist approvals:**

1. `users` → `is_verified = true`, `is_active = true`
2. `therapist_enrollments` → `status = 'approved'`, `is_active = true`
3. `therapist_profiles` → `verification_status = 'approved'`, `is_verified = true`

The `TherapistConsistencyManager.approveTherapist()` method now handles all 3 tables automatically.

---

## 🔗 **Related Files**

- `lib/therapist-consistency.ts` - Main approval logic (FIXED)
- `app/api/dev/fix-therapist-profiles/route.ts` - Batch fix endpoint (NEW)
- `fix-therapist-booking-issue.sql` - SQL fix script (NEW)
- `app/api/sessions/book/route.ts` - Booking API (line 86 - the check that was failing)

---

**Status:** ✅ FIXED  
**Date:** January 2025  
**Impact:** All booking requests should now work for approved therapists

