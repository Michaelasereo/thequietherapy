# 🧪 Manual Testing Steps for MVP

## Your server is running at: http://localhost:3002

## 📋 **IMMEDIATE TESTING CHECKLIST**

### **1. 👤 USER WORKFLOW TEST**

**Step 1: User Registration**
1. Open: http://localhost:3002
2. Navigate to `/login` or `/signup`
3. Enter email: `test.user@example.com`
4. Check for magic link email
5. ✅ **Expected:** User gets 1 free credit automatically

**Step 2: Profile Completion**
1. Complete user profile after login
2. Add medical history, preferences
3. ✅ **Expected:** Profile saves successfully

**Step 3: Browse & Book Session**
1. Navigate to booking section
2. Browse available therapists
3. Select time slot
4. Book session using free credit
5. ✅ **Expected:** 25-minute session booked

**Step 4: Credit Balance Check**
1. Check dashboard for credit display
2. ✅ **Expected:** Shows "0 credits remaining" after booking

---

### **2. 👨‍⚕️ THERAPIST WORKFLOW TEST**

**Step 1: Therapist Enrollment**
1. Navigate to `/therapist/enroll`
2. Submit therapist application
3. Upload credentials/documents
4. ✅ **Expected:** Application submitted, pending approval

**Step 2: Admin Approval** 
1. Login as admin
2. Navigate to therapist approvals
3. Approve the therapist application
4. ✅ **Expected:** Therapist can now login

**Step 3: Therapist Dashboard**
1. Therapist logs in
2. Check dashboard for real-time data
3. ✅ **Expected:** Shows sessions, earnings, client count

**Step 4: Set Availability**
1. Navigate to availability settings
2. Set weekly schedule (e.g., Mon-Fri 9AM-5PM)
3. ✅ **Expected:** Time slots appear in user booking system

---

### **3. 💳 PAYMENT SYSTEM TEST**

**Step 1: Complete Free Session**
1. User joins video session (25 minutes)
2. Complete the session
3. ✅ **Expected:** Redirected to `/dashboard/continue-journey`

**Step 2: Upsell Funnel**
1. View pricing packages on continue-journey page
2. See Bronze (₦13,500), Silver (₦20,000), Gold (₦28,000)
3. ✅ **Expected:** Compelling pricing display with savings

**Step 3: Test Payment (Use Test Mode)**
1. Click "Buy Bronze Pack"
2. Should redirect to Paystack test environment
3. Use test card: 4084084084084081
4. ✅ **Expected:** Payment successful, credits added

---

### **4. 🎥 VIDEO SESSION TEST**

**Step 1: Join Session**
1. User clicks "Join Session" at scheduled time
2. Grant camera/microphone permissions
3. ✅ **Expected:** Video call connects via Daily.co

**Step 2: Video Features**
1. Test mute/unmute audio
2. Test camera on/off
3. Test chat functionality
4. ✅ **Expected:** All features work smoothly

**Step 3: End Session**
1. Therapist ends the session
2. ✅ **Expected:** AI generates SOAP notes automatically

---

### **5. 🤖 AI NOTES TEST**

**Step 1: Session Transcript**
1. After video session ends
2. Check if AI processed the session
3. ✅ **Expected:** SOAP notes generated (we saw this working!)

**Step 2: Review Notes**
1. Therapist reviews generated notes
2. Can edit if needed
3. ✅ **Expected:** Professional SOAP format with S.O.A.P. sections

---

## 🔧 **BROWSER CONSOLE TESTING**

### **Load Testing Script:**
1. Open http://localhost:3002
2. Open Developer Tools (F12) → Console
3. Paste the contents of `test-mvp-apis.js`
4. Run: `testMVPAPIs()`

### **Test Different User Types:**
1. **As User:** `testMVPAPIs()` after logging in as individual
2. **As Therapist:** `testMVPAPIs()` after logging in as therapist  
3. **As Admin:** `testMVPAPIs()` after logging in as admin

---

## 🚨 **CRITICAL SUCCESS CRITERIA**

Your MVP is ready when:

### **✅ User Journey Works:**
- [ ] New user signup → Gets 1 free credit
- [ ] Books session → Uses free credit (25 min)
- [ ] Completes video session → AI generates notes
- [ ] Sees upsell page → Can purchase packages
- [ ] Buys package → Gets paid credits (35 min sessions)

### **✅ Therapist Journey Works:**
- [ ] Therapist enrolls → Pending approval
- [ ] Admin approves → Can login and set availability
- [ ] User books → Appears in therapist dashboard
- [ ] Conducts session → Can review AI notes

### **✅ Technical Systems Work:**
- [ ] Authentication system secure
- [ ] Payment processing (test mode)
- [ ] Video sessions connect reliably
- [ ] AI generates meaningful notes
- [ ] Real-time dashboard updates

---

## 📱 **MOBILE TESTING**

### **Test on Mobile Devices:**
1. Open http://172.20.10.2:3002 on mobile
2. Test user registration flow
3. Test video session on mobile
4. ✅ **Expected:** Responsive design, video works

---

## 🎯 **NEXT STEPS AFTER TESTING**

### **If Everything Works:**
1. ✅ MVP is ready for pre-user testing
2. Recruit 5-10 beta testers
3. Set up production environment
4. Plan launch timeline

### **If Issues Found:**
1. Document bugs in priority order
2. Fix critical issues first
3. Re-test after fixes
4. Repeat until all workflows work

---

## 📞 **SUPPORT DURING TESTING**

**Common Issues & Solutions:**

**🔧 Video not working?**
- Check camera/microphone permissions
- Try different browser (Chrome recommended)
- Check network connection

**🔧 Payment not working?**
- Verify Paystack test keys in .env.local
- Use test card: 4084084084084081
- Check webhook URL configuration

**🔧 AI notes not generating?**
- Check DeepSeek API key in environment
- Verify session transcript exists
- Check server logs for AI errors

**🔧 Authentication issues?**
- Clear browser cookies
- Check email for magic links
- Verify database connection

---

## 🎉 **SUCCESS METRICS**

### **Your MVP is launch-ready when:**
- ✅ All 4 user types can complete their workflows
- ✅ Payment system processes test transactions
- ✅ Video quality is acceptable for therapy
- ✅ AI generates professional SOAP notes
- ✅ No critical bugs in core functionality

**Current Status:** 🟢 **LOOKING EXCELLENT!** 

Your API tests showed everything is working. Now it's time for the manual user experience testing! 🚀
