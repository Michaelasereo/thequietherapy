# 🔍 Check Enrollment Error in Netlify Logs (RIGHT NOW)

## Current Error:
```
POST https://thequietherapy.live/api/therapist/enroll 500 (Internal Server Error)
Failed to save enrollment data. Please try again.
```

## 🚀 Quick Steps to Find the Error:

### Step 1: Check Netlify Function Logs

1. **Go to**: https://app.netlify.com/sites/thequietherapy/logs/functions
2. **Look for recent logs** from `/api/therapist/enroll`
3. **Find these log messages**:
   - `❌ Error creating enrollment:`
   - `❌ Error details:`
   - `❌ Attempted insert data:`

### Step 2: Look for These Common Errors:

**Error Code `23505` + "user_id":**
- **Issue**: UNIQUE constraint on user_id
- **Fix**: Run `fix-enrollment-constraint.sql` in Supabase

**Error Code `42703` + "column":**
- **Issue**: Missing database column
- **Fix**: Run `ensure-enrollment-table-complete.sql` in Supabase

**Error Code `23505` + "email":**
- **Issue**: Email already exists
- **Fix**: User should use login page

**Error Code `23502`:**
- **Issue**: Required field is NULL
- **Fix**: Check which field is missing

### Step 3: After Next Deployment (1-2 minutes)

Try enrolling again and check browser console. You'll see:
- Full error response
- Error code
- Technical details
- Debug info

---

## 📋 Most Likely Issues:

Based on the data being sent, everything looks correct. The most likely issues are:

1. **Missing database columns** (gender, age, marital_status, specializations, languages_array)
2. **UNIQUE constraint on user_id** (if fix-enrollment-constraint.sql wasn't run)
3. **Column name mismatch** (licensed_qualification vs mdcn_code)

---

## 🔧 Quick Fixes:

### Fix 1: Ensure Database Schema is Complete

Run in Supabase SQL Editor:
```sql
-- Check what columns exist
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'therapist_enrollments'
ORDER BY ordinal_position;
```

**Required columns should include:**
- `specializations` (TEXT[])
- `languages_array` (TEXT[])
- `gender` (VARCHAR)
- `age` (INTEGER)
- `marital_status` (VARCHAR)

### Fix 2: Run Schema Fix Script

Run `ensure-enrollment-table-complete.sql` in Supabase SQL Editor.

### Fix 3: Verify Constraint Status

Run in Supabase SQL Editor:
```sql
-- Check for problematic constraint
SELECT constraint_name 
FROM information_schema.table_constraints
WHERE table_name = 'therapist_enrollments'
  AND constraint_name = 'therapist_enrollments_user_id_key';
```

If this returns a row, run `fix-enrollment-constraint.sql`.

---

## 📞 After Checking Logs:

**Copy the error details** from Netlify logs and share them. The error code and message will tell us exactly what to fix!
