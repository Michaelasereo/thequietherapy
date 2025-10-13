# 🎥 Therapist Video Testing Guide - October 10, 2025

## 👋 Welcome, Therapists!

Thank you for helping us test the video session functionality. This guide will walk you through the complete testing process.

---

## 🎯 What We're Testing Today

1. **Video Call Quality** - HD video and audio clarity
2. **Session Recording** - Automatic audio capture during sessions
3. **AI Transcription** - Converting session audio to text
4. **SOAP Notes Generation** - AI-powered clinical documentation
5. **Session Timer** - 30-minute therapy session countdown
6. **End-to-End Flow** - Complete patient booking to notes generation

---

## 📋 Pre-Test Checklist

### ✅ What You Need:
- [ ] Laptop or desktop computer (recommended)
- [ ] Webcam and microphone
- [ ] Chrome, Firefox, or Safari browser (latest version)
- [ ] Good internet connection (minimum 5 Mbps)
- [ ] Quiet testing environment
- [ ] 60 minutes for complete testing

### 🎧 Audio/Video Setup:
1. **Test your microphone**: Go to https://webcammictest.com/
2. **Test your camera**: Ensure your webcam is working
3. **Close other apps**: Shut down Zoom, Teams, etc. to avoid conflicts
4. **Use headphones**: Recommended for best audio quality

---

## 🚀 Testing Steps - Complete Flow

### **STEP 1: Login to Therapist Dashboard** (5 minutes)

1. **Go to**: Your assigned login URL (provided separately)
2. **Click**: "Login with Magic Link"
3. **Enter**: Your test therapist email
4. **Check**: Your email inbox for magic link
5. **Click**: The magic link to login
6. **Verify**: You see your therapist dashboard

**✅ Success Criteria:**
- Dashboard loads without errors
- You can see "Therapist Dashboard" heading
- Navigation menu is visible

**❌ If Issues:**
- Check spam folder for magic link
- Ensure you're using the correct email
- Try incognito/private browsing mode

---

### **STEP 2: Set Your Availability** (5 minutes)

1. **Navigate to**: "Availability" section in dashboard
2. **Set hours**: Add today's date and select available time slots
3. **Save**: Click "Save Availability"
4. **Verify**: Your availability shows on the calendar

**✅ Success Criteria:**
- Availability saves successfully
- Time slots appear in green on calendar
- No error messages

**❌ If Issues:**
- Refresh the page and try again
- Check that times are in the future
- Take a screenshot of any errors

---

### **STEP 3: Book a Test Session** (10 minutes)

For testing, we'll book a session from a test patient account:

1. **Open new browser tab** (or use second device)
2. **Go to**: Patient login URL (provided separately)
3. **Login as**: Test patient (credentials provided)
4. **Click**: "Book Session"
5. **Select**: Your therapist profile
6. **Choose**: A time slot 5-10 minutes from now
7. **Confirm**: Booking with test credits
8. **Verify**: Confirmation email received

**✅ Success Criteria:**
- Booking completes successfully
- Both therapist and patient receive confirmation
- Session appears in "Upcoming Sessions"

**❌ If Issues:**
- Ensure patient has credits
- Check that time slot is available
- Verify internet connection

---

### **STEP 4: Join Video Session** (30 minutes)

**⏰ Wait until 5 minutes before session time**

#### **As Therapist:**

1. **Go to**: Therapist Dashboard
2. **Find**: Upcoming session (should have "Join Session" button)
3. **Click**: "Join Session" button
4. **Allow**: Camera and microphone permissions when prompted
5. **Wait**: For the session room to load

#### **As Patient (in second tab/device):**

1. **Go to**: Patient Dashboard
2. **Click**: "Join Session" for the same session
3. **Allow**: Camera and microphone permissions
4. **Join**: The video call

#### **During the Session:**

**📹 Video Quality Test:**
- Can you see the other participant clearly?
- Is the video smooth or choppy?
- Rate video quality: ⭐⭐⭐⭐⭐ (note in feedback)

