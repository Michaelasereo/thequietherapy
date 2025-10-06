# User Deletion Troubleshooting Guide

## Problem Summary

You were experiencing issues where:
1. Deleting users from Supabase Auth dashboard didn't remove them from your database
2. Users couldn't sign up again with the same email because it "already exists"
3. There was a mismatch between your custom `users` table and Supabase Auth

## Root Cause

Your application stores users in **two separate systems**:
- **Your custom `users` table** (in your database)
- **Supabase Auth system** (separate authentication service)

When you deleted users from Supabase Auth dashboard, it only removed them from Supabase Auth but **NOT** from your custom `users` table. This caused the "email already exists" error during signup.

## Files Involved

### Core User Management Files
- **`/app/api/admin/users/route.ts`** - Admin API for user CRUD operations
- **`/components/admin/user-management.tsx`** - Admin UI component
- **`/app/admin/dashboard/users/page.tsx`** - Admin dashboard page

### Authentication & Sync Files
- **`/lib/supabase-auth-sync.ts`** - Syncs users between database and Supabase Auth
- **`/lib/auth.ts`** - Magic link verification (already fixed)
- **`/app/api/auth/signup/route.ts`** - Handles new user signups

### Database Files
- **`/database-schema.sql`** - Your custom users table structure
- **`/cleanup-test-data.sql`** - Test data cleanup scripts

## Solution Implemented

### 1. Fixed Admin Deletion API
Updated `/app/api/admin/users/route.ts` to:
- **Permanent Delete**: Now deletes from BOTH your database AND Supabase Auth
- **Soft Delete**: Only deactivates in your database (preserves Supabase Auth user)

### 2. Added Supabase Auth Integration
- Imported `supabaseAdmin` from auth sync module
- Added proper error handling for Supabase Auth operations
- Ensured both systems stay synchronized

### 3. Created Cleanup Script
Created `/scripts/cleanup-orphaned-users.js` to:
- Identify users that exist in one system but not the other
- Fix synchronization issues
- Provide detailed analysis of user mismatches

## How to Use the Fix

### For New Deletions
1. Use your admin dashboard to delete users
2. Choose "Permanent Delete" for complete removal
3. Choose "Deactivate" for temporary suspension

### For Existing Orphaned Users

#### Step 1: Analyze the Problem
```bash
node scripts/cleanup-orphaned-users.js
```

This will show you:
- Users in database but not in Supabase Auth
- Users in Supabase Auth but not in database
- Users with email mismatches

#### Step 2: Fix the Issues
```bash
# Fix users missing from Supabase Auth
node scripts/cleanup-orphaned-users.js --fix-auth

# Fix users missing from database (remove from Supabase Auth)
node scripts/cleanup-orphaned-users.js --fix-database

# Fix both (be careful!)
node scripts/cleanup-orphaned-users.js --fix-database --fix-auth
```

### Manual Database Cleanup
If you need to manually clean up specific users:

```sql
-- Find users that might be causing conflicts
SELECT id, email, full_name, user_type, is_active, created_at 
FROM users 
WHERE email = 'problematic@email.com';

-- Delete specific user (be careful!)
DELETE FROM users WHERE email = 'problematic@email.com';
```

## Best Practices Going Forward

### 1. Always Use Admin Dashboard
- Don't delete users directly from Supabase Auth dashboard
- Use your admin interface which handles both systems

### 2. Prefer Soft Deletes
- Use "Deactivate" instead of "Permanent Delete" when possible
- This preserves data while preventing access

### 3. Regular Monitoring
- Run the cleanup script periodically to check for sync issues
- Monitor your logs for authentication errors

### 4. User Creation Flow
The signup process now properly:
- Checks your `users` table for existing emails
- Creates users in both systems simultaneously
- Handles verification properly

## Testing the Fix

### Test 1: Create and Delete User
1. Create a new user account
2. Delete them using admin dashboard (permanent delete)
3. Try to create account with same email - should work

### Test 2: Check Synchronization
1. Run the cleanup script
2. Verify no orphaned users exist
3. Check both systems have the same user count

### Test 3: Soft Delete
1. Create a user account
2. Deactivate them (soft delete)
3. Try to login - should be blocked
4. Reactivate them - should work again

## Troubleshooting

### If Users Still Can't Sign Up
1. Check if user exists in your `users` table:
   ```sql
   SELECT * FROM users WHERE email = 'user@example.com';
   ```

2. Check if user exists in Supabase Auth (use Supabase dashboard)

3. Run the cleanup script to identify mismatches

### If Admin Deletion Fails
1. Check server logs for errors
2. Verify Supabase service key permissions
3. Ensure both systems are accessible

### If Cleanup Script Fails
1. Check environment variables are set correctly
2. Verify database connection
3. Check Supabase Auth permissions

## Environment Variables Required

Make sure these are set in your `.env` file:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Summary

The fix ensures that:
- ✅ User deletion removes from both systems
- ✅ Email conflicts are prevented
- ✅ Synchronization issues are identified and fixed
- ✅ Admin interface handles both systems properly
- ✅ Cleanup tools are available for maintenance

Your user management system should now work correctly without the email conflict issues you were experiencing.
