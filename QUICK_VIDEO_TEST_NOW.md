# 🎥 Quick Video Test - Do This Right Now!

## ⚡ Fast Setup (5 minutes)

### STEP 1: Create Test Accounts (1 minute)

Run this in your Supabase SQL Editor:

```sql
-- Quick test therapist
INSERT INTO users (id, email, user_type, email_verified, credits)
VALUES (gen_random_uuid(), 'quicktest-therapist@test.com', 'therapist', true, 0)
ON CONFLICT (email) DO UPDATE SET user_type = 'therapist', email_verified = true
RETURNING id;

-- Save the therapist ID from above, then create profile:
INSERT INTO therapist_profiles (id, user_id, full_name, specialization, hourly_rate, is_verified, is_active)
VALUES (
  gen_random_uuid(),
  'PASTE_THERAPIST_ID_HERE', -- Replace with ID from above
  'Test Therapist',
  'Clinical Psychology',
  5000,
  true,
  true
);

-- Quick test patient with credits
INSERT INTO users (id, email, user_type, email_verified, credits)
VALUES (gen_random_uuid(), 'quicktest-patient@test.com', 'individual', true, 10)
ON CONFLICT (email) DO UPDATE SET credits = 10, email_verified = true;
```

### STEP 2: Start Your Dev Server

```bash
npm run dev
```

### STEP 3: Login as Therapist (Browser Window 1)

1. Go to: `http://localhost:3000/therapist/login`
2. Enter: `quicktest-therapist@test.com`
3. Check terminal for magic link (or check your email)
4. Click the magic link to login
5. You'll see: Therapist Dashboard

### STEP 4: Set Availability (2 minutes)

1. In therapist dashboard, go to "Availability"
2. Add today's date
3. Set time slots: **RIGHT NOW to 2 hours from now**
4. Click "Save Availability"

### STEP 5: Book Session as Patient (Browser Window 2 or Incognito)

1. Open NEW browser window (or incognito)
2. Go to: `http://localhost:3000/login`
3. Enter: `quicktest-patient@test.com`
4. Click magic link to login
5. Click "Book Session"
6. Select "Test Therapist"
7. **Book a slot 5 minutes from NOW**
8. Confirm booking

### STEP 6: Join Video Session (NOW!)

**In Therapist Window:**
1. Go back to therapist dashboard
2. You'll see "Upcoming Sessions"
3. **Wait until 5 minutes before session time**
4. Click "Join Session" button
5. Allow camera and microphone when prompted

**In Patient Window:**
1. Go to patient dashboard
2. Click "Join Session" for the same session
3. Allow camera and microphone

### STEP 7: Have Your Test Conversation (3-5 minutes)

**Talk naturally about a test scenario:**

🗣️ Say things like:
- "I've been feeling stressed about work lately"
- "The long hours are affecting my sleep"
- "I'm worried about burnout"
- "What coping strategies would you recommend?"

**Keep talking for at least 3-5 minutes so transcription has content!**

Look for:
- ✅ Video works both sides
- ✅ Audio is clear
- ✅ Timer counting down from 30:00
- ✅ Recording indicator (red dot or "Recording" button)

**If you see "Start Recording" button - CLICK IT!**

### STEP 8: End Session

- Wait for timer to reach 00:00 OR
- Click "End Session" button
- Video call will end

### STEP 9: Check Results (2-5 minutes)

**In Therapist Dashboard:**

1. Go to "Client Sessions" or "Session Notes"
2. Find your completed session
3. Click "View Details" or expand it

**You should see:**

📝 **Transcript Section:**
```
[Should show what you just said in the conversation]
"I've been feeling stressed about work lately..."
```

🏥 **AI SOAP Notes Section:**
```
Subjective: Patient reports feeling stressed...
Objective: Patient appeared calm during session...
Assessment: Symptoms consistent with work-related stress...
Plan: Recommend stress management techniques...
```

**If you DON'T see notes yet:**
- Wait 2-3 more minutes (AI processing takes time)
- Refresh the page
- Check browser console for errors

---

## 🎯 What You're Testing

✅ **Video Connection** - Does video/audio work?
✅ **Recording** - Does it capture your conversation?
✅ **Transcription** - Does it convert speech to text accurately?
✅ **AI SOAP Notes** - Does AI generate clinical notes?
✅ **Dashboard Display** - Can you view notes in dashboard?

---

## 🐛 Quick Troubleshooting

### Can't login?
- Check your terminal for magic link logs
- Look for: `Magic link token: [your-token]`
- Manually construct: `http://localhost:3000/api/auth/verify-email?token=[token]&email=[email]&user_type=therapist`

### Video won't connect?
- Check browser console (F12)
- Ensure camera/mic permissions granted
- Try refreshing the page

### Recording not working?
- Make sure you clicked "Start Recording" if you see the button
- Check browser console for errors
- Verify microphone is active (green indicator)

### No transcript after session?
- Wait 5 minutes total
- Check: `/app/therapist/dashboard/client-sessions`
- Check browser Network tab for API errors
- Look in Supabase `session_notes` table directly

### No SOAP notes?
- These depend on transcript being generated first
- May take 5-10 minutes total
- Check if `sessions` table has `soap_notes` column populated

---

## 🔍 Manual Verification (if needed)

**Check Supabase directly:**

```sql
-- See your session
SELECT * FROM sessions 
WHERE therapist_id IN (
  SELECT id FROM users WHERE email = 'quicktest-therapist@test.com'
)
ORDER BY created_at DESC LIMIT 1;

-- See transcript
SELECT * FROM session_notes
WHERE session_id = 'YOUR_SESSION_ID_FROM_ABOVE';

-- See if SOAP notes generated
SELECT id, soap_notes FROM sessions
WHERE id = 'YOUR_SESSION_ID'
AND soap_notes IS NOT NULL;
```

---

## 🎬 Expected Flow Timeline

- **T+0 min**: Book session
- **T+5 min**: Join video call
- **T+8 min**: Recording started, conversation happening
- **T+35 min**: Session ends (30 min + 5 min buffer)
- **T+37 min**: Transcription starts processing
- **T+40 min**: Transcript appears in dashboard
- **T+42 min**: AI SOAP notes generated
- **T+43 min**: Everything visible in therapist dashboard ✅

---

## 📸 What to Check in Dashboard

**Therapist Dashboard → Client Sessions:**

You should see a card/row with:
- ✅ Patient name
- ✅ Session date/time
- ✅ Status: "Completed"
- ✅ "View Notes" button
- ✅ Session duration (30 minutes)

**Click "View Notes":**
- ✅ Full transcript of conversation
- ✅ AI-generated SOAP notes (all 4 sections)
- ✅ Session metadata (date, time, duration)
- ✅ Option to edit notes (if implemented)

---

## 🚀 READY? Let's Go!

1. ✅ Run SQL to create accounts
2. ✅ Start dev server: `npm run dev`
3. ✅ Login as therapist (window 1)
4. ✅ Set availability NOW
5. ✅ Login as patient (window 2)
6. ✅ Book session 5 min from now
7. ✅ Join video call (both windows)
8. ✅ Talk for 3-5 minutes
9. ✅ End session
10. ✅ Check dashboard for notes!

**Total time: ~15-20 minutes** ⏱️

---

**Having issues? Check browser console (F12) and terminal logs for errors!**

