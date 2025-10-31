# 🎯 Therapy Session End-to-End Test Guide

**Purpose**: Test complete therapy session flow from start to finish  
**Duration**: 15-20 minutes  
**Status**: Ready to Execute

---

## 🧪 TEST SETUP

### Prerequisites:
- [ ] Dev server running (http://localhost:3000)
- [ ] Two browser windows/tabs open
- [ ] Therapist test account ready
- [ ] User test account ready
- [ ] Both logged in to dashboard

---

## 📋 STEP-BY-STEP TEST PLAN

### Phase 1: Session Creation (5 minutes)

#### As Therapist:

1. **Login to Therapist Dashboard**
   - Go to: http://localhost:3000/therapist/login
   - Login with therapist credentials
   - ✅ Should redirect to `/therapist/dashboard`

2. **Set Availability**
   - Go to: `/therapist/dashboard/availability`
   - Set available time slots for today
   - ✅ Should save successfully

#### As User:

3. **Login to User Dashboard**
   - Open second browser: http://localhost:3000/login
   - Login with user credentials
   - ✅ Should redirect to `/dashboard`

4. **Browse Therapists**
   - Go to: `/dashboard/book`
   - Browse available therapists
   - ✅ Should see therapist list

5. **Book Session**
   - Select therapist
   - Pick available time slot
   - Confirm booking
   - ✅ Should create session successfully

---

### Phase 2: Video Session (5 minutes)

#### As User:

6. **Join Video Session**
   - In user dashboard, click "Join Session" on upcoming session
   - OR go to: `/video-session/[session-id]`
   - ✅ Should load video interface
   - ✅ Should show "Waiting for therapist"

#### As Therapist:

7. **Join Video Session**
   - In therapist dashboard, click "Start Session"
   - OR go to: `/video-session/[session-id]`
   - ✅ Should load video interface
   - ✅ Should show user video/audio
   - ✅ Should be able to see and hear user

8. **Test Recording**
   - Both joined, video working
   - Click "Start Recording" (top right corner)
   - ✅ Should show "Recording..." indicator
   - Speak for 10-15 seconds
   - Click "Stop Recording"
   - ✅ Should process recording

---

### Phase 3: Transcription & AI Notes (3 minutes)

9. **Wait for Transcription**
   - After stopping recording, wait 30 seconds
   - ✅ Should show transcription appearing
   - ✅ Should show "Generating SOAP notes..." message

10. **Verify SOAP Notes**
    - Wait another 30 seconds
    - ✅ Should show SOAP notes populated
    - ✅ Should have S/O/A/P sections

---

### Phase 4: Post-Session Activities (5 minutes)

#### As Therapist:

11. **Complete Session**
    - In therapist dashboard, find completed session
    - View session notes
    - ✅ Should show full transcript
    - ✅ Should show AI-generated SOAP notes

12. **Review & Edit Notes**
    - Click to edit SOAP notes
    - Make a small change
    - Save changes
    - ✅ Should update successfully

#### As User:

13. **View Session History**
    - In user dashboard, go to "Sessions" or "History"
    - Find the completed session
    - ✅ Should show session details
    - ✅ Should show session notes (if shared)

14. **Check Credits**
    - Go to dashboard
    - Check credit balance
    - ✅ Should show credit was deducted
    - ✅ Balance updated correctly

---

## ✅ SUCCESS CRITERIA

### Must Work:
- [x] Therapist can set availability
- [x] User can book session
- [x] Both can join video call
- [x] Video/audio connection works
- [x] Recording can be started/stopped
- [x] Transcription appears after recording
- [x] SOAP notes generated automatically
- [x] Notes saved to database
- [x] Both can view session history

### Nice to Have:
- [ ] Notes appear in both dashboards
- [ ] Email notifications sent
- [ ] Session reminders working
- [ ] Download recording option

---

## 🐛 TROUBLESHOOTING

### If Video Doesn't Connect:
**Problem**: "Failed to join call"
**Solution**: Check Daily.co API key in .env.local

### If Recording Doesn't Work:
**Problem**: "No audio tracks available"
**Solution**: 
- Allow microphone permissions
- Check browser console for errors
- Try different browser

### If Transcription Fails:
**Problem**: "Transcription failed"
**Solution**:
- Check OpenAI API key
- Check file size (should be small)
- Check network tab for API errors

### If SOAP Notes Don't Generate:
**Problem**: "AI processing failed"
**Solution**:
- Check DeepSeek API key
- Check console logs
- Verify API responses in network tab

---

## 📊 WHAT TO CHECK

### During Test:
1. Browser console - Any errors?
2. Network tab - API calls successful?
3. Application flow - Logical and smooth?
4. User experience - Easy to use?

### After Test:
1. Database - Is data saved correctly?
2. AI output - Are notes quality good?
3. Session state - Complete properly?
4. Both dashboards - Show session?

---

## 🎯 EXPECTED OUTCOMES

### Perfect Test:
✅ All steps complete successfully  
✅ No errors in console  
✅ AI generates quality SOAP notes  
✅ Both users see session in history  
✅ Credits deducted correctly  
✅ Recording transcribed accurately  

### Acceptable Test:
⚠️ Minor hiccups but core flow works  
⚠️ One or two manual interventions needed  
⚠️ AI notes basic but acceptable  
⚠️ Session recorded and saved  

### Needs Fix:
❌ Video doesn't connect  
❌ Recording doesn't work  
❌ Transcription completely fails  
❌ SOAP notes not generated  
❌ Data not saved  

---

## 📝 TEST LOG TEMPLATE

```
Date: ____________
Tester: ____________
Duration: ____________

Phase 1 - Session Creation:
- [ ] Therapist login: PASS / FAIL
- [ ] Set availability: PASS / FAIL
- [ ] User login: PASS / FAIL
- [ ] Browse therapists: PASS / FAIL
- [ ] Book session: PASS / FAIL

Phase 2 - Video Session:
- [ ] User joins: PASS / FAIL
- [ ] Therapist joins: PASS / FAIL
- [ ] Video works: PASS / FAIL
- [ ] Audio works: PASS / FAIL
- [ ] Recording works: PASS / FAIL

Phase 3 - AI Processing:
- [ ] Transcription: PASS / FAIL
- [ ] SOAP notes: PASS / FAIL

Phase 4 - Post-Session:
- [ ] Notes saved: PASS / FAIL
- [ ] History shows: PASS / FAIL
- [ ] Credits updated: PASS / FAIL

Issues Found:
1. 
2. 
3. 

Overall: READY / NEEDS WORK / NOT READY
```

---

## 🚀 READY TO TEST?

Follow the steps above in order. Take your time - this is comprehensive testing. Document any issues you find!

Good luck! 🍀

