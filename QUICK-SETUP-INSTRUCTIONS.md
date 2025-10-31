# Quick Setup: Session Approval System

## 🔴 IMPORTANT: Run This Migration First!

The error you're seeing is because the database schema hasn't been updated yet.

## Steps to Fix:

### 1. Open Supabase SQL Editor
- Go to your Supabase project dashboard
- Click on **SQL Editor** in the left sidebar
- Click **New Query**

### 2. Run the Migration
- Copy the entire contents of `add-session-approval-system.sql`
- Paste it into the SQL Editor
- Click **Run** (or press Cmd/Ctrl + Enter)

### 3. Verify It Worked
You should see output like:
```
✅ Added pending_approval status
✅ Added is_instant column
✅ Added requires_approval column
✅ Added created_by column
✅ Session approval system setup complete!
```

### 4. Try Again
Once the migration is complete:
- Go back to your therapist dashboard
- Try creating an instant session again
- It should work now! 🎉

## What This Migration Does:

1. ✅ Adds `pending_approval` to the status enum
2. ✅ Adds `is_instant` column for immediate sessions
3. ✅ Adds `requires_approval` column
4. ✅ Adds `created_by` column to track session creator
5. ✅ Creates `approve_session_and_deduct_credit()` function
6. ✅ Creates indexes for performance

## Troubleshooting:

If you see any errors:
- Make sure you're running it as a database admin
- Check that the `sessions` table exists
- Verify that you have the necessary permissions

---

**After running this, your instant session creation will work!** 🚀

