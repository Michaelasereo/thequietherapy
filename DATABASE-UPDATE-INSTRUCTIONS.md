# Database Update Instructions for Therapist Specializations & Client Preferences

## Overview

This document outlines the database changes needed to support:
1. **New grouped therapist specializations** (21 options in 3 categories)
2. **Client therapy preferences** stored as JSON in patient_biodata

## ✅ Good News: No Breaking Changes Needed!

Both fields use **TEXT** and **TEXT[]** types with **NO constraints**, which means:
- ✅ The database can accept **any text values** without errors
- ✅ No CHECK constraints to update
- ✅ No ENUM types to modify
- ✅ Forms will work immediately!

## Database Schema

### 1. Therapist Specializations

**Tables:**
- `therapist_enrollments.specializations` (TEXT[] array) - **Preferred**
- `therapist_enrollments.specialization` (TEXT) - Legacy, kept for compatibility
- `therapist_profiles.specializations` (TEXT[] array) - **Preferred**
- `therapist_profiles.specialization` (TEXT) - Legacy, kept for compatibility

**Storage:**
- Specializations are stored as an **array of text values**
- Example: `["CBT", "DBT", "Trauma and PTSD"]`
- No constraints = accepts any text values ✅

### 2. Client Therapy Preferences

**Table:**
- `patient_biodata.therapist_preference` (TEXT) - Can store JSON string

**Storage:**
- Preferences are stored as **JSON string**
- Example: `'["Anxiety & Stress Management", "Depression & Mood Disorders"]'`
- No constraints = accepts any text values ✅

## Migration Script

**File:** `verify-therapist-specialization-schema.sql`

This script:
1. ✅ Verifies columns exist
2. ✅ Creates missing columns if needed
3. ✅ Migrates data from old to new column names
4. ✅ Verifies data types are correct

## Steps to Run

### Option 1: Verify Only (Recommended First)

```sql
-- Run this in your Supabase SQL Editor
\i verify-therapist-specialization-schema.sql
```

This will:
- Show current schema
- Create missing columns
- Migrate data if needed
- Report what was done

### Option 2: Manual Verification

Check your tables directly:

```sql
-- Check therapist_enrollments
SELECT column_name, data_type, udt_name 
FROM information_schema.columns 
WHERE table_name = 'therapist_enrollments' 
AND column_name IN ('specialization', 'specializations');

-- Check therapist_profiles
SELECT column_name, data_type, udt_name 
FROM information_schema.columns 
WHERE table_name = 'therapist_profiles' 
AND column_name IN ('specialization', 'specializations');

-- Check patient_biodata
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'patient_biodata' 
AND column_name = 'therapist_preference';
```

## Expected Results

### therapist_enrollments & therapist_profiles
- ✅ `specializations` column exists as `TEXT[]` (array)
- ✅ `specialization` column may exist as `TEXT` (legacy)

### patient_biodata
- ✅ `therapist_preference` column exists as `TEXT`

## What Was Changed

### Frontend Code
1. ✅ **components/therapist-enrollment-steps/step-3-specialization-languages.tsx**
   - Updated to show 21 specializations in 3 groups
   - Uses checkboxes for selection

2. ✅ **app/dashboard/biodata/page.tsx**
   - Already uses checkboxes for therapy preferences
   - Stores as JSON string

### Backend API
3. ✅ **app/api/therapist/enroll/route.ts**
   - Updated to save to both `specialization` and `specializations` columns
   - Handles arrays correctly

## Testing Checklist

After running the migration:

- [ ] Therapist enrollment form loads without errors
- [ ] Can select multiple specializations from new categories
- [ ] Enrollment saves successfully
- [ ] Client biodata form loads without errors
- [ ] Can select multiple therapy preferences
- [ ] Client preferences save successfully

## Troubleshooting

### If forms fail with "column does not exist":

Run the migration script:
```sql
\i verify-therapist-specialization-schema.sql
```

### If forms fail with "invalid input syntax":

Check that columns are TEXT/TEXT[] types (not constrained):
```sql
SELECT column_name, data_type, udt_name, 
       (SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE constraint_type = 'CHECK' 
        LIMIT 1) as check_constraint
FROM information_schema.columns 
WHERE table_name = 'therapist_enrollments' 
AND column_name = 'specializations';
```

Should show: `data_type = 'ARRAY'`, `udt_name = '_text'`, `check_constraint = NULL`

### If data doesn't save:

Check RLS (Row Level Security) policies allow INSERT/UPDATE:
```sql
SELECT * FROM pg_policies 
WHERE tablename IN ('therapist_enrollments', 'therapist_profiles', 'patient_biodata');
```

## Summary

**You DON'T need to update constraints or enums!** The database schema is already flexible enough because:
- Specializations use `TEXT[]` (array) with no constraints ✅
- Preferences use `TEXT` with no constraints ✅

**You DO need to:**
- Run the verification script to ensure columns exist
- Test the forms to confirm they work

That's it! 🎉

