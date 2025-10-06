# 🧪 **COMPLETE END-TO-END TESTING GUIDE**

## **🎯 TESTING OVERVIEW**

This guide will walk you through testing the complete therapy platform flow from booking to post-session feedback.

### **Test Users Available:**
- **Patient**: `obgynect@gmail.com` (Ajayi Adenike)
- **Therapist**: `michaelasereo@gmail.com` (Dr Adelabu Yusuf)
- **Admin**: `asereopeyemimichael@gmail.com`

### **Existing Sessions:**
- 4 completed sessions available for testing post-session flows
- Session ID: `13480a74-71b6-470e-94eb-e446d77b76b8` (most recent)

---

## **📋 PHASE 1: BOOKING FLOW TEST**

### **Step 1: Access Booking**
1. **Open Browser**: Go to `http://localhost:3000`
2. **Login as Patient**: 
   - Email: `obgynect@gmail.com`
   - Click "Login" → "Send Magic Link"
   - Check email for magic link
3. **Navigate to Booking**: 
   - Dashboard → "Book Session" button
   - OR direct URL: `http://localhost:3000/dashboard/book`

### **Step 2: Complete Booking Steps**
1. **Step 1 - Patient Biodata**:
   - Fill out personal information
   - Emergency contact details
   - Click "Next"

2. **Step 2 - Therapist Selection**:
   - Select Dr Adelabu Yusuf
   - Review therapist profile
   - Click "Next"

3. **Step 3 - Time Selection**:
   - Choose available time slot
   - Confirm session details
   - Click "Book Session"

### **Expected Results:**
- ✅ Session created successfully
- ✅ Daily.co room generated
- ✅ Confirmation email sent
- ✅ Session appears in dashboard

---

## **📋 PHASE 2: PRE-SESSION PREPARATION**

### **Step 3: Verify Session Creation**
1. **Check Dashboard**:
   - Go to `http://localhost:3000/dashboard`
   - Verify new session appears in "Upcoming Sessions"
   - Check session details and time

2. **Test Session Details Page**:
   - Click on the session to view details
   - Verify room URL and meeting details
   - Check "Join Session" button is available

### **Expected Results:**
- ✅ Session visible in dashboard
- ✅ Correct therapist and timing
- ✅ Daily.co room URL generated
- ✅ Join button available

---

## **📋 PHASE 3: VIDEO SESSION TEST**

### **Step 4: Join Session (Patient)**
1. **Access Session**:
   - Go to session details page
   - Click "Join Session" button
   - Verify redirect to video interface

2. **Test Video Interface**:
   - Allow camera/microphone permissions
   - Verify Daily.co iframe loads
   - Test audio/video controls
   - Test screen sharing (if available)

### **Step 5: Join Session (Therapist)**
1. **Login as Therapist**:
   - Email: `michaelasereo@gmail.com`
   - Use magic link authentication
   - Navigate to therapist dashboard

2. **Access Session**:
   - Go to "Client Sessions" or "Video Call"
   - Find the patient's session
   - Click "Join Session"

### **Expected Results:**
- ✅ Both users can join video call
- ✅ Audio/video working properly
- ✅ Daily.co interface functional
- ✅ Session timer active

---

## **📋 PHASE 4: IN-SESSION FEATURES**

### **Step 6: Test Session Features**
1. **Audio Recording**:
   - Click "Start Recording" button
   - Speak for 10-15 seconds
   - Stop recording
   - Verify transcription appears

2. **Session Notes (Therapist)**:
   - Open notes panel
   - Add session notes
   - Add progress notes
   - Save notes

3. **Chat Feature**:
   - Send messages between users
   - Verify real-time chat works

### **Expected Results:**
- ✅ Recording captures audio
- ✅ Transcription generated
- ✅ Notes saved successfully
- ✅ Chat messages delivered

---

## **📋 PHASE 5: SESSION COMPLETION**

### **Step 7: End Session**
1. **Complete Session**:
   - Click "End Session" button
   - Confirm session completion
   - Verify redirect to dashboard

