# Manual Therapy Session Workflow Testing Guide

## Prerequisites

1. **Development Environment Setup**
   ```bash
   npm run dev
   # Server should be running on http://localhost:3000
   ```

2. **Database Setup**
   - Ensure Supabase is configured
   - Run any necessary database migrations
   - Verify all tables exist

3. **External Services**
   - Daily.co API key configured
   - Email service configured (for magic links)
   - AI service configured (for notes generation)

## Test Scenarios

### Scenario 1: Complete Patient Journey

#### Step 1: Patient Registration & Login
1. **Open Browser** → Navigate to `http://localhost:3000/login`
2. **Enter Email** → Use test email: `patient@test.com`
3. **Request Magic Link** → Click "Send Magic Link"
4. **Check Email** → Look for magic link email
5. **Click Magic Link** → Verify redirect to dashboard
6. **Verify Login** → Should see patient dashboard

**Expected Result**: Patient successfully logged in and redirected to dashboard

#### Step 2: Biodata Collection
1. **Navigate to Booking** → Click "Book Session" or similar
2. **Fill Personal Information**:
   - Full Name: "Test Patient"
   - Age: "30"
   - Gender: "Male"
   - Phone: "+2348012345678"
   - Address: "123 Test Street, Lagos"
3. **Fill Medical Information**:
   - Medical History: "None"
   - Current Medications: "None"
   - Allergies: "None"
   - Mental Health History: "Anxiety"
4. **Submit Form** → Click "Continue"

**Expected Result**: Biodata saved and user proceeds to therapist selection

#### Step 3: Therapist Selection
1. **Browse Therapists** → View available therapists
2. **Select Therapist** → Click on preferred therapist
3. **View Profile** → Check therapist details, specializations
4. **Confirm Selection** → Click "Select This Therapist"

**Expected Result**: Therapist selected and user proceeds to time slot selection

#### Step 4: Time Slot Booking
1. **View Availability** → See therapist's available time slots
2. **Select Time Slot** → Choose preferred date and time
3. **Confirm Booking** → Review booking details
4. **Complete Booking** → Click "Book Session"

**Expected Result**: Session booked successfully, confirmation message shown

#### Step 5: Session Management
1. **View Dashboard** → Check upcoming sessions
2. **Session Details** → Verify session information
3. **Join Session** → When session time arrives, click "Join Session"
4. **Video Session** → Test video call functionality
5. **End Session** → Complete the session

**Expected Result**: Session completed successfully, status updated

### Scenario 2: Complete Therapist Journey

#### Step 1: Therapist Enrollment
1. **Navigate to Enrollment** → Go to `/therapist/enroll`
2. **Fill Basic Details**:
   - Full Name: "Dr. Test Therapist"
   - Email: "therapist@test.com"
   - Phone: "+2348012345679"
   - MDCN Code: "MDCN12345"
3. **Upload Documents** → Upload ID and certificate
4. **Select Specializations** → Choose "CBT", "Anxiety", "Depression"
5. **Select Languages** → Choose "English", "Yoruba"
6. **Accept Terms** → Check terms and conditions
7. **Submit Application** → Click "Submit Application"

**Expected Result**: Application submitted, confirmation email sent

#### Step 2: Therapist Login
1. **Request Magic Link** → Enter therapist email
2. **Check Email** → Look for magic link
3. **Click Magic Link** → Verify redirect to therapist dashboard
4. **Verify Access** → Should see therapist dashboard

**Expected Result**: Therapist successfully logged in

#### Step 3: Set Availability
1. **Navigate to Availability** → Go to availability management
2. **Set Schedule** → Choose available days and times
3. **Save Schedule** → Click "Save Availability"
4. **Verify Schedule** → Check availability is saved

**Expected Result**: Availability schedule set and saved

#### Step 4: Manage Sessions
1. **View Upcoming Sessions** → Check scheduled sessions
2. **View Client Details** → Click on client to see information
3. **Join Session** → When session time arrives, join video call
4. **Conduct Session** → Test video call with client
5. **Complete Session** → End session and add notes

**Expected Result**: Session conducted successfully, notes saved

### Scenario 3: Video Session Testing

#### Step 1: Session Preparation
1. **Both Users Logged In** → Patient and therapist both logged in
2. **Session Scheduled** → Ensure session is in "scheduled" status
3. **Room URL Generated** → Check that room URL is available

#### Step 2: Join Session (Patient)
1. **Navigate to Session** → Go to session page
2. **Click "Join Session"** → Should open video interface
3. **Allow Camera/Microphone** → Grant browser permissions
4. **Verify Video/Audio** → Check that video and audio work
5. **Test Controls** → Test mute, camera toggle, etc.

#### Step 3: Join Session (Therapist)
1. **Open New Browser Tab** → Login as therapist
2. **Navigate to Session** → Go to therapist session page
3. **Click "Join Session"** → Should open video interface
4. **Allow Camera/Microphone** → Grant browser permissions
5. **Verify Connection** → Check that both users can see each other

#### Step 4: Session Controls
1. **Test Timer** → Verify session timer is running
2. **Test Recording** → If enabled, test recording functionality
3. **Test Chat** → If available, test text chat
4. **Test Screen Share** → If available, test screen sharing

#### Step 5: End Session
1. **End Session** → Click "End Session" or wait for timer
2. **Confirm End** → Confirm session termination
3. **Verify Status Update** → Check session status is updated
4. **Check Session Data** → Verify session data is saved

