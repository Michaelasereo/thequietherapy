# ⚡ IMMEDIATE VIDEO TEST - BYPASS DATABASE ISSUES

## 🎯 YOUR SITUATION

Your database schema has custom constraints that are preventing automated session creation. 

**Instead of fighting the database, let's test video sessions with EXISTING sessions!**

---

## 🚀 FASTEST TEST METHOD - USE EXISTING SESSION

### **Option 1: Join an Existing Session (If Any)**

Check if you have any sessions in your database:

```sql
SELECT id, start_time, end_time, status, daily_room_url 
FROM sessions 
WHERE therapist_id = '9412940e-8445-4903-a6a2-16009ecebb36'
ORDER BY created_at DESC 
LIMIT 5;
```

If you have any, just navigate to:
```
http://localhost:3001/video-session/[SESSION_ID]
```

Replace `[SESSION_ID]` with an actual session ID from the query.

---

### **Option 2: Create Session Directly in Database**

Open your Supabase dashboard and run:

```sql
INSERT INTO sessions (
  user_id,
  therapist_id,
  start_time,
  end_time
) VALUES (
  '2ad23828-4a4a-43e2-9567-0fe4d4521064', -- Test patient
  '9412940e-8445-4903-a6a2-16009ecebb36', -- Your therapist ID
  NOW() - INTERVAL '5 minutes',
  NOW() + INTERVAL '35 minutes'
) RETURNING id;
```

Copy the returned ID, then navigate to:
```
http://localhost:3001/video-session/[THAT_ID]
```

---

### **Option 3: Test Booking Flow Instead**

Skip video testing for now and test the booking flow:

```
http://localhost:3001/book-session
```

Complete the 4 steps:
1. Contact info
2. Select therapist
3. Select time
4. Payment

This will create a valid session through the proper flow!

---

## 🎯 WHICH DO YOU PREFER?

Tell me:
- **"database"** - I'll guide you to create session in Supabase
- **"booking"** - I'll guide you through booking flow
- **"existing"** - I'll help find existing sessions
- **"fix schema"** - I'll try to align your database schema

**What's easiest for you right now?** 🤔

