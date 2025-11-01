# Patient Biodata Migration Instructions

## Problem
Database error: `column "first_name" does not exist`

## Root Cause
The frontend form uses fields (`firstName`, `email`, `phone`, `country`) that don't exist in the production database yet.

## Solution

### Step 1: Run the Schema Migration
Execute this SQL in **Supabase SQL Editor**:

**File**: `apply-patient-biodata-schema.sql`

This will:
- ✅ Add `first_name`, `email`, `phone`, `country` columns
- ✅ Add `therapist_gender_preference`, `therapist_specialization_preference` columns
- ✅ Keep columns nullable (no NOT NULL constraints)
- ✅ Create indexes for performance
- ✅ Populate `first_name` from existing `name` data
- ✅ Verify the schema

### Step 2: Verify the Fix
After running the migration, check the table structure:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'patient_biodata' 
ORDER BY ordinal_position;
```

You should see:
- `first_name`
- `email`
- `phone`
- `country`
- `therapist_gender_preference`
- `therapist_specialization_preference`

### Step 3: Test the Functionality
1. Go to dashboard
2. Click Biodata
3. Edit and save any field
4. Should work without errors

## Code Changes Already Applied
✅ **API Route Fixed**: `app/api/patient/biodata/route.ts`
- Added camelCase ↔ snake_case transformation
- Handles field name conversion transparently
- Works with both frontend and database

✅ **No Code Changes Needed**: The transformation handles everything

## Migration Files
1. `apply-patient-biodata-schema.sql` - **RUN THIS ONE** ✅
2. `check-patient-biodata-schema.sql` - Check schema (optional)
3. `fix-biodata-not-null-constraints.sql` - Not needed (kept nullable from start)

## Status
- ✅ Code fixed
- ⚠️ Waiting for database migration

---

**Action Required**: Run `apply-patient-biodata-schema.sql` in Supabase SQL Editor

