# 🚀 MVP Testing Checklist - Complete Workflow Verification

## Overview
This checklist verifies that all core workflows are functional before pre-user testing and launch.

---

## 👨‍⚕️ **THERAPIST WORKFLOW**

### ✅ **1. Therapist Enrollment & Login**
- [ ] **Enrollment Process**
  - [ ] Therapist can access `/therapist/enroll` 
  - [ ] Can submit enrollment form with credentials/documents
  - [ ] Receives email confirmation of submission
  - [ ] Status shows "pending approval"

- [ ] **Login Process**
  - [ ] Can login via magic link at `/therapist/login`
  - [ ] Redirected to therapist dashboard after login
  - [ ] Session persists across browser refresh

### ✅ **2. Therapist Dashboard & Real-time Data**
- [ ] **Dashboard Display**
  - [ ] Shows total sessions (completed, upcoming, cancelled)
  - [ ] Shows total earnings/revenue
  - [ ] Shows client count
  - [ ] Shows today's schedule
  - [ ] Real-time updates when users book sessions

- [ ] **API Endpoints Working**
  - [ ] `GET /api/therapist/dashboard-data` - Returns dashboard stats
  - [ ] `GET /api/therapist/sessions/today` - Returns today's sessions
  - [ ] `GET /api/therapist/profile` - Returns therapist profile

### ✅ **3. Set Availability**
- [ ] **Availability Management**
  - [ ] Can set weekly availability (days/times)
  - [ ] Can set specific date availability
  - [ ] Can block/unblock time slots
  - [ ] Changes reflect immediately in booking system
  - [ ] `POST /api/therapist/availability` - Saves availability

### ✅ **4. Session Management**
- [ ] **Booking Notifications**
  - [ ] Sees new bookings in real-time on dashboard
  - [ ] Gets notification when user books their slot
  - [ ] Can see user details (name, email, complaints)

- [ ] **Session Preparation**
  - [ ] Can view upcoming session details
  - [ ] Can access session room before start time
  - [ ] Can see patient profile/history

### ✅ **5. Video Session Functionality**
- [ ] **Video Call Features**
  - [ ] Can join video session via Daily.co room
  - [ ] Camera and microphone work properly
  - [ ] Can mute/unmute audio and video
  - [ ] Can share screen if needed
  - [ ] Chat functionality works
  - [ ] Can end session properly

### ✅ **6. Session Completion & Notes**
- [ ] **Post-Session Process**
  - [ ] Can mark session as completed
  - [ ] AI generates SOAP notes automatically
  - [ ] Can review and edit generated notes
  - [ ] Notes are saved to session record
  - [ ] `POST /api/ai/process-session` - Generates notes

---

## 👤 **USER WORKFLOW**

### ✅ **1. User Registration & Login**
- [ ] **Sign Up Process**
  - [ ] Can register at `/login` or `/signup`
  - [ ] Magic link sent to email
  - [ ] Can login via magic link
  - [ ] Auto-granted 1 free session credit (25 minutes)

- [ ] **Profile Completion**
  - [ ] Redirected to complete profile after first login
  - [ ] Can enter personal details, medical history
  - [ ] Profile saved successfully

### ✅ **2. Booking Process**
- [ ] **Therapist Selection**
  - [ ] Can browse available therapists
  - [ ] Can see therapist profiles and specializations
  - [ ] Can view available time slots

- [ ] **Session Booking**
  - [ ] Can select date and time
  - [ ] Can enter session notes/complaints
  - [ ] Booking uses available credit (free or paid)
  - [ ] Confirmation email sent
  - [ ] `POST /api/sessions/book` - Creates booking

### ✅ **3. Payment & Credits**
- [ ] **Credit Display**
  - [ ] Dashboard shows current credit balance
  - [ ] Shows breakdown (free vs paid credits)
  - [ ] Shows next session duration (25 or 35 min)

- [ ] **Payment Process**
  - [ ] Can access pricing page after free session
  - [ ] Can select package (Bronze, Silver, Gold)
  - [ ] Paystack payment integration works
  - [ ] Credits added after successful payment
  - [ ] `POST /api/payments/initiate` - Starts payment

### ✅ **4. Session Management**
- [ ] **Upcoming Sessions**
  - [ ] Dashboard shows upcoming sessions
  - [ ] Shows session details (therapist, time, duration)
  - [ ] "Join Session" button appears at session time
  - [ ] `GET /api/sessions/upcoming` - Returns next session

### ✅ **5. Video Session Experience**
- [ ] **Video Call Features**
  - [ ] Can join session room
  - [ ] Camera and microphone permissions granted
  - [ ] Video and audio quality good
  - [ ] Can use chat during session
  - [ ] Session timer visible
  - [ ] Can end session

### ✅ **6. Post-Session Experience**
- [ ] **Session Summary**
  - [ ] Can view session summary/notes
  - [ ] AI-generated insights available
  - [ ] Session marked as completed in history

### ✅ **7. Upsell Funnel**
- [ ] **Continue Journey Page**
  - [ ] Redirected to `/dashboard/continue-journey` after session
  - [ ] Shows compelling pricing packages
  - [ ] Highlights savings and longer session times
  - [ ] Can purchase additional credits
  - [ ] Can immediately book next session after purchase

---

## 🏢 **PARTNER WORKFLOW**

### ✅ **1. Partner Registration & Management**
- [ ] **Partner Account Setup**
  - [ ] Can register as partner organization
  - [ ] Can access partner dashboard
  - [ ] Can manage company profile

### ✅ **2. Employee Management**
- [ ] **CSV Upload Process**
  - [ ] Can upload CSV with employee details
  - [ ] CSV validation works (email, name format)
  - [ ] Bulk upload processes successfully
  - [ ] `POST /api/partner/bulk-upload-members` - Processes CSV