**🎤 Audio Quality Test:**
- Can you hear clearly?
- Is there echo or feedback?
- Rate audio quality: ⭐⭐⭐⭐⭐ (note in feedback)

**⏱️ Timer Test:**
- Look for the session timer (should be counting down from 30:00)
- Does it count down properly?
- Note the time on the screen

**🎙️ Recording Test:**
- Look for recording indicator (red dot or "Recording" text)
- **If you see recording controls**: Click "Start Recording"
- Have a brief conversation (discuss test topics - see below)
- Speak clearly for 3-5 minutes minimum

**💬 Test Conversation Topics:**
Have a realistic (but fictional) conversation for testing:
- Discuss work stress (fictional scenario)
- Talk about coping strategies
- Practice active listening responses
- Use clinical terminology you'd normally use

**Important**: Speak clearly and naturally - this will test the transcription quality!

**⏰ Session End:**
- Timer should reach 00:00 after 30 minutes
- Session should automatically move to "buffer period"
- Video call should end or indicate session complete

**✅ Success Criteria:**
- Video and audio work clearly
- Recording indicator is visible
- Timer counts down correctly
- Session lasts full 30 minutes
- No crashes or freezes

**❌ If Issues:**
- **No audio**: Check microphone permissions in browser
- **No video**: Check camera permissions
- **Can't connect**: Refresh page and rejoin
- **Recording not working**: Note issue and continue testing
- **Timer stuck**: Take screenshot and note the time

---

### **STEP 5: Post-Session Processing** (10 minutes)

After the session ends:

1. **Wait**: 2-3 minutes for processing
2. **Go to**: "Client Sessions" or "Session Notes" in dashboard
3. **Find**: The completed test session
4. **Click**: "View Details" or "View Notes"

**Look for:**

**📝 Session Transcript:**
- [ ] Transcript is generated and visible
- [ ] Transcript text matches what was said
- [ ] Transcript is reasonably accurate (>80% accuracy)
- [ ] Both speakers are captured

**🏥 AI SOAP Notes:**
- [ ] SOAP notes are automatically generated
- [ ] Contains Subjective section
- [ ] Contains Objective section
- [ ] Contains Assessment section
- [ ] Contains Plan section
- [ ] Notes reflect the conversation content

**✅ Success Criteria:**
- Transcript appears within 5 minutes of session end
- SOAP notes are generated automatically
- Content is relevant to conversation
- Format is professional and usable

**❌ If Issues:**
- **No transcript**: Check if recording started during session
- **No SOAP notes**: May take up to 10 minutes
- **Inaccurate transcript**: Note accuracy percentage
- **Missing sections**: Document which sections are missing

---

## 📊 Feedback Form

