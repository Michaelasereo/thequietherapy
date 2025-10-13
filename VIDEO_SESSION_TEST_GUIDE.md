# 🎥 VIDEO SESSION TEST GUIDE

## 🎯 Quick Testing with Test Console

Your therapist dashboard now has a **Video Test Console** that makes it incredibly easy to test the complete video session flow!

---

## 📋 WHAT WAS CREATED

### 1. **Video Test Console Component**
- **Location:** `/components/video-test-console.tsx`
- **Visible:** Therapist Dashboard (development only)
- **Purpose:** One-click test session creation + auto-join

### 2. **API Endpoints**
```
POST /api/dev/create-test-user
└─ Creates test patient user automatically

POST /api/dev/create-test-session
└─ Creates immediate session (scheduled for NOW)

GET /api/dev/auto-login?email={email}&redirect={path}
└─ Auto-login for test users (dev only)
```

### 3. **Dashboard Integration**
- Added to: `/app/therapist/dashboard/page.tsx`
- Shows only in: `NODE_ENV !== 'production'`

---

## 🚀 HOW TO TEST (STEP-BY-STEP)

### **Step 1: Start Your Development Server**

```bash
npm run dev
# Server runs on http://localhost:3000
```

### **Step 2: Login as Therapist**

1. Navigate to: `http://localhost:3000/therapist/login`
2. Login with your therapist credentials
3. You'll be redirected to the therapist dashboard

### **Step 3: Find the Test Console**

On the therapist dashboard, scroll down to find:

```
🧪 Video Session Test Console
[Development Only badge]
```

It looks like this:
- Purple border card
- Test tube icon
- "Create Test Video Session" button

### **Step 4: Create Test Session**

1. **Configure test patient details:**
   - Email: `test.patient@example.com` (default)
   - Name: `Test Patient` (default)
   - Or customize these fields

2. **Click:** "Create Test Video Session"

3. **Wait** (~2-3 seconds) - The console will:
   - ✅ Create test patient user
   - ✅ Give them 5 credits
   - ✅ Create a video session scheduled NOW
   - ✅ Display join buttons

### **Step 5: Test the Video Session**

After session creation, you'll see two buttons:

#### **Option A: Test in Two Browser Tabs**

1. **Click:** "Join as Therapist" button
   - Opens new tab
   - You join as yourself (therapist)

2. **Click:** "Join as Patient" button
   - Opens another tab
   - Auto-logs in as test patient
   - Joins same session

3. **Now you can test:**
   - ✅ Video connection (both participants)
   - ✅ Audio connection
   - ✅ Chat functionality
   - ✅ Recording controls (therapist only)
   - ✅ Session timer
   - ✅ Phase transitions (pre/during/post therapy)

#### **Option B: Test with Second Device/Browser**

1. **On your main browser:** Click "Join as Therapist"
2. **Copy the patient login link** (shown in yellow box)
3. **On second device/browser:** Paste link and open
4. **Both devices** join the same session

---

## 🎬 WHAT HAPPENS DURING THE TEST

### **Session Timeline:**

```
┌─────────────────────────────────────────────┐
│  PHASE 1: Pre-Therapy (Before session)     │
├─────────────────────────────────────────────┤
│  - Timer shows countdown                    │
│  - "Waiting to start" message               │
│  - Cannot record yet                        │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  PHASE 2: Therapy Session (30 minutes)     │
├─────────────────────────────────────────────┤
│  - Daily.co video iframe loads              │
│  - Both participants see each other         │
│  - Recording button available (therapist)   │
│  - Session chat active                      │
│  - Timer counts up (00:00 → 30:00)         │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  PHASE 3: Post-Therapy (15-min buffer)     │
├─────────────────────────────────────────────┤
│  - Session notes visible                    │
│  - Can complete session                     │
│  - SOAP notes displayed (if generated)      │
│  - Recording can be processed               │
└─────────────────────────────────────────────┘
```

---

## ✅ TESTING CHECKLIST

### **Video Session Features:**