- [ ] **Employee Verification**
  - [ ] Employees receive verification emails
  - [ ] Can verify account via email link
  - [ ] Verified employees can access platform
  - [ ] Auto-granted partner credits (25-minute sessions)

### ✅ **3. Credit Allocation & Management**
- [ ] **Credit Management**
  - [ ] Can allocate credits to specific employees
  - [ ] Can set credit expiration dates
  - [ ] Can view credit usage reports
  - [ ] Can revoke unused credits

- [ ] **Bulk Payment Management**
  - [ ] Can purchase credits in bulk for employees
  - [ ] Can manage payment methods
  - [ ] Can view billing history
  - [ ] Can export usage reports

### ✅ **4. Employee Session Access**
- [ ] **Employee Experience**
  - [ ] Employees can book sessions using partner credits
  - [ ] Same session experience as individual users
  - [ ] Partner credits show as "Company Sponsored"
  - [ ] Sessions tracked for partner reporting

---

## 👑 **ADMIN WORKFLOW**

### ✅ **1. Admin Access & Dashboard**
- [ ] **Admin Login**
  - [ ] Can login at `/admin/login`
  - [ ] Access to admin dashboard
  - [ ] `GET /api/admin/me` - Returns admin profile

### ✅ **2. Therapist Approval Process**
- [ ] **Therapist Management**
  - [ ] Can view pending therapist applications
  - [ ] Can review therapist credentials/documents
  - [ ] Can approve or reject applications
  - [ ] Approved therapists can start accepting bookings
  - [ ] Rejection emails sent with feedback

### ✅ **3. Real-time Platform Data**
- [ ] **Analytics Dashboard**
  - [ ] Total users, therapists, partners
  - [ ] Session completion rates
  - [ ] Revenue metrics
  - [ ] User engagement stats
  - [ ] Real-time session activity

- [ ] **User Management**
  - [ ] Can view all user accounts
  - [ ] Can deactivate problematic accounts
  - [ ] Can view user session history
  - [ ] Can handle support requests

---

## 🧪 **INTEGRATION TESTING**

### ✅ **End-to-End Workflows**
- [ ] **Complete User Journey**
  1. User signs up → Gets free credit
  2. Books session → Uses free credit
  3. Completes video session → AI generates notes
  4. Sees upsell page → Purchases package
  5. Books next session → Uses paid credit (35 min)

- [ ] **Complete Therapist Journey**
  1. Therapist enrolls → Pending approval
  2. Admin approves → Can login
  3. Sets availability → Shows in booking system
  4. User books session → Appears in therapist dashboard
  5. Conducts session → Marks complete, reviews notes

- [ ] **Complete Partner Journey**
  1. Partner uploads CSV → Employees get emails
  2. Employee verifies → Gets partner credits
  3. Employee books session → Uses company credit
  4. Partner sees usage → Can purchase more credits

### ✅ **API Integration Testing**
- [ ] **Authentication APIs**
  - [ ] Magic link generation and verification
  - [ ] Session management and validation
  - [ ] Role-based access control

- [ ] **Payment Integration**
  - [ ] Paystack payment initiation
  - [ ] Webhook processing
  - [ ] Credit allocation after payment

- [ ] **Video Integration**
  - [ ] Daily.co room creation
  - [ ] Video session join/leave
  - [ ] Session recording (if enabled)

---

## 🔧 **TECHNICAL VERIFICATION**

### ✅ **Database & Performance**
- [ ] **Database Integrity**
  - [ ] All foreign key constraints work
  - [ ] Credit transactions are atomic
  - [ ] Session data consistency
  - [ ] Performance indexes working

- [ ] **Security**
  - [ ] All API endpoints require authentication
  - [ ] Users can only access their own data
  - [ ] Payment data is secure
  - [ ] Session tokens are validated server-side

### ✅ **Error Handling**
- [ ] **Graceful Failures**
  - [ ] Payment failures handled gracefully
  - [ ] Video session connection issues handled
  - [ ] Database connection failures managed
  - [ ] User-friendly error messages

---

## 📱 **Device & Browser Testing**

### ✅ **Cross-Platform Testing**
- [ ] **Desktop Browsers**
  - [ ] Chrome, Firefox, Safari, Edge
  - [ ] Video calls work on all browsers
  - [ ] Payment flow works on all browsers

- [ ] **Mobile Devices**
  - [ ] iOS Safari and Chrome
  - [ ] Android Chrome
  - [ ] Mobile video sessions work
  - [ ] Touch interface responsive

---

## 🎯 **LAUNCH READINESS CRITERIA**

### ✅ **All Systems Green**
- [ ] All workflows above completed successfully
- [ ] No critical bugs identified
- [ ] Performance meets requirements
- [ ] Security audit passed
- [ ] Payment system fully functional
- [ ] Video quality acceptable
- [ ] AI note generation working
- [ ] Email notifications working

### ✅ **Pre-Launch Setup**
- [ ] Production environment configured
- [ ] Monitoring and logging in place
- [ ] Backup systems ready
- [ ] Customer support processes ready
- [ ] Marketing materials prepared

---

## 🚀 **READY FOR PRE-USER TESTING**

When all items above are ✅ checked, you're ready to:

1. **Recruit beta testers** (therapists, users, partners)
2. **Conduct supervised testing sessions**
3. **Gather feedback and iterate**
4. **Set official launch date**
5. **Begin marketing campaigns**

---

**Status: [ ] MVP Testing Complete - Ready for Pre-User Testing**

*Last Updated: [Date]*
*Tested By: [Team Member]*
*Environment: [Development/Staging/Production]*
