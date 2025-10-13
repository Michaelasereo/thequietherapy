# 🚀 PRE-LAUNCH VIDEO SESSION TEST PLAN

## ✅ Complete End-to-End Testing Guide

This guide will verify that your entire video session flow works perfectly before launch.

---

## 📋 WHAT WE'RE TESTING

### Core Video Session Features:
1. ✅ Session creation and scheduling
2. ✅ Daily.co video integration
3. ✅ Both patient and therapist can join
4. ✅ Session notes (manual entry)
5. ✅ AI-generated SOAP notes
6. ✅ Sessions display on patient dashboard
7. ✅ Sessions display on therapist dashboard
8. ✅ Session history and details

---

## 🎯 PRE-FLIGHT CHECKLIST

### Environment Variables (`.env.local`):
```bash
# Required for video sessions
DAILY_API_KEY=your_daily_api_key
DAILY_DOMAIN=your_domain.daily.co

# Required for AI SOAP notes
OPENAI_API_KEY=your_openai_key
DEEPSEEK_API_KEY=your_deepseek_key (optional)

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

### Database Tables (Verify in Supabase):
- [ ] `users` table exists
- [ ] `sessions` table exists with columns: `daily_room_url`, `daily_room_name`, `status`
- [ ] `session_notes` table exists with columns: `notes`, `soap_subjective`, `soap_objective`, `soap_assessment`, `soap_plan`, `ai_generated`, `transcript`

---

## 🧪 TEST PLAN: 30-Minute Complete Flow

### **PHASE 1: Setup Test Accounts** (5 minutes)

#### Option A: Use Existing Test Console
1. Start dev server:
   ```bash
   npm run dev
   ```

2. Login as therapist at: `http://localhost:3000/therapist/login`

3. Look for "🧪 Video Test Console" on dashboard (dev only)

#### Option B: Manual Setup
Run this SQL in Supabase:
```sql
-- Create test patient
INSERT INTO users (id, email, full_name, user_type, credits, is_verified, is_active)
VALUES (
  gen_random_uuid(),
  'test.patient@example.com',
  'Test Patient',
  'patient',
  10,
  true,
  true
) ON CONFLICT (email) DO UPDATE SET credits = 10;

-- Note the returned ID for later
```

---

### **PHASE 2: Create Test Session** (5 minutes)

#### Using Test Console:
1. Click "Create Test Video Session"
2. Wait for confirmation (creates session scheduled NOW)
3. Note the session ID

#### Manual Method:
```sql
-- Get therapist ID and patient ID first
SELECT id, email, user_type FROM users WHERE email IN ('your_therapist@email.com', 'test.patient@example.com');

-- Create session
INSERT INTO sessions (
  user_id,           -- Patient ID from above
  therapist_id,      -- Therapist ID from above
  scheduled_date,
  scheduled_time,
  status,
  payment_status
) VALUES (
  'patient_id_here',
  'therapist_id_here',
  CURRENT_DATE,
  (CURRENT_TIME + INTERVAL '2 minutes')::time,
  'scheduled',
  'paid'
) RETURNING id;
```

---

### **PHASE 3: Test Video Session Join** (10 minutes)

#### 3.1 Therapist Joins:
1. Go to: Therapist Dashboard → Client Sessions
2. Find the test session
3. Click "Join Session"
4. Verify:
   - [ ] Daily.co iframe loads
   - [ ] Camera/microphone permissions requested
   - [ ] Video preview shows
   - [ ] Session timer appears
   - [ ] Chat icon visible
   - [ ] Notes icon visible (therapist only)

