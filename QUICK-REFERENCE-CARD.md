# 🚀 Quick Reference Card

## **Bug:** Data Inconsistency in Therapist Approval

### **The Problem:**
```
Approval API updates: users.is_active ✅
Approval API forgets: therapist_enrollments.is_active ❌
```

### **The Evidence:**
```bash
# Users table (line 830):
is_active: true ✅

# Enrollments table (line 876):
is_active: false ❌
```

### **The Fix:**
```typescript
// File: app/api/admin/approve-verification/route.ts
// Line: 72
is_active: action === 'approve', // ← Added this one line
```

### **The Migration:**
```sql
-- File: FIX-ENROLLMENT-ACTIVE-STATUS.sql
UPDATE therapist_enrollments te
SET is_active = u.is_active
FROM users u
WHERE te.email = u.email AND te.status = 'approved';
```

---

## **Files for Review:**

| File | Purpose | Priority |
|------|---------|----------|
| `EXECUTIVE-SUMMARY-FOR-SENIOR-DEV.md` | Start here! High-level overview | 🔴 HIGH |
| `CRITICAL-AVAILABILITY-ISSUE-FOR-REVIEW.md` | Deep technical dive | 🔴 HIGH |
| `FIX-ENROLLMENT-ACTIVE-STATUS.sql` | Database fix script | 🔴 HIGH |
| `ISSUE-VISUAL-SUMMARY.md` | Visual diagrams | 🟡 MEDIUM |
| `AVAILABILITY-APPROVAL-FIX-SUMMARY.md` | Testing guide | 🟡 MEDIUM |

---

## **Test Checklist:**

### **Before SQL Migration:**
```bash
# Check current state
psql -c "SELECT email, is_active FROM users WHERE email='ceo@thequietherapy.live';"
psql -c "SELECT email, is_active FROM therapist_enrollments WHERE email='ceo@thequietherapy.live';"
```

### **Run SQL Migration:**
```bash
psql < FIX-ENROLLMENT-ACTIVE-STATUS.sql
```

### **After SQL Migration:**
```bash
# Verify fix
psql -c "SELECT u.email, u.is_active as user_active, te.is_active as enrollment_active 
         FROM users u 
         JOIN therapist_enrollments te ON u.email = te.email 
         WHERE u.email='ceo@thequietherapy.live';"
```

### **Test in App:**
1. Login as CEO (ceo@thequietherapy.live)
2. Go to availability page
3. Toggle should be ON by default ✅
4. Schedule components should show ✅
5. Toggle OFF → schedule hides ✅
6. Toggle ON → schedule shows ✅

---

## **Approval Decision:**

### **Code Changes:** ✅ / ❌ / 🔄 (needs revision)
**Comments:**
```


```

### **SQL Migration:** ✅ / ❌ / 🔄 (needs revision)
**Comments:**
```


```

### **Additional Actions Needed:**
```
[ ] Add database trigger
[ ] Add validation checks
[ ] Write automated tests
[ ] Review other dual-table sync issues
[ ] Other: _______________
```

---

## **Quick Commands:**

```bash
# Kill all servers
pkill -f "next-server"
lsof -ti:3000 | xargs kill -9

# Clear Next.js cache
rm -rf .next

# Run SQL fix
psql -U postgres -d your_database < FIX-ENROLLMENT-ACTIVE-STATUS.sql

# Start dev server
npm run dev

# Watch logs for debug info
# Look for "debug_availability" in API responses
```

---

**Signature:** _________________  
**Date:** _________________  
**Approved for:** [ ] Testing  [ ] Staging  [ ] Production
