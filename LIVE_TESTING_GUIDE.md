# 🚀 Live Testing Guide - Real Users Workflow

## 📋 **Pre-Testing Setup**

### **Step 1: Email Addresses Configured**
The setup script is already configured with your actual email addresses:

```sql
-- Your actual email addresses
'asereopeyemimichael@gmail.com'  -- Admin
'michaelasereo@gmail.com'        -- Therapist  
'asereope@gmail.com'             -- Patient
```

### **Step 2: Run Database Setup**
```bash
# Run the user setup script
psql -d your_database -f setup-real-users.sql
```

### **Step 3: Verify Email Configuration**
Ensure your email service (Supabase Auth) is properly configured for magic links.

---

## 🎯 **Complete Testing Workflow**

### **Phase 1: Admin Setup & Login**

#### **1.1 Admin Login**
- **URL**: `/admin/login`
- **Email**: `asereopeyemimichael@gmail.com`
- **Process**: 
  1. Enter admin email
  2. Click "Send Magic Link"
  3. Check email for magic link
  4. Click link to access admin dashboard

#### **1.2 Verify Admin Access**
- **Dashboard**: `/admin/dashboard`
- **Check**: Platform overview, user counts, system health
- **Navigate**: Verify all admin sections are accessible

---

### **Phase 2: Therapist Enrollment & Approval**

#### **2.1 Therapist Enrollment**
- **URL**: `/therapist/enroll`
- **Email**: `michaelasereo@gmail.com`
- **Process**:
  1. Fill out enrollment form
  2. Submit application
  3. Check email for confirmation

#### **2.2 Admin Approval Process**
- **Admin Dashboard**: `/admin/dashboard/therapists`
- **Actions**:
  1. View pending therapist applications
  2. Review therapist details
  3. Click "Approve" for the therapist
  4. Verify therapist status changes to "Approved"

#### **2.3 Therapist Login & Setup**
- **URL**: `/therapist/login`
- **Email**: `michaelasereo@gmail.com`
- **Process**:
  1. Enter email for magic link
  2. Access therapist dashboard
  3. Set availability schedule
  4. Complete profile setup

---

### **Phase 3: Patient Registration & Booking**

#### **3.1 Patient Registration**
- **URL**: `/register`
- **Email**: `asereope@gmail.com`
- **Process**:
  1. Fill registration form
  2. Verify email
  3. Complete profile setup

#### **3.2 Patient Login**
- **URL**: `/login`
- **Email**: `asereope@gmail.com`
- **Process**:
  1. Enter email for magic link
  2. Access patient dashboard

#### **3.3 Book Therapy Session**
- **URL**: `/dashboard/book`
- **Process**:
  1. Browse available therapists
  2. Select therapist (should see approved therapist)
  3. Choose available time slot
  4. Complete booking process
  5. Verify booking confirmation

---

### **Phase 4: Video Therapy Session**

#### **4.1 Pre-Session Setup**
- **Therapist**: Set availability and prepare for session
- **Patient**: Ensure credits are available
- **Both**: Test video/audio equipment

#### **4.2 Join Video Session**
- **URL**: `/video-call` or `/session/[session-id]`
- **Process**:
  1. Both users join video call
  2. Test video/audio functionality
  3. Verify screen sharing works
  4. Test chat functionality
  5. Verify session recording (if enabled)

#### **4.3 Session Completion**
- **Process**:
  1. Complete therapy session
  2. Verify session notes can be added
  3. Check credit deduction
  4. Verify session history updates

---

## 🔍 **Testing Checklist**

### **Authentication & Access**
- [ ] Admin can login with magic link
- [ ] Therapist can enroll and login
- [ ] Patient can register and login
- [ ] All users stay logged in properly
- [ ] Logout functionality works

### **Admin Functions**
- [ ] Can view all users
- [ ] Can approve therapist applications
- [ ] Can manage platform settings
- [ ] Can view system analytics
- [ ] Can manage content (blog/FAQs)

### **Therapist Functions**
- [ ] Can complete enrollment
- [ ] Can set availability
- [ ] Can view patient bookings
- [ ] Can join video sessions
- [ ] Can access patient history

### **Patient Functions**
- [ ] Can browse therapists
- [ ] Can book sessions
- [ ] Can join video calls
- [ ] Can view session history
- [ ] Can manage credits

### **Video Call System**
- [ ] Both users can join call
- [ ] Video/audio works properly
- [ ] Screen sharing functions
- [ ] Chat works during call
- [ ] Session ends properly

### **Payment & Credits**
- [ ] Credits are deducted after session
- [ ] Payment processing works
- [ ] Credit balance updates correctly
- [ ] Session billing is accurate

---

## 🚨 **Critical Test Scenarios**

### **1. Therapist Approval Flow**
```
Therapist Enrolls → Admin Reviews → Admin Approves → Therapist Can Login → Therapist Sets Availability → Patient Can Book
```

### **2. Session Booking Flow**
```
Patient Logs In → Browses Therapists → Selects Time → Books Session → Receives Confirmation → Both Join Video Call
```

### **3. Credit Management**
```
Patient Has Credits → Books Session → Credits Deducted → Session Completed → Balance Updated
```

### **4. Video Call Quality**
```
Both Users Join → Video/Audio Test → Screen Share Test → Chat Test → Session Recording → Proper Disconnect
```

---

## 📊 **Success Metrics**

### **Technical Metrics**
- [ ] All authentication flows work
- [ ] Video calls connect successfully
- [ ] Database operations complete
- [ ] Email notifications sent
- [ ] No critical errors in console

### **User Experience Metrics**
- [ ] Users can complete intended actions
- [ ] Interface is responsive
- [ ] Error messages are clear
- [ ] Loading states work properly
- [ ] Mobile responsiveness

### **Business Logic Metrics**
- [ ] Therapist approval process works
- [ ] Booking system functions correctly
- [ ] Credit system operates properly
- [ ] Session management works
- [ ] Admin controls function

---

## 🛠 **Troubleshooting**

### **Common Issues**

#### **Magic Links Not Working**
- Check email configuration in Supabase
- Verify email addresses are correct
- Check spam folder

#### **Video Call Issues**
- Test browser permissions
- Check microphone/camera access
- Verify internet connection
- Test with different browsers

#### **Database Issues**
- Check database connection
- Verify table structure
- Check for constraint violations

#### **Authentication Issues**
- Clear browser cookies
- Check session tokens
- Verify user types in database

---

## 📞 **Support Contacts**

- **Technical Issues**: Check console logs and database
- **Email Issues**: Verify Supabase Auth configuration
- **Video Issues**: Test with different devices/browsers
- **Database Issues**: Check SQL logs and constraints

---

## 🎉 **Go-Live Checklist**

Before going live with real users:

- [ ] All test scenarios pass
- [ ] Video call quality is acceptable
- [ ] Payment processing works
- [ ] Email notifications are reliable
- [ ] Admin controls are functional
- [ ] Security measures are in place
- [ ] Data backup is configured
- [ ] Monitoring is set up
- [ ] Support documentation is ready
- [ ] Legal/terms are in place

---

**Ready to test! 🚀**
