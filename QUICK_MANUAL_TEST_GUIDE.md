# ⚡ QUICK MANUAL TEST GUIDE

## 🎯 Your server is running on: **http://localhost:3002**

---

## ✅ **FASTEST WAY TO TEST (5 Minutes)**

### **Option 1: Use Test Console (Recommended)**

Since you're already logged in as therapist (I see it in the logs), just:

1. **Navigate directly to therapist dashboard:**
   ```
   http://localhost:3002/therapist/dashboard
   ```

2. **Wait for page to load** (might be slow first time - it's loading dashboard data)

3. **Scroll down** to find the purple card:
   ```
   🧪 Video Session Test Console
   ```

4. **Click "Create Test Video Session"**

5. **Click "Join as Therapist"** and **"Join as Patient"**

6. **Test video session!** ✅

---

### **Option 2: Skip Dashboard - Direct Video Test**

If dashboard is too slow, test video directly:

**Step 1: Create Test Session via API**
```bash
# In a new terminal, run:
curl -X POST http://localhost:3002/api/dev/create-test-user \
  -H "Content-Type: application/json" \
  -d '{"email":"quick.test@example.com","full_name":"Quick Test User"}'
```

Copy the `user.id` from response.

**Step 2: Create Session**
```bash
# Replace USER_ID with the ID from step 1
curl -X POST http://localhost:3002/api/dev/create-test-session \
  -H "Content-Type: application/json" \
  -d '{"test_user_id":"USER_ID"}'
```

Copy the `session.id` from response.

**Step 3: Open Video Session**
```bash
# Replace SESSION_ID
open http://localhost:3002/video-session/SESSION_ID
```

---

### **Option 3: Test Booking Flow (Skip Dashboard)**

```bash
open http://localhost:3002/book-session
```

**Quick flow:**
1. Fill contact info → Next
2. Select therapist → Next
3. Pick date & time → Continue
4. See payment page

**✅ PASS:** Booking flow works!

---

## 🔧 **FIX THE SLOW DASHBOARD**

The dashboard is calling `/api/therapist/dashboard-data` which might be doing heavy queries.

**Quick fix - comment out the data fetch temporarily:**

Just test the **Video Test Console** which doesn't need the full dashboard data!

---

## 🎯 **WHAT TO TEST RIGHT NOW:**

Pick ONE of these:

**A) Video Session (Easiest)**
```
http://localhost:3002/therapist/dashboard
→ Scroll to test console
→ Create & test video session
```

**B) Booking Flow**
```
http://localhost:3002/book-session
→ Fill 4 steps
→ Test booking
```

**C) Admin (Security Test)**
```
http://localhost:3002/admin/secure-auth
→ Test magic link login (NO password!)
```

---

## 💡 **WHICH ONE DO YOU WANT TO TEST FIRST?**

Just tell me:
- "video" - I'll guide you through video testing
- "booking" - I'll guide you through booking
- "admin" - I'll guide you through admin security
- "fix dashboard" - I'll optimize the slow dashboard

**What's your priority?** 🚀