2. **Check Session Status**:
   - Session status changes to "completed"
   - Session moves to "Past Sessions"
   - SOAP notes generated (if AI enabled)

### **Expected Results:**
- ✅ Session marked as completed
- ✅ Status updated in database
- ✅ SOAP notes generated
- ✅ Redirect to dashboard

---

## **📋 PHASE 6: POST-SESSION FEEDBACK**

### **Step 8: User Feedback (Patient)**
1. **Access Session Details**:
   - Go to "Sessions" page
   - Click on completed session
   - Navigate to session details page

2. **Submit Feedback**:
   - Rate session (1-5 stars)
   - Add optional comments
   - Click "Submit Feedback"

### **Expected Results:**
- ✅ Feedback form appears
- ✅ Rating system works
- ✅ Comments saved
- ✅ Confirmation message shown

### **Step 9: View Session Notes (Patient)**
1. **Check Notes Display**:
   - View therapist notes (if visible to patient)
   - Check SOAP notes display
   - Verify session summary

### **Expected Results:**
- ✅ Notes display correctly
- ✅ Proper visibility rules applied
- ✅ Professional formatting

---

## **📋 PHASE 7: THERAPIST POST-SESSION**

### **Step 10: Therapist Notes Review**
1. **Login as Therapist**:
   - Access therapist dashboard
   - Go to "Client Sessions"
   - Find completed session

2. **Review and Edit Notes**:
   - Check AI-generated SOAP notes
   - Edit or add additional notes
   - Verify notes saved

### **Expected Results:**
- ✅ SOAP notes generated
- ✅ Notes editable by therapist
- ✅ Changes saved successfully

---

## **📋 PHASE 8: PAYMENT & CREDITS TEST**

### **Step 11: Payment Flow**
1. **Check Credits**:
   - Go to "Credits" or "Billing" section
   - Verify credit deduction
   - Check payment history

2. **Purchase Credits** (if needed):
   - Navigate to credit purchase
   - Test payment integration
   - Verify credit addition

### **Expected Results:**
- ✅ Credits deducted after session
- ✅ Payment history updated
- ✅ Credit purchase works

---

## **🔧 TESTING TOOLS & DEBUGGING**

### **Browser Developer Tools**
1. **Console Logs**:
   - Open DevTools (F12)
   - Check for errors in Console tab
   - Monitor network requests

2. **Network Tab**:
   - Verify API calls succeed
   - Check response times
   - Monitor for failed requests

### **Database Verification**
```bash
# Check session status
curl -X GET "http://localhost:3000/api/sessions?user_id=5803b951-f0b4-462c-b1d9-7bab27dfc5f7"

# Check session notes
curl -X GET "http://localhost:3000/api/sessions/13480a74-71b6-470e-94eb-e446d77b76b8/notes"

# Check feedback
curl -X GET "http://localhost:3000/api/sessions/feedback?sessionId=13480a74-71b6-470e-94eb-e446d77b76b8"
```

### **Common Issues & Solutions**
1. **Video Not Loading**: Check Daily.co API key and room creation
2. **Authentication Errors**: Verify session cookies and magic links
3. **Notes Not Saving**: Check database permissions and API routes
4. **Payment Issues**: Verify Stripe integration and webhook setup

---

## **📊 SUCCESS CRITERIA**

### **Complete Flow Success:**
- ✅ Session booking works end-to-end
- ✅ Video session functional
- ✅ Recording and transcription working
- ✅ Post-session feedback system functional
- ✅ Notes management working
- ✅ Payment/credits system functional
- ✅ All user roles (patient, therapist) can access appropriate features

### **Performance Targets:**
- Session booking: < 30 seconds
- Video join: < 10 seconds
- Note saving: < 5 seconds
- Feedback submission: < 3 seconds

---

## **🚀 NEXT STEPS**

After successful testing:
1. **Document Issues**: Note any bugs or improvements needed
2. **Performance Optimization**: Optimize slow API calls
3. **User Experience**: Improve UI/UX based on testing
4. **Production Deployment**: Deploy to production environment

---

**Happy Testing! 🎉**
