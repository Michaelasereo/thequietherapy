# 🗑️ Clear All Users and Therapists - Complete Guide

This guide will help you clear **ALL users and therapists** from both:
1. **Database tables** (PostgreSQL via Supabase)
2. **Supabase Auth** (Authentication system)

⚠️ **WARNING**: This action is **IRREVERSIBLE**. Make sure you have a backup if needed.

---

## 📋 What Will Be Deleted

### Database Tables:
- ✅ All users (individual, therapist, partner, admin)
- ✅ All therapist profiles and enrollments
- ✅ All sessions and session-related data
- ✅ All authentication tokens and magic links
- ✅ All credits and transactions
- ✅ All partner-related data

### Supabase Auth:
- ✅ All users from `auth.users` table

---

## 🚀 Quick Start (Recommended)

### Option 1: Run Both Scripts Manually

#### Step 1: Clear Database Tables

1. Open your **Supabase Dashboard**
2. Go to **SQL Editor**
3. Open the file: `clear-all-users-therapists-complete.sql`
4. Copy and paste the entire SQL script
5. Click **Run** (or press `Ctrl+Enter`)

#### Step 2: Clear Supabase Auth Users

Run the Node.js script:

```bash
node scripts/clear-all-auth-users.js
```

---

## 📝 Detailed Instructions

### Step 1: Clear Database Tables

**File**: `clear-all-users-therapists-complete.sql`

**What it does:**
- Shows a preview of what will be deleted
- Deletes all child tables first (sessions, enrollments, etc.)
- Deletes all users from the `users` table
- Verifies that everything was cleared

**How to run:**
1. Go to Supabase Dashboard → SQL Editor
2. Copy the contents of `clear-all-users-therapists-complete.sql`
3. Paste into SQL Editor
4. Click **Run**
5. Review the verification output

**Expected output:**
- ✅ All tables cleared
- ✅ 0 users remaining
- ⚠️ Warning to also clear Supabase Auth users

---

### Step 2: Clear Supabase Auth Users

**File**: `scripts/clear-all-auth-users.js`

**What it does:**
- Lists all users from Supabase Auth
- Deletes each user using the Admin API
- Verifies deletion was successful

**Prerequisites:**
- Must have `.env.local` file with:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

**How to run:**

```bash
# Make sure you're in the project root
cd /Users/macbook/Desktop/trpi-app

# Run the script
node scripts/clear-all-auth-users.js
```

**Expected output:**
```
🧹 Clearing all Supabase Auth users...

📊 Fetching all users from Supabase Auth...
   Fetched 50 users (Total: 50)

📊 Found 50 user(s) to delete:

   1. user1@example.com (uuid-1)
   2. user2@example.com (uuid-2)
   ...

🗑️  Starting deletion...
   ✅ Deleted 10/50 users...
   ✅ Deleted 20/50 users...
   ...

📊 Deletion Summary:
   ✅ Successfully deleted: 50
   ❌ Errors: 0
   📦 Total processed: 50

🔍 Verifying deletion...
✅ All Supabase Auth users cleared successfully!

✅ Script completed!
```

---

## 🔍 Verification

After running both scripts, verify everything is cleared:

### 1. Check Database Tables

Run this in Supabase SQL Editor:

```sql
-- Check users
SELECT COUNT(*) as user_count FROM users;
-- Should return: 0

-- Check therapists
SELECT COUNT(*) as therapist_count FROM users WHERE user_type = 'therapist';
-- Should return: 0

-- Check sessions
SELECT COUNT(*) as session_count FROM sessions;
-- Should return: 0 (if table exists)
```

### 2. Check Supabase Auth

1. Go to Supabase Dashboard → **Authentication** → **Users**
2. Should show **0 users**

---

## ⚠️ Troubleshooting

### Issue: SQL Script Fails with Foreign Key Error

**Solution**: The script is designed to delete child tables first. If you still get errors:
1. Check which table is failing
2. Manually delete that table's data first
3. Re-run the script

### Issue: Node.js Script Fails with "Missing environment variables"

**Solution**: 
1. Make sure `.env.local` exists in project root
2. Verify it contains:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```
3. Restart your terminal

### Issue: Some Auth Users Still Remain

**Solution**:
- Run the script again (it handles pagination automatically)
- Or delete manually in Supabase Dashboard → Authentication → Users

---

## 📁 Files Created

1. **`clear-all-users-therapists-complete.sql`** - SQL script for database cleanup
2. **`scripts/clear-all-auth-users.js`** - Node.js script for Supabase Auth cleanup
3. **`scripts/clear-all-users-complete.sh`** - Combined shell script (optional)

---

## ✅ Success Checklist

After running both scripts, verify:

- [ ] Database `users` table is empty (0 rows)
- [ ] Database `therapist_enrollments` table is empty (0 rows)
- [ ] Database `sessions` table is empty (0 rows)
- [ ] Supabase Auth shows 0 users in dashboard
- [ ] You can sign up fresh users successfully

---

## 🎉 You're Done!

Your database and Supabase Auth are now completely cleared and ready for fresh data!

---

## 📞 Need Help?

If you encounter issues:
1. Check the error messages in the terminal/SQL editor
2. Verify your Supabase credentials are correct
3. Make sure you have admin/service role permissions

