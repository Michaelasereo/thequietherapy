# 🔍 Enrollment Error Debug Guide

## Current Error:
```
Failed to save enrollment data. Please try again.
```

## ✅ Good News:
The enhanced error handling will now show **specific error messages** instead of generic ones!

---

## 🔍 Steps to Debug:

### Step 1: Check Browser Console (Detailed Error)

1. **Open Browser DevTools** (F12)
2. **Go to Console tab**
3. **Try enrolling again**
4. **Look for the error response** - it now includes:
   - `error`: User-friendly message
   - `details`: Technical error message
   - `code`: Database error code
   - `debug`: Additional debugging info

**Copy the full error object** and check:
- `code`: Database error code (e.g., `23505` = unique violation)
- `details`: What actually failed
- `debug.sampleData`: What data was being inserted

### Step 2: Check Netlify Function Logs

1. **Go to Netlify Dashboard**: https://app.netlify.com/
2. **Select site**: `thequietherapy`
3. **Go to**: Functions → View logs
4. **Filter by**: `/api/therapist/enroll`
5. **Look for**:
   - `❌ Error creating enrollment:`
   - `❌ Error details:`
   - `❌ Attempted insert data:`

**Common Error Codes:**
- `23505` = Unique constraint violation (email already exists, or user_id constraint issue)
- `23502` = NOT NULL violation (required field missing)
- `23503` = Foreign key violation
- `42P01` = Table doesn't exist
- `42703` = Column doesn't exist

### Step 3: Check Database Schema

**Run this in Supabase SQL Editor:**
```sql
-- Check if all required columns exist
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'therapist_enrollments'
ORDER BY ordinal_position;
```

**Required columns should include:**
- `full_name` (VARCHAR, NOT NULL)
- `email` (VARCHAR, UNIQUE NOT NULL)
- `phone` (VARCHAR, nullable)
- `specializations` (TEXT[])
- `languages_array` (TEXT[])
- `gender` (VARCHAR, nullable)
- `age` (INTEGER, nullable)
- `marital_status` (VARCHAR, nullable)
- `bio` (TEXT, nullable)
- `profile_image_url` (TEXT, nullable)
- `status` (VARCHAR, default 'pending')
- `is_active` (BOOLEAN, default true)
- `is_verified` (BOOLEAN, default false)

### Step 4: Verify Constraint Status

**Run this in Supabase SQL Editor:**
```sql
-- Check for problematic UNIQUE constraint on user_id
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'therapist_enrollments'
  AND constraint_name = 'therapist_enrollments_user_id_key';

-- If this returns a row, the constraint exists and needs to be removed
-- Run: fix-enrollment-constraint.sql
```

---

## 🚨 Common Issues & Fixes:

### Issue 1: UNIQUE Constraint on user_id
**Error Code**: `23505`  
**Error Message**: Contains "user_id" or "therapist_enrollments_user_id_key"

**Fix**: Run `fix-enrollment-constraint.sql` in Supabase SQL Editor

### Issue 2: Missing Columns
**Error Code**: `42703`  
**Error Message**: "column X does not exist"

**Fix**: Run `ensure-enrollment-table-complete.sql` in Supabase SQL Editor

### Issue 3: Email Already Exists
**Error Code**: `23505`  
**Error Message**: Contains "email" or "therapist_enrollments_email_key"

**Fix**: This is expected - email already enrolled. User should use login page.

### Issue 4: NOT NULL Violation
**Error Code**: `23502`  
**Error Message**: Contains "null value in column X"

**Fix**: Check which required field is missing. Ensure form validation is working.

---

## 📋 Next Steps After Getting Error Details:

1. **Check the error `code`** in browser console or Netlify logs
2. **Match it to the common issues above**
3. **Apply the corresponding fix**
4. **Retry enrollment**

---

## 🧪 Test Enrollment (After Fixes):

Use the validation script:
```bash
node scripts/validate-enrollment-readiness.js
```

This will:
- ✅ Test database connection
- ✅ Verify enrollment can be inserted
- ✅ Check constraints are correct
- ✅ Validate auto-linking code

---

## 📞 If Still Failing:

1. **Copy the full error response** from browser console
2. **Check Netlify Function logs** for detailed error
3. **Verify database schema** matches expected structure
4. **Run validation script** to check readiness

---

## ✅ Expected Success Flow:

1. User fills enrollment form
2. API receives data
3. Data inserted into `therapist_enrollments` with `user_id = NULL`
4. Magic link sent to email
5. User clicks magic link
6. User account created
7. `therapist_enrollments.user_id` automatically linked to `users.id`

---

## 🔧 Quick Fix Checklist:

- [ ] Check browser console for detailed error
- [ ] Check Netlify Function logs
- [ ] Verify `fix-enrollment-constraint.sql` was run
- [ ] Verify `ensure-enrollment-table-complete.sql` was run
- [ ] Run `validate-enrollment-readiness.js`
- [ ] Test enrollment again