#### 3.2 Patient Joins:
1. **Open INCOGNITO window**
2. Login as patient: `http://localhost:3000/login`
3. Go to: Dashboard → Therapy Sessions
4. Click "Join Session" on the same session
5. Verify:
   - [ ] Daily.co iframe loads
   - [ ] Can see therapist video
   - [ ] Can hear therapist
   - [ ] Chat icon visible
   - [ ] No notes icon (patient shouldn't see this)

#### 3.3 During Session:
- [ ] Both can see/hear each other
- [ ] Session timer counts properly
- [ ] Chat messages work both ways
- [ ] Video quality is acceptable
- [ ] Audio is clear

---

### **PHASE 4: Test Session Notes** (5 minutes)

#### 4.1 Manual Notes (Therapist):
1. During or after session, click "Notes" icon
2. Session Notes Panel opens
3. Fill in:
   - Session Notes: "Patient discussed work stress"
   - Progress Notes: "Good engagement, making progress"
   - Homework: "Practice breathing exercises"
   - Next Session Focus: "Follow up on work situation"
4. Click Save button
5. Verify: "Session notes saved successfully" toast

#### 4.2 Verify Notes Saved:
Run in Supabase:
```sql
SELECT session_id, notes, progress_notes, homework_assigned, next_session_focus
FROM session_notes
WHERE session_id = 'your_session_id';
```

Expected: See the notes you entered

---

### **PHASE 5: Test AI SOAP Notes** (Optional, 5 minutes)

#### Option 1: Generate Test Transcript (Dev Console):
1. In test console, find your session
2. Click "Generate Test Transcript"
3. Wait 30 seconds
4. SOAP notes automatically generated

#### Option 2: Manual Transcript Entry:
Run in Supabase:
```sql
UPDATE session_notes
SET transcript = 'Patient: I have been feeling stressed about work lately. The deadlines are overwhelming.
Therapist: I understand. Can you tell me more about what specifically is causing stress?
Patient: My manager keeps adding tasks without adjusting deadlines. I feel like I cannot keep up.
Therapist: That sounds very challenging. Have you considered talking to your manager about workload?',
ai_generated = false
WHERE session_id = 'your_session_id';
```

Then trigger AI processing via API:
```bash
curl -X POST http://localhost:3000/api/sessions/your_session_id/ai-process \
  -H "Content-Type: application/json" \
  -d '{"action": "start"}'
```

#### Verify SOAP Notes:
```sql
SELECT soap_subjective, soap_objective, soap_assessment, soap_plan
FROM session_notes
WHERE session_id = 'your_session_id';
```

Expected: See formatted SOAP notes

---

### **PHASE 6: Complete Session** (2 minutes)

1. In therapist view, click "Complete Session"
2. Confirm completion
3. Verify session status changes to "completed"

```sql
-- Check session status
SELECT id, status, scheduled_date, scheduled_time
FROM sessions
WHERE id = 'your_session_id';
```

Expected: `status = 'completed'`

---

### **PHASE 7: Verify Dashboard Display** (5 minutes)

#### 7.1 Patient Dashboard:
1. Go to: Patient Dashboard → Sessions
2. Verify:
   - [ ] Completed session appears in "Finished Sessions"
   - [ ] Shows therapist name
   - [ ] Shows date/time
   - [ ] Shows status badge ("completed")
   - [ ] "View Details" button visible

3. Click "View Details"
4. Verify:
   - [ ] Session details load
   - [ ] Date/time correct
   - [ ] Therapist name correct
   - [ ] Duration shown
   - [ ] Can see basic session info

#### 7.2 Therapist Dashboard:
1. Go to: Therapist Dashboard → Client Sessions
2. Switch to "Completed" tab
3. Verify:
   - [ ] Completed session appears
   - [ ] Shows patient name
   - [ ] Shows date/time
   - [ ] Status badge shows "completed"
   - [ ] "View Notes" button visible

4. Click "View Notes" or expand notes
5. Verify:
   - [ ] Manual notes visible
   - [ ] SOAP notes visible (if generated)
   - [ ] Progress notes visible
   - [ ] Homework visible
   - [ ] Next session focus visible

#### 7.3 Therapist Dashboard Summary:
1. Go to: Therapist Dashboard (main page)
2. Verify:
   - [ ] "Sessions This Month" count includes test session
   - [ ] "Earnings This Month" updated
   - [ ] Recent sessions list includes test session

---

## 🎯 CRITICAL PATHS TO VERIFY

### Path 1: Patient Books → Joins → Views History
```
Book Session → Pay → Join Video → Complete → View in Dashboard
```

### Path 2: Therapist Joins → Takes Notes → Reviews Later
```
Join Session → Open Notes Panel → Save Notes → Complete → View in Client Sessions
```

### Path 3: AI SOAP Generation
```
Session Occurs → Transcript Created → AI Process → SOAP Notes → Visible in Dashboard
```

---

## 🔍 WHAT TO CHECK IN EACH DASHBOARD

### Patient Dashboard (`/dashboard`):
```
✅ Upcoming Sessions Section
   - Shows next scheduled session
   - "Join Session" button (when ready)
   - Countdown to session time

✅ Session History Section  
   - Lists completed sessions
   - Shows therapist name
   - Shows date/time
   - "View Details" button

✅ Session Details Page (`/dashboard/sessions/[id]`)
   - Full session information
   - Therapist details
   - Date/time/duration
   - Status badge
```

### Therapist Dashboard (`/therapist/dashboard/client-sessions`):
```
✅ Scheduled Tab
   - Upcoming sessions
   - "Join Session" button (when ready)
   - Patient names
   - Time until session

✅ Completed Tab
   - Past sessions
   - Patient names
   - Date/time
   - "View Notes" button
   - Expand/collapse notes inline

✅ Notes Display
   - Manual session notes
   - Progress notes
   - Homework assigned
   - Next session focus
   - AI-generated SOAP notes (if available)
   - Transcript (if available)
```

---

## ✅ SUCCESS CRITERIA

Your video session system is **LAUNCH READY** if:

### Video Functionality:
- [x] Daily.co rooms create automatically
- [x] Both patient and therapist can join
- [x] Video/audio work clearly
- [x] Session timer functions correctly
- [x] Can complete sessions

### Session Notes:
- [x] Therapist can save manual notes
- [x] Notes persist to database
- [x] Notes visible in dashboard later
- [x] Multiple note types (session, progress, homework)

### AI SOAP Notes (if enabled):
- [x] Transcript can be generated/saved
- [x] AI processing creates SOAP notes
- [x] SOAP notes structured correctly (S.O.A.P)
- [x] SOAP notes visible in therapist dashboard

### Dashboard Display:
- [x] Patient sees upcoming sessions
- [x] Patient sees completed sessions
- [x] Patient can view session details
- [x] Therapist sees all client sessions
- [x] Therapist can filter by status (scheduled/completed)
- [x] Therapist can view/edit notes
- [x] Session counts update correctly
- [x] Earnings calculations work

### Data Persistence:
- [x] Sessions save to database correctly
- [x] Notes save and reload correctly
- [x] Status changes persist
- [x] Session history preserved

---

## 🐛 COMMON ISSUES & FIXES

### Issue: "Video doesn't load"
```bash
# Check Daily.co environment variables
echo $DAILY_API_KEY
echo $DAILY_DOMAIN

# Test Daily.co API
curl -X POST https://api.daily.co/v1/rooms \
  -H "Authorization: Bearer $DAILY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"properties": {"exp": 1800}}'
```

### Issue: "Session not found"
```sql
-- Check if session exists
SELECT id, user_id, therapist_id, status, daily_room_url
FROM sessions
WHERE id = 'your_session_id';
```

### Issue: "Notes not saving"
```sql
-- Check if session_notes table exists
SELECT * FROM session_notes LIMIT 1;

-- Check for notes
SELECT * FROM session_notes WHERE session_id = 'your_session_id';
```

### Issue: "SOAP notes not generating"
```bash
# Check OpenAI API key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# Check server logs for errors
# Look in terminal where `npm run dev` is running
```

### Issue: "Session doesn't appear on dashboard"
```sql
-- Verify session relationships
SELECT 
  s.id,
  s.status,
  s.user_id,
  s.therapist_id,
  u.full_name as patient_name,
  t.full_name as therapist_name
FROM sessions s
LEFT JOIN users u ON s.user_id = u.id
LEFT JOIN users t ON s.therapist_id = t.id
WHERE s.id = 'your_session_id';
```

---

## 📊 FINAL VERIFICATION QUERIES

Run these in Supabase to confirm everything is set up:

```sql
-- 1. Check session created correctly
SELECT 
  id,
  user_id,
  therapist_id,
  scheduled_date,
  scheduled_time,
  status,
  daily_room_url,
  daily_room_name
FROM sessions
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 5;

-- 2. Check session notes saved
SELECT 
  session_id,
  notes,
  progress_notes,
  homework_assigned,
  next_session_focus,
  ai_generated,
  CASE 
    WHEN soap_subjective IS NOT NULL THEN 'Yes'
    ELSE 'No'
  END as has_soap_notes
FROM session_notes
WHERE created_at > NOW() - INTERVAL '1 hour';

-- 3. Check patient can see session
SELECT 
  s.id,
  s.status,
  u.full_name as patient_name,
  t.full_name as therapist_name
FROM sessions s
JOIN users u ON s.user_id = u.id
JOIN users t ON s.therapist_id = t.id
WHERE u.email = 'test.patient@example.com';

-- 4. Check therapist can see session
SELECT 
  s.id,
  s.status,
  u.full_name as patient_name,
  t.full_name as therapist_name
FROM sessions s
JOIN users u ON s.user_id = u.id
JOIN users t ON s.therapist_id = t.id
WHERE t.email = 'your_therapist@email.com';
```

---

## 🚀 QUICK TEST SCRIPT

Save this as `test-video-flow.sh`:

```bash
#!/bin/bash

echo "🎥 Video Session Flow Test"
echo "=========================="
echo ""

echo "Starting dev server..."
npm run dev &
SERVER_PID=$!
sleep 10

echo "✅ Server started (PID: $SERVER_PID)"
echo ""

echo "📋 Test Checklist:"
echo "1. Login as therapist: http://localhost:3000/therapist/login"
echo "2. Create test session (use test console or manually)"
echo "3. Join as therapist"
echo "4. Join as patient (incognito)"
echo "5. Test video/audio"
echo "6. Take session notes"
echo "7. Complete session"
echo "8. Verify on both dashboards"
echo ""

echo "Open these URLs:"
echo "- Therapist: http://localhost:3000/therapist/dashboard"
echo "- Patient: http://localhost:3000/dashboard"
echo ""

read -p "Press Enter when testing complete..."

echo "Stopping server..."
kill $SERVER_PID

echo "✅ Test complete!"
```

Run with:
```bash
chmod +x test-video-flow.sh
./test-video-flow.sh
```

---

## 🎉 READY FOR LAUNCH?

If you can successfully:

1. ✅ Create a session
2. ✅ Join video call (both patient and therapist)
3. ✅ See/hear each other clearly
4. ✅ Save session notes
5. ✅ Generate SOAP notes (optional)
6. ✅ Complete session
7. ✅ See session on patient dashboard
8. ✅ See session with notes on therapist dashboard

**Then you're ready to launch!** 🚀

---

## 📞 Quick Reference

### Key URLs:
- **Therapist Login:** `/therapist/login`
- **Patient Login:** `/login`
- **Therapist Sessions:** `/therapist/dashboard/client-sessions`
- **Patient Sessions:** `/dashboard/therapy`
- **Session Details:** `/session/[id]`
- **Video Session:** `/video-session/[id]` or `/session/[id]` (both work)

### Key API Endpoints:
- **Create Session:** `POST /api/sessions/book`
- **Join Session:** `POST /api/sessions/join`
- **Save Notes:** `POST /api/sessions/[id]/notes`
- **Get Sessions:** `GET /api/sessions`
- **Therapist Dashboard:** `GET /api/therapist/dashboard-data`

### Key Database Tables:
- `users` - Patient and therapist accounts
- `sessions` - Video session records
- `session_notes` - Notes and SOAP documentation
- `therapist_availability` - Scheduling slots

---

## 🎬 LET'S TEST!

**Start here:**
1. `npm run dev`
2. Login as therapist
3. Look for the test console or create a session manually
4. Follow the test plan above

**Good luck with your launch!** 🎉

