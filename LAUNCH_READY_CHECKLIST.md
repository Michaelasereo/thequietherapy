# 🚀 PRE-LAUNCH CHECKLIST: Video Sessions

## Quick 10-Minute Verification

### 1️⃣ Run Automated Test (2 minutes)
```bash
node test-video-complete.js
```

**Expected Output:**
- ✅ Created patient
- ✅ Created/found therapist
- ✅ Created Daily.co room (if configured)
- ✅ Created session
- ✅ Created session notes
- ✅ Generated SOAP notes
- ✅ Patient can see session
- ✅ Therapist can see session
- ✅ Session marked as completed

**If this passes, you're 90% ready!**

---

### 2️⃣ Manual Video Test (5 minutes)

#### Quick Method:
1. Login as therapist: `http://localhost:3000/therapist/login`
2. Look for "🧪 Video Test Console" (dev only)
3. Click "Create Test Video Session"
4. Click "Join as Therapist" (new tab)
5. Click "Join as Patient" (another tab)
6. Verify both can see/hear each other

---

### 3️⃣ Dashboard Verification (3 minutes)

#### Patient Dashboard:
```
http://localhost:3000/dashboard/therapy
```
- [ ] See upcoming sessions
- [ ] See completed sessions  
- [ ] Can click "View Details"

#### Therapist Dashboard:
```
http://localhost:3000/therapist/dashboard/client-sessions
```
- [ ] See scheduled sessions
- [ ] See completed sessions
- [ ] Can view session notes
- [ ] Can see SOAP notes

---

## 🎯 CRITICAL CHECKS

### Must Work:
- [x] Video loads (Daily.co iframe)
- [x] Both users can join
- [x] Session notes save
- [x] Sessions appear on dashboards
- [x] Session status updates (scheduled → completed)

### Nice to Have:
- [ ] AI SOAP notes generate
- [ ] Transcript capture
- [ ] Session recording

---

## ⚡ FASTEST VERIFICATION

Run this one command:
```bash
node test-video-complete.js && echo "\n✨ All checks passed! Ready to launch!"
```

If you see "✨ Test completed successfully!" → **You're good to go!**

---

## 🚨 IF SOMETHING FAILS

### "Daily.co room failed"
→ Add `DAILY_API_KEY` and `DAILY_DOMAIN` to `.env.local`
→ Or skip video for now (test manually later)

### "Session not found"
→ Check database tables exist: `sessions`, `session_notes`
→ Run: `SELECT * FROM sessions LIMIT 1;` in Supabase

### "Dashboard query failed"
→ Check RLS policies allow reading
→ Verify user relationships in session

---

## ✅ LAUNCH CRITERIA

You're ready to launch if:

1. ✅ Automated test passes (`node test-video-complete.js`)
2. ✅ Can create and join video session
3. ✅ Sessions show on both dashboards
4. ✅ Session notes work

**That's it!** Everything else can be refined post-launch.

---

## 📞 EMERGENCY CONTACT

If you need to launch NOW but video isn't working:
1. Disable video joining temporarily
2. Launch with booking/scheduling only
3. Fix video after launch

---

## 🎉 YOU'RE READY!

**Run the test, verify dashboards, and you're good to go!**

```bash
npm run dev
node test-video-complete.js
```

**Then check the dashboards and launch! 🚀**

