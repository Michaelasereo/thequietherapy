


# Complete Therapy Session Workflow Testing Guide

## Overview
This guide provides comprehensive testing for the full therapy session workflow from user booking to AI notes generation.

## Workflow Components

### 1. User Booking Flow
- **Patient Registration/Login**: Magic link authentication
- **Biodata Collection**: Personal and medical information
- **Therapist Selection**: Browse and select available therapists
- **Time Slot Booking**: Choose available time slots
- **Session Confirmation**: Final booking confirmation

### 2. Therapist Management
- **Therapist Enrollment**: Registration and verification process
- **Availability Management**: Set available time slots
- **Session Management**: View and manage client sessions
- **Client Management**: Access client information and history

### 3. Video Session
- **Session Joining**: Both patient and therapist join video call
- **Daily.co Integration**: Video call functionality
- **Session Controls**: Timer, recording, controls
- **Session Completion**: End session and save data

### 4. AI Notes Generation
- **Session Processing**: AI analysis of session content
- **SOAP Notes**: Automated clinical notes generation
- **Session Summary**: Key insights and recommendations

## Testing Scenarios

### Scenario 1: Complete Patient Journey
1. **Patient Registration**
   - Visit `/login`
   - Enter email and request magic link
   - Check email and click magic link
   - Verify successful login to dashboard

2. **Biodata Collection**
   - Navigate to booking flow
   - Fill out personal information
   - Complete medical history
   - Submit biodata form

3. **Therapist Selection**
   - Browse available therapists
   - View therapist profiles and specializations
   - Select preferred therapist

4. **Time Slot Booking**
   - View therapist availability
   - Select preferred time slot
   - Confirm booking details
   - Complete booking process

5. **Session Management**
   - View upcoming sessions in dashboard
   - Join session when time arrives
   - Complete video session
   - View session history

### Scenario 2: Complete Therapist Journey
1. **Therapist Enrollment**
   - Visit `/therapist/enroll`
   - Complete enrollment form
   - Upload verification documents
   - Submit for approval

2. **Therapist Dashboard**
   - Login to therapist dashboard
   - View client list and sessions
   - Manage availability schedule
   - Access client medical history

3. **Session Management**
   - View upcoming sessions
   - Join video sessions with clients
   - Complete session notes
   - Generate AI-powered insights

### Scenario 3: Video Session Testing
1. **Session Preparation**
   - Both patient and therapist logged in
   - Session scheduled and confirmed
   - Room URL generated

2. **Session Execution**
   - Patient joins video session
   - Therapist joins video session
   - Video/audio functionality works
   - Session timer active
   - Recording functionality (if enabled)

3. **Session Completion**
   - Session ends (manual or automatic)
   - Session data saved
   - Status updated to completed

### Scenario 4: AI Notes Generation
1. **Session Data Collection**
   - Session recording available
   - Session notes captured
   - Patient information accessible

2. **AI Processing**
   - Session data sent to AI processing
   - SOAP notes generated
   - Clinical insights extracted
   - Recommendations provided

3. **Notes Review**
   - Therapist reviews AI-generated notes
   - Edits or approves notes
   - Notes saved to patient record

## API Endpoints to Test

### Authentication
- `POST /api/auth/magic-link` - Request magic link
- `GET /api/auth/verify-magic-link` - Verify magic link
- `GET /api/auth/me` - Get current user

### Session Management
- `GET /api/sessions` - Get user sessions
- `POST /api/sessions/join` - Join a session
- `POST /api/sessions` - Complete/cancel session
- `GET /api/sessions/upcoming` - Get upcoming session

### Therapist APIs
- `GET /api/therapist/dashboard-data` - Therapist dashboard
- `GET /api/therapist/clients` - Get therapist clients
- `GET /api/therapist/sessions` - Get therapist sessions

### Video Integration
- `POST /api/daily/create-room` - Create video room
- `POST /api/daily/token` - Generate meeting token
- `POST /api/daily/start-recording` - Start recording
- `POST /api/daily/stop-recording` - Stop recording

### AI Processing
- `POST /api/ai/process-session` - Process session for AI notes
- `GET /api/session-notes` - Get session notes

## Test Data Setup

### Test Users
```javascript
// Patient test user
const testPatient = {
  email: "patient@test.com",
  name: "Test Patient",
  user_type: "individual"
}

// Therapist test user
const testTherapist = {
  email: "therapist@test.com", 
  name: "Test Therapist",
  user_type: "therapist",
  mdcn_code: "MDCN12345"
}
```

### Test Session
```javascript
const testSession = {
  user_id: "patient_user_id",
  therapist_id: "therapist_user_id", 
  scheduled_date: "2024-01-15",
  scheduled_time: "14:00:00",
  duration_minutes: 60,
  status: "scheduled"
}
```

