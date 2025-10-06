# 🧪 **MANUAL END-TO-END TESTING GUIDE**

## **🎯 TESTING SETUP**

### **Available Test Data:**
- **Patient**: `obgynect@gmail.com` (Ajayi Adenike) - ID: `5803b951-f0b4-462c-b1d9-7bab27dfc5f7`
- **Therapist**: `michaelasereo@gmail.com` (Dr Adelabu Yusuf) - ID: `9412940e-8445-4903-a6a2-16009ecebb36`
- **Existing Session**: `13480a74-71b6-470e-94eb-e446d77b76b8` (completed)

### **Application URLs:**
- **Main App**: http://localhost:3000
- **Patient Dashboard**: http://localhost:3000/dashboard
- **Therapist Dashboard**: http://localhost:3000/therapist/dashboard
- **Session Details**: http://localhost:3000/dashboard/sessions/13480a74-71b6-470e-94eb-e446d77b76b8

---

## **📋 PHASE 1: AUTHENTICATION & LOGIN TEST**

### **Step 1: Patient Login**
1. **Open Browser**: Go to http://localhost:3000
2. **Click Login**: Enter email `obgynect@gmail.com`
3. **Send Magic Link**: Click "Send Magic Link"
4. **Check Email**: Look for magic link email
5. **Click Magic Link**: Complete authentication
6. **Verify Dashboard**: Should redirect to patient dashboard

**Expected Results:**
- ✅ Magic link email received
- ✅ Authentication successful
- ✅ Dashboard loads with user data
- ✅ Session count shows 4 sessions

### **Step 2: Therapist Login**
1. **Open New Tab**: Go to http://localhost:3000/therapist/login
2. **Enter Email**: `michaelasereo@gmail.com`
3. **Send Magic Link**: Click "Send Magic Link"
4. **Check Email**: Look for therapist magic link
5. **Click Magic Link**: Complete authentication
6. **Verify Dashboard**: Should redirect to therapist dashboard

**Expected Results:**
- ✅ Therapist magic link received
- ✅ Therapist dashboard loads
- ✅ Client sessions visible

---

## **📋 PHASE 2: SESSION HISTORY & DETAILS TEST**

### **Step 3: View Session History (Patient)**
1. **Navigate to Sessions**: Dashboard → "Sessions" or direct URL
2. **View Session List**: Should show 4 completed sessions
3. **Check Session Cards**: Each session should show:
   - Therapist name: "Dr Adelabu Yusuf"
   - Session date and time
   - Status: "Completed"
   - "Click to view details" indicator

### **Step 4: View Session Details**
1. **Click on Session**: Click on the most recent session
2. **Verify Details Page**: Should show:
   - Session overview with therapist info
   - Session timing and duration
   - Video session link (if available)
   - Session ID display

**Expected Results:**
- ✅ Session list displays correctly
- ✅ Clickable sessions work
- ✅ Session details page loads
- ✅ All session information visible

---

## **📋 PHASE 3: POST-SESSION FEEDBACK TEST**

### **Step 5: Submit Session Feedback**
1. **On Session Details Page**: Scroll to feedback section
2. **Rate Session**: Click on 5 stars
3. **Add Comment**: Type "Excellent session! Very helpful."
4. **Submit Feedback**: Click "Submit Feedback"

**Expected Results:**
- ✅ Rating system works (stars light up)
- ✅ Comment field accepts text
- ✅ Submit button works
- ✅ Success message appears
- ✅ Feedback form disappears after submission

### **Step 6: Verify Feedback Submission**
1. **Refresh Page**: Check if feedback was saved
2. **Check Database**: Verify feedback appears in system

**Expected Results:**
- ✅ Feedback persists after page refresh
- ✅ Thank you message displays

---

## **📋 PHASE 4: SESSION NOTES TEST**

### **Step 7: View Session Notes (Patient)**
1. **On Session Details Page**: Look for "Session Notes" section
2. **Check Note Types**: Should see:
   - Therapist Notes (if any)
   - SOAP Notes (if generated)
   - Progress Notes
   - Homework Assigned
   - Next Session Focus

**Expected Results:**
- ✅ Notes section displays
- ✅ Proper formatting and colors
- ✅ "No notes available" if none exist

### **Step 8: Test Notes as Therapist**
1. **Login as Therapist**: Use therapist credentials
2. **Navigate to Sessions**: Find the same session
3. **View/Edit Notes**: Check if therapist can see/edit notes

**Expected Results:**
- ✅ Therapist can view session notes
- ✅ Therapist can edit notes (if permissions allow)

---

## **📋 PHASE 5: BOOKING FLOW TEST**

### **Step 9: Create New Booking (Patient)**
1. **Go to Dashboard**: Click "Book Session" button
2. **Step 1 - Patient Info**: Fill out biodata form
3. **Step 2 - Select Therapist**: Choose Dr Adelabu Yusuf
4. **Step 3 - Time Selection**: Pick available time slot
5. **Complete Booking**: Confirm and book session