- [ ] **Daily.co Video Loads**
  - Video iframe appears
  - Camera permissions requested
  - Video preview shows

- [ ] **Both Participants Connect**
  - Therapist sees patient
  - Patient sees therapist
  - Audio works both ways

- [ ] **Recording (Therapist Only)**
  - "Start Recording" button visible (therapist)
  - NOT visible to patient
  - Click to start recording
  - Audio captured from call
  - "Stop Recording" button appears

- [ ] **Session Chat**
  - Chat panel visible
  - Can send messages
  - Messages appear for both participants
  - Timestamps shown

- [ ] **Session Timer**
  - Shows current time
  - Counts up during therapy phase
  - Shows phase indicator

- [ ] **Session Controls**
  - "Leave Session" button works
  - "Complete Session" (therapist only)
  - Session status updates

### **Recording & Transcription:**

- [ ] **Start Recording**
  - Click "Start Recording"
  - Status changes to "Recording"
  - Red indicator shown

- [ ] **Stop Recording**
  - Click "Stop Recording"
  - Audio blob created
  - Sends to `/api/transcribe`

- [ ] **Transcription Process**
  - OpenAI Whisper processes audio
  - Transcript saved to `session_notes` table
  - Can view transcript in session notes

- [ ] **SOAP Notes Generation**
  - Auto-triggered after transcription
  - DeepSeek AI generates notes
  - SOAP notes saved to `sessions` table
  - Visible in therapist dashboard

---

## 🐛 TROUBLESHOOTING

### **Issue: Test Console Not Showing**

**Cause:** Running in production mode

**Solution:**
```bash
# Check your NODE_ENV
echo $NODE_ENV

# Should be 'development' or undefined
# If it's 'production', restart in dev mode:
npm run dev
```

### **Issue: "Failed to create test user"**

**Cause:** Database connection or permissions

**Solution:**
1. Check Supabase is running
2. Verify `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`
3. Check database connection

### **Issue: Video doesn't load**

**Cause:** Daily.co configuration missing

**Solution:**
```bash
# Check .env.local has:
DAILY_API_KEY=your_daily_key
DAILY_DOMAIN=your_domain.daily.co
```

### **Issue: Patient auto-login fails**

**Cause:** Auto-login disabled in production

**Solution:**
- Only works in development mode
- Check `NODE_ENV !== 'production'`
- Use manual login in production

### **Issue: Recording doesn't work**

**Cause:** Browser permissions or OpenAI API key

**Solution:**
1. Allow microphone permissions in browser
2. Verify `OPENAI_API_KEY` in `.env.local`
3. Check browser console for errors

---

## 🔧 ADVANCED TESTING

### **Testing Multiple Sessions**

1. Click "Create Another Test Session"
2. Use different test user emails
3. Test concurrent sessions

### **Testing with Real Network Conditions**

1. Open DevTools (F12)
2. Go to Network tab
3. Set throttling (e.g., "Fast 3G")
4. Test video quality and connectivity

### **Testing Different Session Phases**

**Modify session times in console:**
```typescript
// In test console, adjust session timing:
const now = new Date()
const startTime = new Date(now.getTime() - 35 * 60 * 1000) // 35 min ago
// This puts you in post-therapy phase
```

---

## 📊 WHAT TO VERIFY

### **Database Records:**

After testing, verify in Supabase:

```sql
-- Check test user created
SELECT * FROM users 
WHERE email = 'test.patient@example.com';

-- Check session created
SELECT * FROM sessions 
WHERE notes LIKE '%TEST SESSION%';

-- Check room URL generated
SELECT daily_room_url, daily_room_name 
FROM sessions 
WHERE id = 'your-session-id';

-- Check transcript saved
SELECT transcript, ai_generated 
FROM session_notes 
WHERE session_id = 'your-session-id';

-- Check SOAP notes generated
SELECT soap_notes 
FROM sessions 
WHERE id = 'your-session-id';
```

### **Expected Database State:**

