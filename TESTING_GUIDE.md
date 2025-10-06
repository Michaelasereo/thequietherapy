# 🧪 Complete User Journey Testing Guide

## Overview
This guide will walk you through testing the complete user flow from booking a therapy session to completing the video session.

## Prerequisites
1. ✅ Development server running (`npm run dev`)
2. ✅ Database with proper schema and indexes
3. ✅ All security fixes applied
4. ✅ Test script loaded in browser

## 🚀 Step-by-Step Testing Process

### Phase 1: Setup & Authentication

1. **Open your application**
   ```
   http://localhost:3000
   ```

2. **Load the test script**
   - Open Developer Tools (F12)
   - Go to Console tab
   - Copy and paste the contents of `test-complete-user-journey.js`
   - You should see: "🧪 USER JOURNEY TEST LOADED!"

3. **Login as a user**
   - Navigate to `/login`
   - Use magic link authentication
   - Verify you're logged in and redirected to dashboard

### Phase 2: Session Booking Flow

4. **Test the booking process**
   - Navigate to the booking section of your dashboard
   - OR run in console: `testSessionBooking()`
   
5. **Book a session manually through UI:**
   - Select a therapist
   - Choose a date/time slot
   - Fill in session details
   - Confirm booking
   - Verify success message

### Phase 3: Pre-Session

6. **Check upcoming sessions**
   - Run in console: `testUpcomingSession()`
   - OR navigate to dashboard and verify upcoming session shows
   - Note the session ID and join details

### Phase 4: Video Session

7. **Join the video session**
   - Click "Join Session" button on dashboard
   - OR navigate to `/video-session/[sessionId]`
   - Grant camera/microphone permissions when prompted
   - Test video controls (mute, camera toggle, screen share)

8. **Simulate session conversation**
   - Have a brief test conversation
   - Use the chat feature if available
   - Test ending the session

### Phase 5: Post-Session

9. **Test AI processing**
   - Run in console: `testSessionCompletion('[your-session-id]')`
   - This will test SOAP notes generation
   - Verify the AI generates appropriate session notes

10. **Check session history**
    - Navigate to session history
    - Verify the completed session appears
    - Check that SOAP notes are attached

## 🧪 Automated Testing Commands

Run these in the browser console:

### Complete Journey Test
```javascript
testCompleteUserJourney()
```

### Individual Component Tests
```javascript
// Test authentication
testUserAuthentication()

// Test booking
testSessionBooking()

// Test upcoming sessions
testUpcomingSession()

// Test video session capabilities
testVideoSessionJoin('session-id-here')

// Test AI processing
testSessionCompletion('session-id-here')
```

### Security Tests
```javascript
testSecurityFixes()
```

## 🔍 What to Look For

### ✅ Success Indicators
- User can login successfully
- Sessions can be booked without errors
- Upcoming sessions display correctly
- Video session loads and camera/mic work
- AI generates SOAP notes
- Session appears in history
- All API calls return 200 status codes
- Security tests pass (401 errors for unauthenticated requests)

### ❌ Failure Indicators
- 401/403 errors for authenticated users
- Sessions not appearing in dashboard
- Video session fails to initialize
- AI processing returns errors
- Database connection issues
- Missing or corrupted session data

## 🐛 Common Issues & Solutions

### Authentication Issues
- **Problem**: "Authentication required" errors
- **Solution**: Ensure you're logged in and cookies are set
- **Test**: Run `testUserAuthentication()` to verify auth status

### Booking Issues
- **Problem**: Session booking fails
- **Solution**: Check database schema, verify therapist exists
- **Test**: Check browser network tab for API errors

### Video Session Issues
- **Problem**: Camera/mic not working
- **Solution**: Grant browser permissions, check HTTPS
- **Test**: Run `testVideoSessionJoin()` to check WebRTC support

### AI Processing Issues
- **Problem**: SOAP notes not generating
- **Solution**: Check AI service configuration, API keys
- **Test**: Run `testSessionCompletion()` with sample data

## 📊 Expected Test Results

When running `testCompleteUserJourney()`, you should see:

```
🚀 STARTING COMPLETE USER JOURNEY TEST
=====================================
🧪 STEP 1: Testing User Authentication
✅ Already authenticated as: user@example.com
🧪 STEP 2: Testing Session Booking
✅ Session booked successfully! Session ID: abc123
🧪 STEP 3: Testing Upcoming Session Retrieval
✅ Found upcoming session: abc123
🧪 STEP 4: Testing Video Session Join
✅ Video session component found on page
✅ WebRTC getUserMedia is supported
🧪 STEP 5: Testing Session Completion & AI Processing
✅ AI processing completed successfully!
✅ Found 3 sessions in history

🎉 COMPLETE USER JOURNEY TEST PASSED!
=====================================
```

## 🔒 Security Validation

The security tests should show:
```
🔒 TESTING SECURITY FIXES
========================
✅ Authentication bypass prevented ✓
✅ Session data properly isolated to authenticated user ✓
✅ Security tests completed!
```

## 📝 Manual Testing Checklist

- [ ] User can register/login with magic link
- [ ] Dashboard loads with user data
- [ ] Available therapists/slots display
- [ ] Session booking works end-to-end
- [ ] Upcoming session shows on dashboard
- [ ] "Join Session" button appears at session time
- [ ] Video session initializes properly
- [ ] Camera and microphone work
- [ ] Session can be ended
- [ ] AI generates SOAP notes
- [ ] Session appears in history with notes
- [ ] User can logout successfully

## 🚨 Critical Security Tests

- [ ] Unauthenticated users get 401 errors
- [ ] Users can only see their own sessions
- [ ] Session data is not leaked between users
- [ ] Admin endpoints require admin access
- [ ] Therapist endpoints require therapist access

---

## 🎯 Success Criteria

The user journey is successful when:
1. **Authentication works** - Users can login and maintain session
2. **Booking works** - Sessions can be scheduled without errors
3. **Video works** - WebRTC connections establish properly
4. **AI works** - SOAP notes generate from session transcripts
5. **Security works** - Unauthorized access is prevented
6. **Data integrity** - User data is isolated and protected

Run the complete test suite and verify all steps pass before considering the application production-ready!