**Expected Result**: Video session works properly, data is saved

### Scenario 4: AI Notes Generation

#### Step 1: Session Data Collection
1. **Complete Session** → Ensure session is completed
2. **Session Recording** → Verify recording is available (if enabled)
3. **Session Notes** → Check that session notes are captured
4. **Patient Data** → Ensure patient information is accessible

#### Step 2: AI Processing
1. **Trigger AI Processing** → This should happen automatically
2. **Check Processing Status** → Verify AI processing is initiated
3. **Wait for Completion** → Allow time for AI processing
4. **Check Results** → Verify AI notes are generated

#### Step 3: Review AI Notes
1. **Access Notes** → Navigate to session notes
2. **Review SOAP Notes** → Check generated clinical notes
3. **Verify Accuracy** → Ensure notes are relevant and accurate
4. **Edit if Needed** → Make any necessary corrections
5. **Save Notes** → Save final notes to patient record

**Expected Result**: AI notes generated successfully, therapist can review and edit

## Testing Checklist

### Authentication & User Management
- [ ] Patient can register and login
- [ ] Therapist can register and login
- [ ] Magic links work correctly
- [ ] User sessions are maintained
- [ ] Logout functionality works

### Booking System
- [ ] Patient can complete biodata form
- [ ] Therapist selection works
- [ ] Availability display is accurate
- [ ] Time slot booking works
- [ ] Booking confirmation is sent

### Video Session
- [ ] Room creation works
- [ ] Meeting tokens are generated
- [ ] Video/audio permissions work
- [ ] Both users can join session
- [ ] Video quality is acceptable
- [ ] Session timer works
- [ ] Session controls function
- [ ] Session can be ended properly

### Session Management
- [ ] Sessions are created correctly
- [ ] Session status updates work
- [ ] Session history is maintained
- [ ] Session data is saved
- [ ] Session cancellation works

### AI Features
- [ ] Session data is captured
- [ ] AI processing is triggered
- [ ] SOAP notes are generated
- [ ] Notes are accurate and helpful
- [ ] Therapist can edit notes
- [ ] Notes are saved to patient record

### Database Operations
- [ ] User data is saved correctly
- [ ] Session data is stored properly
- [ ] Relationships are maintained
- [ ] Data consistency is preserved
- [ ] Queries perform well

### Error Handling
- [ ] Network errors are handled gracefully
- [ ] Invalid inputs are rejected
- [ ] Error messages are clear
- [ ] System recovers from errors
- [ ] User experience is not broken

## Common Issues & Solutions

### Authentication Issues
**Problem**: Magic links not working
**Solution**: 
- Check email configuration
- Verify email templates
- Check spam folder
- Test with different email providers

### Video Session Issues
**Problem**: Video not loading
**Solution**:
- Check Daily.co API key
- Verify room creation
- Check browser permissions
- Test with different browsers
- Check network connectivity

### Database Issues
**Problem**: Data not saving
**Solution**:
- Check database connection
- Verify table schemas
- Check user permissions
- Review error logs
- Test with simple queries

### AI Notes Issues
**Problem**: Notes not generating
**Solution**:
- Check AI service configuration
- Verify session data is complete
- Check processing queue
- Review error logs
- Test with sample data

## Performance Testing

### Load Testing
1. **Multiple Users** → Test with 10+ concurrent users
2. **Session Load** → Test multiple simultaneous sessions
3. **Database Load** → Monitor database performance
4. **Video Quality** → Test under different network conditions

### Stress Testing
1. **Long Sessions** → Test sessions longer than 1 hour
2. **Multiple Bookings** → Test rapid booking creation
3. **Data Volume** → Test with large amounts of session data
4. **Concurrent Access** → Test simultaneous access to same resources

## Security Testing

### Authentication Security
1. **Session Security** → Verify sessions are secure
2. **Token Security** → Check token generation and validation
3. **Access Control** → Verify users can only access their data
4. **Data Protection** → Ensure sensitive data is protected

### Video Security
1. **Room Security** → Verify rooms are private
2. **Token Security** → Check meeting token security
3. **Recording Security** → Ensure recordings are secure
4. **Data Privacy** → Verify session data privacy

## Reporting Issues

When reporting issues, include:

1. **Steps to Reproduce** → Detailed steps that led to the issue
2. **Expected Behavior** → What should have happened
3. **Actual Behavior** → What actually happened
4. **Environment Details** → Browser, OS, network conditions
5. **Error Messages** → Any error messages or logs
6. **Screenshots** → Visual evidence of the issue
7. **Log Files** → Relevant log entries

## Success Criteria

The therapy session workflow is considered successful when:

- ✅ Patients can complete the full booking process
- ✅ Therapists can manage their practice effectively
- ✅ Video sessions work reliably for all users
- ✅ AI notes are generated accurately and helpfully
- ✅ All data is saved and accessible
- ✅ System performs well under normal load
- ✅ Security measures protect user data
- ✅ Error handling provides good user experience
- ✅ System is ready for production deployment

## Next Steps

1. **Complete Manual Testing** → Follow all test scenarios
2. **Document Issues** → Record any problems found
3. **Fix Critical Issues** → Address blocking problems
4. **Re-test Fixed Issues** → Verify fixes work
5. **Performance Testing** → Test under load
6. **Security Review** → Verify security measures
7. **User Acceptance** → Get feedback from real users
8. **Production Deployment** → Deploy to production environment
