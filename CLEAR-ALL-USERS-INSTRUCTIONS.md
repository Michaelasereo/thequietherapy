# 🧹 Clear All Users and Therapists - Instructions

## ⚠️ WARNING
This will **DELETE ALL USERS AND THERAPISTS** from both the database and Supabase Auth. This action is **IRREVERSIBLE**.

---

## 📋 Two-Step Process

### **Step 1: Clear Database Tables**
Run the SQL script in Supabase SQL Editor:
- **File**: `clear-all-users-therapists-complete.sql`
- **Location**: Root of your project

This will delete:
- ✅ All sessions and session notes
- ✅ All therapist enrollments and profiles
- ✅ All therapist availability
- ✅ All user credits and purchases
- ✅ All magic links and verification tokens
- ✅ All users from the database

### **Step 2: Clear Supabase Auth Users**
Run the Node.js script:
```bash
node scripts/clear-all-auth-users.js
```

This will delete:
- ✅ All Supabase Auth users
- ✅ All authentication tokens and sessions

---

## 🚀 Quick Commands

### Run both steps automatically:
```bash
# First, run SQL in Supabase Dashboard
# Then run:
node scripts/clear-all-auth-users.js
```

### Or use the shell script (requires manual SQL step):
```bash
bash scripts/clear-all-users-complete.sh
```

---

## ✅ Verification

After running both steps, verify:
1. Check users table: Should be 0 records
2. Check therapist_enrollments: Should be 0 records
3. Check sessions: Should be 0 records
4. Check Supabase Auth: Should have no users

---

## 📝 SQL File Location
- `clear-all-users-therapists-complete.sql` (in project root)

## 🔧 Node.js Script Location
- `scripts/clear-all-auth-users.js`

---

**Status**: Ready to run when you confirm