## Manual Testing Steps

### Step 1: Environment Setup
1. Start development server: `npm run dev`
2. Ensure database is properly configured
3. Verify all environment variables are set
4. Check Daily.co integration is working

### Step 2: Patient Flow Testing
1. **Registration & Login**
   - Open browser to `http://localhost:3000/login`
   - Enter test patient email
   - Check email for magic link
   - Click magic link and verify login

2. **Biodata Collection**
   - Navigate to booking flow
   - Fill out all required fields
   - Submit and verify data is saved

3. **Therapist Selection**
   - Browse available therapists
   - Select a therapist
   - Verify therapist details are displayed

4. **Time Slot Booking**
   - View therapist availability
   - Select a time slot
   - Complete booking process
   - Verify session is created

### Step 3: Therapist Flow Testing
1. **Therapist Login**
   - Open new browser tab
   - Login as therapist
   - Verify therapist dashboard loads

2. **Session Management**
   - View upcoming sessions
   - Verify patient information is accessible
   - Check session details

### Step 4: Video Session Testing
1. **Session Preparation**
   - Both users logged in
   - Session time arrives
   - Both users navigate to session

2. **Video Call Testing**
   - Patient joins video session
   - Therapist joins video session
   - Test video/audio functionality
   - Verify session timer works
   - Test session controls

3. **Session Completion**
   - End session (manual or automatic)
   - Verify session status updates
   - Check session data is saved

### Step 5: AI Notes Testing
1. **Session Processing**
   - Wait for session completion
   - Check if AI processing is triggered
   - Verify session data is sent for processing

2. **Notes Review**
   - Therapist reviews AI-generated notes
   - Verify notes are accurate and helpful
   - Test note editing functionality

## Automated Testing Script

```javascript
// test-therapy-workflow.js
const testTherapyWorkflow = async () => {
  console.log('🧪 Starting Therapy Workflow Test...');
  
  // Test 1: Patient Registration
  console.log('1. Testing Patient Registration...');
  const patientAuth = await testPatientAuth();
  console.log('✅ Patient auth:', patientAuth.success);
  
  // Test 2: Therapist Registration  
  console.log('2. Testing Therapist Registration...');
  const therapistAuth = await testTherapistAuth();
  console.log('✅ Therapist auth:', therapistAuth.success);
  
  // Test 3: Session Booking
  console.log('3. Testing Session Booking...');
  const booking = await testSessionBooking();
  console.log('✅ Session booking:', booking.success);
  
  // Test 4: Video Session
  console.log('4. Testing Video Session...');
  const videoSession = await testVideoSession();
  console.log('✅ Video session:', videoSession.success);
  
  // Test 5: AI Notes
  console.log('5. Testing AI Notes...');
  const aiNotes = await testAINotes();
  console.log('✅ AI notes:', aiNotes.success);
  
  console.log('🎉 Therapy Workflow Test Complete!');
};

// Run the test
testTherapyWorkflow();
```

## Troubleshooting Common Issues

### Authentication Issues
- Check magic link emails are being sent
- Verify email templates are working
- Check session cookies are being set
- Verify user types are correct

### Video Session Issues
- Check Daily.co API keys are configured
- Verify room creation is working
- Test meeting token generation
- Check iframe permissions

### AI Notes Issues
- Verify AI processing API is working
- Check session data is being captured
- Verify notes generation is triggered
- Test notes display and editing

### Database Issues
- Check session data is being saved
- Verify user relationships are correct
- Check status updates are working
- Verify data consistency

## Success Criteria

### Patient Experience
- ✅ Can register and login successfully
- ✅ Can complete biodata collection
- ✅ Can browse and select therapists
- ✅ Can book available time slots
- ✅ Can join video sessions
- ✅ Can view session history

### Therapist Experience
- ✅ Can enroll and get approved
- ✅ Can manage availability schedule
- ✅ Can view client information
- ✅ Can join video sessions
- ✅ Can access AI-generated notes
- ✅ Can manage client sessions

### Technical Requirements
- ✅ Video calls work reliably
- ✅ Session data is properly saved
- ✅ AI notes are generated accurately
- ✅ Authentication is secure
- ✅ Database operations are consistent
- ✅ Error handling is robust

## Next Steps

1. **Run Manual Tests**: Follow the manual testing steps above
2. **Create Test Data**: Set up test users and sessions
3. **Execute Automated Tests**: Run the testing script
4. **Document Issues**: Record any problems found
5. **Fix Issues**: Address any bugs or problems
6. **Re-test**: Verify fixes work correctly
7. **Performance Testing**: Test under load
8. **Security Testing**: Verify security measures
9. **User Acceptance**: Get feedback from real users
10. **Production Deployment**: Deploy to production environment
