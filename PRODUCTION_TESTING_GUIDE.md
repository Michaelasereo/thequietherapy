# 🚀 PRODUCTION TESTING GUIDE

## Overview
This guide provides a comprehensive testing strategy for your therapy platform before launch. It covers both automated code testing and manual browser testing.

---

## 🔧 **PHASE 1: AUTOMATED CODE TESTING**

### **Run Production Readiness Tests**

```bash
# Make the script executable
chmod +x scripts/test-production-readiness.js

# Run all automated tests
node scripts/test-production-readiness.js
```

**What this tests:**
- ✅ Environment configuration
- ✅ Database connectivity
- ✅ Authentication systems
- ✅ Payment processing
- ✅ Video integration (Daily.co)
- ✅ AI service (DeepSeek)
- ✅ Session management
- ✅ Credit system
- ✅ Therapist system
- ✅ Admin system

### **Expected Results:**
- **90%+ success rate** = Production ready
- **70-89% success rate** = Mostly ready, fix issues
- **<70% success rate** = Not ready, major issues

---

## 🌐 **PHASE 2: MANUAL BROWSER TESTING**

### **Test Environment Setup**
1. **Start your development server:**
   ```bash
   npm run dev
   ```
2. **Open browser:** `http://localhost:3001`
3. **Open Developer Tools:** F12 → Console tab

---

## 👤 **TEST 1: COMPLETE USER JOURNEY**

### **Step 1: User Registration**
1. **Navigate to:** `/login` or `/signup`
2. **Enter email:** `test.user@example.com`
3. **Click:** "Send Magic Link"
4. **Check email** for magic link
5. **Click magic link** to complete registration
6. **✅ Expected:** User gets 1 free credit automatically

### **Step 2: Profile Completion**
1. **Complete user profile** after login
2. **Add medical history, preferences**
3. **Save profile**
4. **✅ Expected:** Profile saves successfully

### **Step 3: Browse & Book Session**
1. **Navigate to booking section**
2. **Browse available therapists**
3. **Select time slot**
4. **Book session using free credit**
5. **✅ Expected:** 25-minute session booked

### **Step 4: Join Video Session**
1. **Wait for session time** (or join 15 minutes early)
2. **Click "Join Session"**
3. **Grant camera/microphone permissions**
4. **✅ Expected:** Video call connects via Daily.co
5. **Test video/audio controls**
6. **End session**

### **Step 5: Check Credit Balance**
1. **Check dashboard** for credit display
2. **✅ Expected:** Shows "0 credits remaining" after booking

---

## 👨‍⚕️ **TEST 2: THERAPIST WORKFLOW**

### **Step 1: Therapist Enrollment**
1. **Navigate to:** `/therapist/enroll`
2. **Submit therapist application:**
   - Full name: `Dr. Test Therapist`
   - Email: `therapist@example.com`
   - Phone: `+2348012345678`
   - Specialization: `Anxiety & Stress Management`
   - Experience: `5 years`
   - Education: `PhD in Clinical Psychology`
   - MDCN Code: `MDCN12345`
   - Bio: `Experienced therapist...`
3. **Upload credentials** (if required)
4. **Submit application**
5. **✅ Expected:** Application submitted, pending approval

### **Step 2: Admin Approval**
1. **Login as admin:** `/admin/login`
2. **Navigate to therapist approvals**

3. **Review therapist application**
4. **Approve the therapist**
5. **✅ Expected:** Therapist can now login

### **Step 3: Therapist Dashboard**
1. **Therapist logs in** via magic link
2. **Check dashboard** for real-time data
3. **✅ Expected:** Shows sessions, earnings, client count

### **Step 4: Set Availability**
1. **Navigate to availability settings**
2. **Set weekly schedule** (e.g., Mon-Fri 9AM-5PM)
3. **Save availability**
4. **✅ Expected:** Time slots appear in user booking system

### **Step 5: Conduct Session**
1. **See user booking** in therapist dashboard
2. **Join video session** at scheduled time
3. **Conduct therapy session**
4. **End session**
5. **✅ Expected:** AI generates SOAP notes automatically

---

## 💳 **TEST 3: PAYMENT SYSTEM**

### **Step 1: Complete Free Session**
1. **Complete the free session** from Test 1
2. **✅ Expected:** Redirected to `/dashboard/continue-journey`

### **Step 2: Purchase Package**
1. **View pricing packages** on continue-journey page
2. **See Bronze (₦13,500), Silver (₦20,000), Gold (₦28,000)**
3. **Click "Buy Bronze Pack"**
4. **✅ Expected:** Redirected to Paystack payment page

### **Step 3: Test Payment (Use Test Mode)**
1. **Use test card:** `4084084084084081`
2. **Complete payment**
3. **✅ Expected:** Payment successful, credits added
4. **Check dashboard** for updated credit balance