Please fill this out after testing (we'll provide a form or use this as a template):

### Video Call Quality (1-5 stars)
- Video clarity: ⭐⭐⭐⭐⭐
- Audio clarity: ⭐⭐⭐⭐⭐
- Connection stability: ⭐⭐⭐⭐⭐
- Overall experience: ⭐⭐⭐⭐⭐

### Recording & Transcription (1-5 stars)
- Recording ease of use: ⭐⭐⭐⭐⭐
- Transcript accuracy: ⭐⭐⭐⭐⭐
- Transcript completeness: ⭐⭐⭐⭐⭐
- Processing speed: ⭐⭐⭐⭐⭐

### AI SOAP Notes (1-5 stars)
- Note quality: ⭐⭐⭐⭐⭐
- Clinical accuracy: ⭐⭐⭐⭐⭐
- Relevance: ⭐⭐⭐⭐⭐
- Time saved: ⭐⭐⭐⭐⭐

### Open Feedback
**What worked well?**
_[Your feedback here]_

**What didn't work?**
_[Your feedback here]_

**What would you change?**
_[Your feedback here]_

**Would you use this in your practice?** [ ] Yes [ ] No [ ] Maybe
**Why or why not?**
_[Your feedback here]_

---

## 🐛 Common Issues & Quick Fixes

### Issue: "Can't access camera/microphone"
**Fix:**
1. Check browser permissions (click lock icon in address bar)
2. Go to browser settings → Privacy → Camera/Microphone
3. Allow access for the site
4. Refresh the page

### Issue: "Video is choppy or freezing"
**Fix:**
1. Close other browser tabs
2. Close other video apps (Zoom, Teams, etc.)
3. Check internet speed at fast.com (need 5+ Mbps)
4. Try reducing video quality in call settings

### Issue: "Can't hear audio / no sound"
**Fix:**
1. Check system volume is not muted
2. Check browser tab is not muted (check tab icon)
3. Test audio at webcammictest.com
4. Try using headphones

### Issue: "Recording didn't capture audio"
**Fix:**
1. Ensure you clicked "Start Recording" button
2. Check that microphone was active during session
3. Verify recording indicator was showing
4. Note in feedback if recording didn't work

### Issue: "No transcript or SOAP notes generated"
**Fix:**
1. Wait up to 10 minutes for processing
2. Refresh the dashboard
3. Check "Session Notes" or "Client Sessions" page
4. If still missing after 15 minutes, note in feedback

### Issue: "Session won't start / Can't join"
**Fix:**
1. Check you're joining within 5 minutes of session time
2. Refresh the page and try again
3. Clear browser cache
4. Try incognito/private mode
5. Try a different browser

---

## 📞 Emergency Contacts

**If you encounter critical issues during testing:**

1. **Take screenshots** of any error messages
2. **Note the time** when the issue occurred
3. **Document what you were doing** when it happened
4. **Continue testing** other features if possible
5. **Report issues** via the feedback form or directly to the team

---

## ⏰ Testing Timeline (Total: 60 minutes)

- **0-5 min**: Login and dashboard review
- **5-10 min**: Set availability
- **10-20 min**: Book test session
- **20-50 min**: Video session (30 min actual + buffer)
- **50-60 min**: Review notes and provide feedback

---

## 🎯 Success Metrics

We're measuring:

1. **Technical Success**:
   - Video calls connect successfully
   - Recording captures audio
   - Transcription completes
   - SOAP notes generate

2. **User Experience**:
   - Ease of use (1-5 stars)
   - Clarity of interface
   - Intuitiveness of workflow

3. **Clinical Value**:
   - SOAP note quality
   - Time saved on documentation
   - Willingness to use in practice

---

## 💡 Tips for Effective Testing

1. **Be realistic**: Use the platform as you would in real practice
2. **Test edge cases**: Try things that might break it
3. **Document everything**: Screenshots are helpful
4. **Be honest**: We want real feedback, not just positive
5. **Ask questions**: If something is unclear, note it

---

## 🙏 Thank You!

Your feedback today is invaluable for improving the platform. We're building this for therapists like you, and your input will directly shape the final product.

**After testing, you'll receive:**
- Follow-up survey link
- Gift card/compensation (if applicable)
- Early access to the platform
- Updates on improvements made from your feedback

---

## 📝 Quick Reference: Test Account Credentials

**Your assigned accounts will be provided separately via email:**

- Therapist Login: [Provided separately]
- Patient Login: [Provided separately]
- Session Time: [Coordinated with team]

---

## 🚨 What to Do If Everything Breaks

Don't panic! This is a test, and finding issues is the goal.

1. **Document the issue** (screenshot + description)
2. **Try basic fixes** (refresh, different browser)
3. **Note the time and action** that caused the issue
4. **Move to next test** if possible
5. **Report in feedback form**

Remember: **There are no wrong results in testing - every issue you find makes the product better!**

---

**Questions during testing?**
- Check the troubleshooting section above
- Note questions in your feedback
- We'll address them in the follow-up

**Ready to start? Let's test!** 🚀

