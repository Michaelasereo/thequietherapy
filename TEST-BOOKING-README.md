# 🧪 Booking System Test Script

## Quick Start

### 1. Install Dependencies
Make sure you have `@supabase/supabase-js` and `dotenv` installed:

```bash
npm install @supabase/supabase-js dotenv
```

### 2. Set Environment Variables
Create a `.env` file or set these variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
# OR use anon key:
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Update Test Configuration
Edit `test-booking.js` and update the `TEST_CONFIG` object:

```javascript
const TEST_CONFIG = {
  user_id: 'your-user-id',          // UUID of test user
  therapist_id: 'your-therapist-id', // UUID of test therapist
  session_date: '2024-01-15',        // YYYY-MM-DD format
  session_time: '16:00:00',           // HH:MM:SS format
  duration_minutes: 60,
  session_type: 'video',
  notes: 'Test booking',
  title: 'Test Therapy Session'
};
```

### 4. Run Setup Script First
Before testing, make sure all columns exist:

```bash
# Run this in Supabase SQL Editor
psql your_database < complete-booking-setup.sql
```

Or manually run the SQL in Supabase Dashboard > SQL Editor.

### 5. Run the Test
```bash
node test-booking.js
```

## What It Tests

The script runs 6 comprehensive tests:

1. **📋 Sessions Table Columns** - Verifies all required columns exist
2. **💰 User Credits** - Checks credits table and creates test credits if needed
3. **👨‍⚕️ Therapist Verification** - Verifies therapist exists and is active
4. **🔍 Conflict Function** - Tests `check_booking_conflict` function
5. **🎯 Booking Function** - Tests `create_session_with_credit_deduction` RPC
6. **✅ Session Verification** - Verifies the created session in the database

## Expected Output

### ✅ Success Example:
```
🚀 STARTING BOOKING SYSTEM TESTS
==================================================

📋 TEST 1: Checking sessions table columns...
✅ All required columns exist!

💰 TEST 2: Checking user_credits table...
✅ User has 5 credits available

👨‍⚕️ TEST 3: Checking therapist exists...
✅ Therapist found: Dr. Jane Smith (jane@example.com)

🔍 TEST 4: Testing check_booking_conflict function...
✅ Conflict check returned: false (false = no conflict, true = conflict)

🎯 TEST 5: Testing create_session_with_credit_deduction function...
✅ Booking successful!
   Session ID: abc123...
   Title: Test Therapy Session - Test
   Scheduled: 2024-01-15 at 14:30:00
   Status: scheduled
💰 Credits after booking: 4 balance, 1 used

✅ TEST 6: Verifying created session in database...
✅ All required columns present in session record!

==================================================
📊 TEST SUMMARY
==================================================
✅ PASS    sessionsTable
✅ PASS    userCredits
✅ PASS    therapistExists
✅ PASS    conflictFunction
✅ PASS    bookingFunction
✅ PASS    verifySession

🎉 ALL TESTS PASSED! Booking system is ready!
```

### ❌ Error Examples:

**Missing Columns:**
```
❌ Column 'title' is MISSING
❌ Column 'description' is MISSING
...
❌ Missing columns: title, description
   Run complete-booking-setup.sql to add missing columns!
```

**Insufficient Credits:**
```
⚠️  User has insufficient credits
   ⚠️  User has insufficient credits
```

**Booking Conflict:**
```
⚠️  Time slot is already booked - try a different time
```

## Troubleshooting

### "Missing Supabase credentials!"
- Set `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in your environment

### "Column does not exist"
- Run `complete-booking-setup.sql` in Supabase SQL Editor

### "Therapist not found"
- Update `TEST_CONFIG.therapist_id` with a valid therapist UUID
- Make sure therapist has `user_type = 'therapist'` and is active

### "Insufficient credits"
- The script will try to create test credits automatically
- Or manually add credits: `INSERT INTO user_credits (user_id, user_type, credits_balance) VALUES (...)` 

### "Booking conflict"
- The script uses a random time slot, but if conflicts occur, try again or update the time

## Manual Testing

You can also test the booking function directly in Supabase SQL Editor:

```sql
-- Test the booking function
SELECT * FROM create_session_with_credit_deduction(
  'your-user-id'::UUID,
  'your-therapist-id'::UUID,
  CURRENT_DATE + 1,           -- Tomorrow
  '16:00:00'::TIME,           -- 4 PM
  60,                         -- 60 minutes
  'video'::VARCHAR,           -- Session type
  'Test booking'::TEXT,       -- Notes
  'Test Session'::TEXT        -- Title
);
```

## Next Steps

After all tests pass:
1. ✅ Booking system is ready for production
2. ✅ All required columns exist
3. ✅ Functions are working correctly
4. ✅ Credit system is operational

You're ready to launch! 🚀