### **Step 4: Book Paid Session**
1. **Book new session** with paid credits
2. **✅ Expected:** 35-minute session (longer than free)

---

## 🤖 **TEST 4: AI SOAP NOTES**

### **Step 1: Complete Session with AI**
1. **Complete a therapy session** (from Tests 1-3)
2. **End session** as therapist
3. **✅ Expected:** AI generates SOAP notes automatically

### **Step 2: Review SOAP Notes**
1. **Check session notes** in therapist dashboard
2. **Review generated SOAP notes**
3. **✅ Expected:** Professional SOAP format with S.O.A.P. sections
4. **Edit notes** if needed
5. **Save changes**

---

## 🏢 **TEST 5: PARTNER WORKFLOW**

### **Step 1: Partner Registration**
1. **Navigate to:** `/partner/enroll`
2. **Register as partner organization**
3. **Complete company profile**
4. **✅ Expected:** Partner account created

### **Step 2: Employee Management**
1. **Upload CSV** with employee details
2. **Process bulk upload**
3. **✅ Expected:** Employees receive verification emails
4. **Verify employee accounts**
5. **✅ Expected:** Employees get partner credits

### **Step 3: Employee Session Access**
1. **Employee books session** using partner credits
2. **Complete therapy session**
3. **✅ Expected:** Session tracked for partner reporting

---

## 👑 **TEST 6: ADMIN SYSTEM**

### **Step 1: Admin Access**
1. **Login as admin:** `/admin/login`
2. **Access admin dashboard**
3. **✅ Expected:** Admin dashboard loads with system data

### **Step 2: Therapist Management**
1. **View pending therapist applications**
2. **Approve/reject applications**
3. **✅ Expected:** Therapist status updates

### **Step 3: System Analytics**
1. **View user statistics**
2. **Check session completion rates**
3. **Review revenue metrics**
4. **✅ Expected:** Real-time data displayed

---

## 📱 **TEST 7: MOBILE TESTING**

### **Mobile Browser Testing**
1. **Open on mobile device:** `http://your-ip:3001`
2. **Test user registration flow**
3. **Test video session on mobile**
4. **✅ Expected:** Responsive design, video works

### **Mobile Features**
- Touch interface responsiveness
- Video call quality
- Payment flow on mobile
- Session booking interface

---

## 🔍 **TEST 8: ERROR HANDLING**

### **Test Error Scenarios**
1. **Invalid email format** during registration
2. **Expired magic link**
3. **Payment failure**
4. **Video connection issues**
5. **Session timeout**
6. **✅ Expected:** Graceful error handling, user-friendly messages

---

## 📊 **SUCCESS CRITERIA**

### **✅ MVP is Launch-Ready When:**

1. **All user workflows complete successfully**
2. **Payment system processes test transactions**
3. **Video quality is acceptable for therapy**
4. **AI generates meaningful SOAP notes**
5. **No critical bugs in core functionality**
6. **Mobile experience is functional**
7. **Error handling is graceful**

### **🎯 Key Metrics:**
- **User registration:** 100% success rate
- **Session booking:** 100% success rate
- **Payment processing:** 100% success rate
- **Video calls:** 95%+ connection success
- **AI notes:** 90%+ generation success

---

## 🚨 **CRITICAL ISSUES TO FIX**

### **Before Launch:**
- ❌ Any authentication failures
- ❌ Payment processing errors
- ❌ Video call connection issues
- ❌ AI service failures
- ❌ Database connectivity problems

### **Post-Launch (Can Wait):**
- ⚠️ Email notification delays
- ⚠️ Minor UI improvements
- ⚠️ Performance optimizations

---

## 🎉 **LAUNCH CHECKLIST**

### **Pre-Launch:**
- [ ] Automated tests pass (90%+ success rate)
- [ ] Manual testing complete
- [ ] Payment system tested with real test data
- [ ] Video calls work reliably
- [ ] AI generates SOAP notes
- [ ] Mobile experience tested
- [ ] Error handling verified

### **Launch Day:**
- [ ] Production environment configured
- [ ] Environment variables set
- [ ] Database migrations complete
- [ ] SSL certificates installed
- [ ] Monitoring in place
- [ ] Backup systems ready

---

## 📞 **SUPPORT DURING TESTING**

### **Common Issues & Solutions:**

**🔧 Video not working?**
- Check camera/microphone permissions
- Try different browser (Chrome recommended)
- Check network connection
- Verify Daily.co API key

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

## 🎯 **FINAL ASSESSMENT**

**Your platform is ready for launch when:**
- ✅ All automated tests pass
- ✅ Manual testing complete
- ✅ Real payment processing works
- ✅ Video therapy sessions function
- ✅ AI generates professional notes
- ✅ No critical bugs remain

**🚀 Ready to launch your therapy platform!**
