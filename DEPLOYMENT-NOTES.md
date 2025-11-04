# Deployment Notes - Enrollment Fix

## ⚠️ IMPORTANT: Run SQL Script in Production

Before enrollment will work in production, you **MUST** run the SQL script in your production Supabase database:

1. Go to your Supabase Dashboard → SQL Editor
2. Run the script: `ensure-enrollment-table-complete.sql`
3. This will add all missing columns including:
   - `is_verified`
   - `gender`
   - `age`
   - `marital_status`
   - `mdcn_code`
   - `licensed_qualification`
   - All other required columns

## Error Details

If you see a 500 error during enrollment, check:
- The error response will now include `details`, `code`, and `hint` fields
- Check the Netlify function logs for the full error message
- The error will indicate which column is missing

## Quick Fix

If you need to fix just the `is_verified` column immediately:
- Run: `fix-is-verified-column.sql` in Supabase SQL Editor

## Full Fix

For complete enrollment table setup:
- Run: `ensure-enrollment-table-complete.sql` in Supabase SQL Editor