**Expected Results:**
- ✅ Booking form works
- ✅ Therapist selection works
- ✅ Time slots display correctly
- ✅ Booking confirmation appears
- ✅ New session appears in dashboard

### **Step 10: Verify Booking**
1. **Check Dashboard**: New session should appear
2. **Check Session Details**: Verify booking information
3. **Check Daily.co Room**: Room URL should be generated

**Expected Results:**
- ✅ Session appears in upcoming sessions
- ✅ Correct therapist and timing
- ✅ Daily.co room URL generated
- ✅ Join button available

---

## **📋 PHASE 6: VIDEO SESSION TEST**

### **Step 11: Join Session (Patient)**
1. **Find New Session**: In upcoming sessions
2. **Click Join Session**: Should redirect to video interface
3. **Allow Permissions**: Camera and microphone access
4. **Test Video Interface**: Verify Daily.co loads

**Expected Results:**
- ✅ Redirect to video interface
- ✅ Daily.co iframe loads
- ✅ Camera/microphone permissions work
- ✅ Video controls visible

### **Step 12: Join Session (Therapist)**
1. **Login as Therapist**: Use therapist credentials
2. **Find Patient Session**: In client sessions
3. **Click Join Session**: Should join same room
4. **Test Video Call**: Both users in same room

**Expected Results:**
- ✅ Both users can join
- ✅ Video call works
- ✅ Audio/video controls functional
- ✅ Session timer active

---

## **📋 PHASE 7: IN-SESSION FEATURES**

### **Step 13: Test Session Features**
1. **Audio Recording**: Click record button
2. **Session Notes**: Add notes during session
3. **Chat Feature**: Send messages between users
4. **Screen Sharing**: Test if available

**Expected Results:**
- ✅ Recording starts/stops
- ✅ Notes save during session
- ✅ Chat messages work
- ✅ Screen sharing functional (if available)

### **Step 14: End Session**
1. **Click End Session**: From either user
2. **Confirm Completion**: Confirm session end
3. **Check Status**: Session should be marked completed

**Expected Results:**
- ✅ Session ends successfully
- ✅ Status changes to "completed"
- ✅ Redirect to dashboard
- ✅ Session moves to past sessions

---

## **📋 PHASE 8: POST-SESSION WORKFLOW**

### **Step 15: SOAP Notes Generation**
1. **Check Session Details**: After session completion
2. **Look for SOAP Notes**: AI-generated notes should appear
3. **Verify Content**: Notes should be relevant to session

**Expected Results:**
- ✅ SOAP notes generated automatically
- ✅ Notes contain relevant information
- ✅ Professional formatting

### **Step 16: Complete Post-Session Flow**
1. **Patient Feedback**: Rate and comment on session
2. **Therapist Notes**: Add/edit session notes
3. **Verify Data**: Check all information saved

**Expected Results:**
- ✅ Feedback system works
- ✅ Notes save correctly
- ✅ All data persists

---

## **🔧 DEBUGGING TOOLS**

### **Browser Developer Tools**
1. **Open DevTools**: F12 or right-click → Inspect
2. **Console Tab**: Check for JavaScript errors
3. **Network Tab**: Monitor API calls
4. **Application Tab**: Check cookies and storage

### **API Testing Commands**
```bash
# Test session details
curl -X GET "http://localhost:3000/api/sessions/13480a74-71b6-470e-94eb-e446d77b76b8"

# Test session notes
curl -X GET "http://localhost:3000/api/sessions/13480a74-71b6-470e-94eb-e446d77b76b8/notes"

# Test feedback
curl -X POST "http://localhost:3000/api/sessions/feedback" \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"13480a74-71b6-470e-94eb-e446d77b76b8","rating":5,"comment":"Test"}'
```

### **Common Issues & Solutions**
1. **Authentication Issues**: Clear cookies and try again
2. **Video Not Loading**: Check Daily.co API key
3. **Notes Not Saving**: Check database permissions
4. **Magic Link Issues**: Check email delivery

---

## **📊 SUCCESS CRITERIA**

### **Complete Flow Success:**
- ✅ Authentication works for both user types
- ✅ Session history displays correctly
- ✅ Session details page functional
- ✅ Feedback system works
- ✅ Booking flow complete
- ✅ Video session functional
- ✅ Post-session workflow complete
- ✅ Notes management working

### **Performance Targets:**
- Page load times: < 3 seconds
- API responses: < 1 second
- Video join time: < 10 seconds
- Note saving: < 2 seconds

---

## **🚀 NEXT STEPS**

After successful testing:
1. **Document Issues**: Note any bugs found
2. **Performance Optimization**: Address slow areas
3. **User Experience**: Improve based on testing
4. **Production Deployment**: Deploy to production

---

**Happy Testing! 🎉**

**Remember**: Take screenshots of any issues and note the exact steps to reproduce them.
