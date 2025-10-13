# Partner Credit Allocation Fix

## 🎯 Problem Statement

The automatic free credit system was incorrectly granting 1 free credit to ALL individual users, including:
- ❌ Regular users signing up (should get NO free credits)
- ❌ Partner members from CSV (were getting 1 auto-credit + CSV credits)

**Required Behavior:**
- ✅ Regular individual users → NO automatic credits (must purchase)
- ✅ Partner members via CSV → Get ONLY credits specified in CSV

---

## 🔧 Changes Made

### 1. Database Trigger Fix (`fix-partner-member-credit-allocation.sql`)

**What Changed:**
- Disabled the `auto_grant_signup_credit()` trigger that was granting free credits to all individual users
- The function now exists but does nothing (for future compatibility)

**Before:**
```sql
IF NEW.user_type = 'individual' THEN
    PERFORM grant_signup_credit(NEW.id);
END IF;
```

**After:**
```sql
-- NO automatic credit grants
-- Partner members get credits via CSV upload only
-- Regular users must purchase credits
RETURN NEW;
```

### 2. CSV Upload API Fix (`app/api/partner/bulk-upload-members/route.ts`)

**What Changed:**
- Removed old `credits` column assignment from user creation
- Added proper credit allocation using `allocate_partner_credit()` database function
- Credits are now properly tracked in the `partner_credits` table

**Before:**
```typescript
.insert({
  // ... other fields
  credits: record.creditsToAssign,  // Old system
})
```

**After:**
```typescript
.insert({
  // ... other fields
  // No credits field - handled separately
})

// Then allocate credits properly
await supabase.rpc('allocate_partner_credit', {
  p_partner_id: partnerId,
  p_employee_email: record.email.toLowerCase(),
  p_employee_name: record.name,
  p_credits_count: record.creditsToAssign,
  p_expires_days: 90
})
```

---

## 📋 Deployment Steps

### Step 1: Update Database Trigger

Run this SQL script in your Supabase SQL Editor:

```bash
fix-partner-member-credit-allocation.sql
```

**This will:**
- ✅ Disable automatic free credit grants
- ✅ Prevent new users from getting unwanted free credits
- ✅ Preserve trigger structure for future use

### Step 2: Deploy Updated API Code

The updated bulk upload API is already in place:
```
app/api/partner/bulk-upload-members/route.ts
```

**This will:**
- ✅ Use proper credit allocation function
- ✅ Track credits in `partner_credits` table
- ✅ Support credit expiration (90 days default)
- ✅ Provide better error handling

### Step 3: Verify Setup

Run these queries to confirm:

```sql
-- 1. Check trigger is disabled
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'auto_grant_signup_credit';

-- 2. Check partner credits table exists
SELECT * FROM partner_credits LIMIT 1;

-- 3. Test CSV upload with sample data
-- Upload a test CSV with 1-2 members
```

---

## 🎯 Credit Allocation Logic

### Regular Individual Users
- **Signup:** No automatic credits
- **Credits:** Must purchase via payment system
- **Use Case:** Direct consumers who pay per session

### Partner Members (CSV Upload)
- **Signup:** Created via partner CSV upload
- **Credits:** Get exactly what's specified in CSV (typically 1 free credit)
- **Tracking:** Credits stored in `partner_credits` table
- **Expiration:** 90 days from allocation
- **Use Case:** Organization employees/students with sponsored sessions

### Partners
- **Signup:** Via partner enrollment
- **Credits:** Allocated based on partnership tier
- **Purpose:** To assign to their members

### Therapists
- **Signup:** Via therapist onboarding
- **Credits:** Not applicable (they provide sessions, not consume)

---

## 📊 How Credits Flow

### Partner CSV Upload Process:
```
1. Partner uploads CSV with member details
   ↓
2. System creates user accounts (user_type: 'individual', partner_id: set)
   ↓
3. System calls allocate_partner_credit() for each member
   ↓
4. Credits created in partner_credits table
   ↓
5. Member can book sessions using these credits
```

### Credit Usage Process:
```
1. Member books session
   ↓
2. System checks partner_credits table for available credits
   ↓
3. Marks credit as 'used' and links to session
   ↓
4. Session starts
```

---

## 🧪 Testing Checklist

### Test 1: Regular User Signup
- [ ] Create new individual user account
- [ ] Verify user gets 0 credits
- [ ] Verify no entry in `user_session_credits` table
- [ ] User must purchase credits to book

### Test 2: Partner CSV Upload
- [ ] Partner uploads CSV with 2 members, 1 credit each
- [ ] Verify 2 users created with `partner_id` set
- [ ] Verify 2 entries in `partner_credits` table (1 per member)
- [ ] Verify no automatic free credits granted
- [ ] Members can book using CSV credits

### Test 3: Credit Expiration
- [ ] Upload member with credits
- [ ] Verify `expires_at` is set to 90 days from now
- [ ] Verify expired credits cannot be used

### Test 4: Existing User Update
- [ ] Upload CSV with email of existing user
- [ ] Verify user's `partner_id` updated
- [ ] Verify new credits allocated
- [ ] Verify old credits preserved

---

## 🔍 Database Schema Reference

### partner_credits Table
```sql
CREATE TABLE partner_credits (
    id UUID PRIMARY KEY,
    partner_id UUID REFERENCES users(id),
    employee_email TEXT NOT NULL,
    employee_name TEXT,
    credits_allocated INTEGER DEFAULT 1,
    credits_used INTEGER DEFAULT 0,
    session_duration_minutes INTEGER DEFAULT 25,
    status TEXT DEFAULT 'active', -- active, used, expired, revoked
    allocated_by UUID REFERENCES users(id),
    allocated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    used_at TIMESTAMPTZ,
    session_id UUID REFERENCES sessions(id)
);
```

### allocate_partner_credit() Function
```sql
allocate_partner_credit(
    p_partner_id UUID,
    p_employee_email TEXT,
    p_employee_name TEXT DEFAULT NULL,
    p_credits_count INTEGER DEFAULT 1,
    p_expires_days INTEGER DEFAULT 90
) RETURNS BOOLEAN
```

---

## 📝 CSV Format Reference

Partner members CSV should have these columns:

```csv
name,email,phone,credits
John Doe,john@example.com,+234-123-4567,1
Jane Smith,jane@example.com,+234-123-4568,2
```

**Column Details:**
- `name` - Full name of member
- `email` - Email address (unique)
- `phone` - Phone number (optional)
- `credits` - Number of free credits (typically 1)

---

## ⚠️ Important Notes

1. **No Double Credits:** Partner members no longer get automatic free credits + CSV credits
2. **Proper Tracking:** All partner credits tracked in `partner_credits` table
3. **Expiration Support:** Credits expire after 90 days (configurable)
4. **Backward Compatible:** Trigger still exists, just disabled
5. **Error Handling:** Better error messages in CSV upload

---

## 🚀 Rollback Plan

If you need to revert these changes:

```sql
-- Re-enable automatic free credits
CREATE OR REPLACE FUNCTION auto_grant_signup_credit()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.user_type = 'individual' THEN
        PERFORM grant_signup_credit(NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 📞 Support

If you encounter issues:
1. Check Supabase logs for error messages
2. Verify `partner_credits` table exists
3. Confirm `allocate_partner_credit()` function is available
4. Test with small CSV (1-2 records) first

---

**Status:** ✅ Ready to Deploy  
**Updated:** October 13, 2025  
**Impact:** Database + API changes required