```
users table:
├── Test patient exists
├── has 5 credits
├── is_verified: true
└── is_active: true

sessions table:
├── status: 'scheduled' → 'in_progress' → 'completed'
├── daily_room_url: populated
├── daily_room_name: populated
├── soap_notes: populated (after completion)
└── payment_status: 'paid'

session_notes table:
├── transcript: populated (after recording)
├── ai_generated: true
└── session_id: matches session
```

---

## 🎯 TESTING SCENARIOS

### **Scenario 1: Happy Path**

1. Create test session
2. Join as therapist
3. Join as patient (separate tab)
4. Start recording
5. Have a brief conversation
6. Stop recording
7. Wait for transcription
8. Complete session
9. View SOAP notes

### **Scenario 2: Recording Failure**

1. Create test session
2. Join as therapist
3. Deny microphone permissions
4. Try to start recording
5. Verify error handling

### **Scenario 3: Session Cancellation**

1. Create test session
2. Cancel session before joining
3. Verify session status updates
4. Verify cannot join cancelled session

### **Scenario 4: Late Join**

1. Create test session
2. Wait 5 minutes
3. Try to join
4. Verify still joinable (within window)

---

## 🚀 PRODUCTION CONSIDERATIONS

### **Test Console Behavior:**

```typescript
// In production (NODE_ENV === 'production'):
✅ Test console is hidden
✅ Auto-login endpoint returns 403
✅ Test endpoints are disabled (add middleware)
✅ Only real users can create sessions
```

### **Security Notes:**

⚠️ **IMPORTANT:** The test console and auto-login endpoint are **development only**.

**Before deploying to production:**

1. Verify `NODE_ENV=production`
2. Test that console is hidden
3. Test that auto-login is disabled
4. Add rate limiting to dev endpoints (optional)

---

## 📝 TESTING SCRIPT

Save this as `test-video-session.sh`:

```bash
#!/bin/bash

echo "🎥 Video Session Test Script"
echo "=============================="

echo "1. Starting development server..."
npm run dev &
SERVER_PID=$!
sleep 5

echo "2. Opening browser..."
open http://localhost:3000/therapist/login

echo "3. Waiting for you to complete test..."
echo ""
echo "📋 Testing Checklist:"
echo "  [ ] Login as therapist"
echo "  [ ] Find test console on dashboard"
echo "  [ ] Create test session"
echo "  [ ] Join as therapist (new tab)"
echo "  [ ] Join as patient (new tab)"
echo "  [ ] Test video/audio connection"
echo "  [ ] Test recording"
echo "  [ ] Verify transcription"
echo "  [ ] Check SOAP notes"
echo ""
echo "Press Enter when testing is complete..."
read

echo "4. Cleaning up..."
kill $SERVER_PID
echo "✅ Test complete!"
```

Run with:
```bash
chmod +x test-video-session.sh
./test-video-session.sh
```

---

## 🎉 SUCCESS CRITERIA

Your video session system is working correctly if:

✅ Test console appears on therapist dashboard
✅ Test session creates successfully
✅ Both therapist and patient can join
✅ Daily.co video loads for both participants
✅ Recording captures audio
✅ Transcription returns text
✅ SOAP notes are generated
✅ Session completes successfully
✅ All data saved to database

---

## 📞 NEED HELP?

If you encounter issues:

1. **Check browser console** (F12) for errors
2. **Check server logs** in terminal
3. **Check Supabase logs** in dashboard
4. **Verify environment variables** in `.env.local`

**Common Errors:**

```
Error: Daily.co API error
└─> Check DAILY_API_KEY and DAILY_DOMAIN

Error: OpenAI transcription failed
└─> Check OPENAI_API_KEY

Error: Failed to create test user
└─> Check Supabase connection and permissions

Error: Session not found
└─> Session may have expired (30-min limit)
```

---

## 🎊 CONGRATULATIONS!

You now have a **fully testable video session system** with:

- ✅ One-click test session creation
- ✅ Auto-login for test users
- ✅ Complete video session flow
- ✅ Recording & transcription
- ✅ AI-powered SOAP notes

**Happy Testing!** 🚀

