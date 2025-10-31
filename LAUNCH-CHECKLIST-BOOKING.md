# 🚀 BOOKING SYSTEM LAUNCH CHECKLIST

## ⚠️ CRITICAL: Run these scripts before launch!

### Step 1: Complete Booking Setup
**Run:** `complete-booking-setup.sql`

This script:
- ✅ Adds ALL required columns to `sessions` table:
  - `title`, `description`
  - `scheduled_date`, `scheduled_time`
  - `start_time`, `end_time`
  - `duration_minutes`
  - `session_type`, `status`
  - `created_at`, `updated_at`
  - `user_id`, `therapist_id`

- ✅ Ensures `user_credits` table exists with:
  - `credits_balance`, `credits_used`
  - `user_type`, `created_at`, `updated_at`

- ✅ Creates `check_booking_conflict` function
- ✅ Creates indexes for performance
- ✅ Creates exclusion constraint to prevent double bookings

### Step 2: Deploy Booking Function
**Run:** `redeploy-booking-function.sql`

This ensures the `create_session_with_credit_deduction` function is deployed and working.

### Step 3: Verify Everything
**Run:** `pre-launch-booking-check.sql`

This verifies:
- ✅ All required columns exist
- ✅ All required functions exist
- ✅ Foreign keys are set up correctly

### Step 4: Fix Therapists (if needed)
**Run:** `fix-existing-therapist.sql`

Ensures all therapists have proper profiles and are bookable.

---

## 📋 Required Columns for Booking

### Sessions Table
The booking function requires these columns:

1. **id** - UUID (primary key, auto-generated)
2. **user_id** - UUID (foreign key to users)
3. **therapist_id** - UUID (foreign key to users)
4. **title** - VARCHAR(255)
5. **description** - TEXT
6. **scheduled_date** - DATE
7. **scheduled_time** - TIME
8. **start_time** - TIMESTAMP WITH TIME ZONE
9. **end_time** - TIMESTAMP WITH TIME ZONE
10. **duration_minutes** - INTEGER (default 60)
11. **session_type** - VARCHAR(50) (default 'video')
12. **status** - VARCHAR(50) (default 'scheduled')
13. **created_at** - TIMESTAMP WITH TIME ZONE
14. **updated_at** - TIMESTAMP WITH TIME ZONE

### User Credits Table
Required columns:
1. **id** - UUID (primary key)
2. **user_id** - UUID (foreign key to users)
3. **user_type** - VARCHAR(20) ('user', 'individual', 'therapist', 'partner')
4. **credits_balance** - INTEGER (default 0)
5. **credits_used** - INTEGER (default 0)
6. **created_at** - TIMESTAMP WITH TIME ZONE
7. **updated_at** - TIMESTAMP WITH TIME ZONE

---

## ✅ Quick Verification

Run this SQL to verify everything is ready:

```sql
-- Check sessions columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'sessions' 
AND column_name IN ('title', 'description', 'scheduled_date', 'scheduled_time', 
                     'start_time', 'end_time', 'duration_minutes', 'session_type', 
                     'status', 'created_at', 'updated_at')
ORDER BY column_name;

-- Check booking function exists
SELECT proname, pg_get_function_arguments(oid) 
FROM pg_proc 
WHERE proname = 'create_session_with_credit_deduction';

-- Check conflict function exists
SELECT proname 
FROM pg_proc 
WHERE proname = 'check_booking_conflict';
```

---

## 🎯 Expected Result

After running all scripts, you should see:
- ✅ All 14 required columns in `sessions` table
- ✅ `create_session_with_credit_deduction` function exists
- ✅ `check_booking_conflict` function exists
- ✅ `user_credits` table exists with required columns
- ✅ All indexes created
- ✅ Exclusion constraint created

**Booking should now work!** 🎉

