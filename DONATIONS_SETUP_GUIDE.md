# Donations Setup Guide

## 🚨 Current Issue: 500 Error

The support page is showing a 500 error because the **donations table doesn't exist** in your Supabase database yet.

## ✅ Quick Fix

### Option 1: Run SQL Script (Recommended)

**If you're getting trigger errors:**

1. **Open your Supabase Dashboard**
2. **Go to SQL Editor**
3. **First, run** `cleanup-donations-table.sql` (optional - only if you have existing objects)
4. **Then, run** `create-donations-table-safe.sql` (handles existing objects gracefully)

**If you're starting fresh:**

1. **Open your Supabase Dashboard**
2. **Go to SQL Editor**
3. **Copy and paste** the contents of `create-donations-table.sql`
4. **Run the SQL script**

### Option 2: Manual Setup Script

1. **Make sure you have your environment variables set:**
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. **Run the setup script:**
   ```bash
   node setup-donations-table.js
   ```

## 📋 What the SQL Script Creates

### Donations Table Structure:
```sql
CREATE TABLE donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    donor_name VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    amount_kobo INTEGER NOT NULL,
    paystack_reference VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    donation_type VARCHAR(50) DEFAULT 'seed_funding',
    anonymous BOOLEAN DEFAULT FALSE,
    payment_method VARCHAR(50),
    gateway_response JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified_at TIMESTAMP WITH TIME ZONE
);
```

### Indexes for Performance:
- `idx_donations_email` - Fast email lookups
- `idx_donations_status` - Fast status filtering
- `idx_donations_created_at` - Fast date sorting
- `idx_donations_paystack_reference` - Fast payment lookups
- `idx_donations_status_type` - Fast combined filtering

## 🔧 After Setup

Once the table is created:

1. **The 500 error will be resolved**
2. **The support page will show ₦0 raised** (correct initial state)
3. **Donations will be tracked in real-time**
4. **Progress bar will update automatically**

## 🧪 Test the Setup

After creating the table, you can test it:

1. **Visit** `/api/donations/setup` to check if table exists
2. **Visit** `/api/donations/stats` to see live stats (should return ₦0)
3. **Visit** `/support` page to see the progress bar working

## 🚀 Expected Result

After setup, your support page will show:
- ✅ **₦0 raised** (no donations yet)
- ✅ **0 donors** (no donors yet)
- ✅ **0% progress** (accurate progress bar)
- ✅ **Real-time updates** when donations come in
- ✅ **No more 500 errors**

## 📞 Need Help?

If you continue to get errors:
1. Check your Supabase connection
2. Verify environment variables are set
3. Make sure you have the correct permissions in Supabase
4. Check the browser console for detailed error messages

The support page is ready to go once the donations table exists! 🎉
