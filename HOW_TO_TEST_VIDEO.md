# 🎥 How to Test Video Flow Right Now

## ✅ Your Setup is Ready!

**Dev Server:** Running at http://localhost:3000
**Environment:** Configured and ready
**Dev Console:** Created and integrated

---

## 🚀 Quick Test (5 minutes)

### Option 1: Use Developer Console (Easiest!)

1. **Login as Therapist**
   ```
   Go to: http://localhost:3000/therapist/login
   Email: [Your therapist email]
   ```

2. **Open Dev Console**
   - After login, look for **🛠️ Dev Console** button (bottom right of screen)
   - OR go directly to: http://localhost:3000/dev-console

3. **Create Test Session**
   - Click "**🎥 Create Test Session**"
   - This creates a session scheduled 5 min from now
   - Creates a test patient automatically

4. **Join Video Session**
   - Click "**🎥 Join Session**" on the session card
   - Opens video call in new tab
   - Allow camera/microphone

5. **Generate Test Data**
   - Go back to Dev Console
   - Click "**📝 Generate Test Transcript**" on the session
   - This creates a realistic transcript
   - Automatically generates AI SOAP notes
   - Wait 30 seconds

6. **View Results**
   - Click "**🔍 View Details**" (check browser console F12)
   - OR click "**📋 View SOAP Notes**" to see the generated notes
   - OR go to "**📊 Go to Dashboard**" and check "Client Sessions"

**Done!** You've tested the complete flow in 5 minutes! 🎉

---

### Option 2: Full Manual Test (20 minutes)

If you want to test the real user flow:

1. **Create Test Accounts in Supabase**
   - Run: `setup-quick-test-accounts-FIXED.sql`
   - Creates therapist: quicktest-therapist@test.com
   - Creates patient: quicktest-patient@test.com

2. **Login as Therapist**
   ```
   http://localhost:3000/therapist/login
   Email: quicktest-therapist@test.com
   ```

3. **Set Availability**
   - Dashboard → Availability
   - Add TODAY, NOW to +2 hours
   - Save

4. **Book Session (New Incognito Window)**
   ```
   http://localhost:3000/login
   Email: quicktest-patient@test.com
   ```
   - Book Session → Select therapist
   - Choose slot 5-10 min from now

5. **Join Video Call**
   - Both windows: "Join Session"
   - Talk for 3-5 minutes
   - Say realistic things about stress/work

6. **Check Results**
   - Therapist dashboard → Client Sessions
   - View completed session
   - See transcript & SOAP notes

---

## 🎯 What You'll See

### In Dev Console:
✅ **Sessions List** - All your test sessions
✅ **Quick Actions** - Create, join, generate data
✅ **Instant Feedback** - Green/red messages
✅ **View SOAP Notes** - Click to see AI-generated notes

### In Regular Dashboard:
✅ **Completed Sessions** - Session history
✅ **Session Notes** - Full transcript
✅ **AI SOAP Notes** - Professional clinical documentation
✅ **Patient Info** - Who you saw

---

## 🛠️ Dev Console Features

### Create Test Session
- Automatically creates Daily.co room
- Sets up database entry
- Schedules 5 min from now
- Creates test patient if needed

### Generate Test Transcript
- Adds realistic conversation
- Triggers AI SOAP generation
- Simulates post-session processing
- No need to actually have a call!

### View Details
- Shows full session data
- Displays in browser console (F12)
- See transcript, SOAP notes, metadata

### Quick Navigation
- Jump to video session
- Go to dashboard
- Refresh session list

---

## 🔍 Testing Checklist

Use the Dev Console to test:

- [ ] Create session → Check database entry
- [ ] Join session → Video loads correctly
- [ ] Generate transcript → Transcript appears
- [ ] Generate SOAP → Notes are created
- [ ] View in dashboard → Everything displays
- [ ] Edit notes (if implemented)
- [ ] Session status updates
- [ ] Patient info correct

---

## 💡 Pro Tips

1. **Use Dev Console for Quick Tests**
   - No need to wait for real sessions
   - Generate data instantly
   - Test edge cases easily

2. **Check Browser Console (F12)**
   - See detailed logs
   - Catch errors early
   - View raw API responses

3. **Test in Incognito**
   - When testing both patient/therapist
   - Avoid session conflicts
   - Fresh state each time

4. **Refresh Session List**
   - After generating data
   - To see latest changes
   - Updates from database

---

## 🚨 Common Issues

### "No sessions found"
→ Click "Create Test Session" first

### "Can't join session"
→ Check the session status
→ Try marking it as "scheduled" first

### "No transcript appears"
→ Click "Generate Test Transcript"
→ Wait 30 seconds for processing

### "SOAP notes missing"
→ Check if transcript exists first
→ SOAP notes require transcript

### "Dev Console button not showing"
→ Make sure you're logged in
→ Check you're in development mode

---

## 📊 Expected Results

After testing, you should see:

**In Session Card:**
```
Test Session
Patient: Quick Test Patient
📅 2025-10-10 at 14:30
Status: completed

[Actions: View Details, View SOAP Notes]
```

**In SOAP Notes:**
```
Subjective: Patient reports feeling stressed about work...
Objective: Patient appeared calm during session...
Assessment: Symptoms consistent with work-related stress...
Plan: Recommend stress management techniques...
```

**In Browser Console:**
```
📊 Session Details: {id: "...", status: "completed", ...}
📝 Session Notes: {transcript: "...", soap_notes: "..."}
```

---

## 🎉 You're Ready!

The dev console gives you:
- ✅ Instant testing without waiting
- ✅ Generate realistic data
- ✅ Test all video features
- ✅ No manual setup needed
- ✅ Perfect for demos

**Just login and click the 🛠️ Dev Console button!**

---

## 📞 Quick Links

- **Dev Console:** http://localhost:3000/dev-console
- **Therapist Login:** http://localhost:3000/therapist/login
- **Patient Login:** http://localhost:3000/login
- **Dashboard:** http://localhost:3000/therapist/dashboard

---

**Ready to test? Login now and open the Dev Console!** 🚀

