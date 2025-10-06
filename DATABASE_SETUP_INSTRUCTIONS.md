# Database Setup Instructions

## Add Therapist Profile Fields

To enable the new gender, marital status, and age fields in the therapist profile, you need to add the following columns to your `therapist_profiles` table.

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **Table Editor** → **therapist_profiles** table
3. Click **Add Column** and add these three columns:

   **Column 1:**
   - Name: `gender`
   - Type: `varchar`
   - Default value: (leave empty)
   - Allow nullable: ✅

   **Column 2:**
   - Name: `marital_status`
   - Type: `varchar`
   - Default value: (leave empty)
   - Allow nullable: ✅

   **Column 3:**
   - Name: `age`
   - Type: `varchar`
   - Default value: (leave empty)
   - Allow nullable: ✅

### Option 2: SQL Editor

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run this SQL script:

```sql
-- Add gender, marital_status, and age columns to therapist_profiles table
ALTER TABLE therapist_profiles 
ADD COLUMN IF NOT EXISTS gender VARCHAR(50),
ADD COLUMN IF NOT EXISTS marital_status VARCHAR(50),
ADD COLUMN IF NOT EXISTS age VARCHAR(10);

-- Add comments to document the new fields
COMMENT ON COLUMN therapist_profiles.gender IS 'Therapist gender preference for client matching';
COMMENT ON COLUMN therapist_profiles.marital_status IS 'Therapist marital status for client matching';
COMMENT ON COLUMN therapist_profiles.age IS 'Therapist age for client matching';

-- Update existing records to have empty strings instead of null for better UI handling
UPDATE therapist_profiles 
SET gender = '', marital_status = '', age = ''
WHERE gender IS NULL OR marital_status IS NULL OR age IS NULL;
```

### After Adding the Columns

1. Uncomment the lines in `/app/api/therapist/update-profile/route.ts` (lines 41-49)
2. The therapist profile form will now be able to save and display the new fields
3. Therapist cards will only show filled fields, not "Not specified" placeholders

### Testing

1. Login as a therapist
2. Go to Settings → Edit Profile
3. Fill in or leave blank the gender, marital status, and age fields
4. Save the profile
5. Check that the therapist card only displays filled fields

## Troubleshooting

If you get errors about columns not existing, make sure:
- The column names match exactly: `gender`, `marital_status`, `age`
- The columns are in the `therapist_profiles` table
- The columns allow NULL values
