# 🧪 Complete Flow Test Guide
## Booking → Video Call → SOAP Notes

### 🚀 Server Status
The dev server is running at: **http://localhost:3000**

---

## 📋 **Pre-Test Setup**

### Step 1: Create Test Accounts

You'll need at least 2 accounts:
1. **Patient/User** - To book sessions
2. **Therapist** - To conduct sessions

#### Option A: Manual Signup
1. Go to `/signup` or `/login`
2. Create a patient account
3. Create a therapist account (separate browser/incognito)

#### Option B: Quick SQL Setup
Run this in Supabase SQL Editor to create test accounts:

```sql
-- Create test patient
INSERT INTO users (email, full_name, user_type, is_verified, credits)
VALUES ('patient@test.com', 'Test Patient', 'individual', true, 10)
ON CONFLICT (email) DO UPDATE SET credits = 10;

-- Create test therapist
INSERT INTO users (email, full_name, user_type, is_verified)
VALUES ('therapist@test.com', 'Dr. Test Therapist', 'therapist', true)
ON CONFLICT (email) DO NOTHING;

-- Create therapist enrollment (for approval)
INSERT INTO therapist_enrollments (email, full_name, status)
VALUES ('therapist@test.com', 'Dr. Test Therapist', 'approved')
ON CONFLICT (email) DO UPDATE SET status = 'approved';
```

**Note:** You'll still need to sign up via the UI to set passwords and get Supabase Auth accounts.

---

## 🔄 **Complete Flow Testing**

### **Phase 1: Booking Flow**

#### Step 1: Login as Patient
- Navigate to: `http://localhost:3000/login`
- Login with patient credentials
- **Verify:** Dashboard loads with credits visible

#### Step 2: Start Booking
- Navigate to: `http://localhost:3000/dashboard/book` or `/book`
- **Verify:** Booking page loads

#### Step 3: Complete Booking Form
1. **Patient Biodata** (if multi-step):
   - Fill in patient information
   - Add complaints/concerns
   - Click "Next"

2. **Select Therapist**:
   - See available therapists
   - Select your test therapist
   - Click "Next"

3. **Select Time Slot**:
   - Choose available date/time
   - Verify duration (usually 30-60 minutes)
   - Click "Confirm"

4. **Payment/Confirmation**:
   - Confirm booking details
   - Complete booking
   - **Verify:** Session created with status "scheduled"

#### Step 4: Verify Booking Created
- Go to Dashboard → Sessions
- **Verify:** New session appears
- **Verify:** Status is "scheduled"
- **Verify:** Start time and therapist info correct

---

### **Phase 2: Video Call Flow**

#### Step 1: Access Session (Patient Side)
- From Dashboard → Sessions
- Find the scheduled session
- Click "Join Session" or "Start Session"
- **Verify:** Video call interface loads

#### Step 2: Access Session (Therapist Side)
- Login as therapist
- Go to Dashboard → Sessions
- Find the session
- Click "Join Session"
- **Verify:** Video call interface loads
- **Verify:** Both participants can see each other

#### Step 3: Test Video Features
- **Verify:** Camera works (green light on browser)
- **Verify:** Microphone works (audio indicators)
- **Verify:** Can toggle camera on/off
- **Verify:** Can mute/unmute microphone
- **Verify:** Screen sharing works (if available)
- **Verify:** Chat/messaging works (if available)

#### Step 4: End Session
- Click "End Session" or "Complete Session"
- **Verify:** Session status changes to "completed"
- **Verify:** Redirected to session summary/notes page

---

### **Phase 3: SOAP Notes Flow**

#### Step 1: Access SOAP Notes (Therapist Only)
- After session completion
- Navigate to session details
- Look for "Session Notes" or "SOAP Notes" section
- **Verify:** Notes form is accessible

#### Step 2: Manual Notes Entry
1. Fill in **Subjective**:
   - Patient's reported concerns
   - Symptoms and complaints
   - Emotional state

2. Fill in **Objective**:
   - Observations during session
   - Behavioral notes
   - Physical observations

3. Fill in **Assessment**:
   - Clinical assessment
   - Diagnosis or impression
   - Progress evaluation

4. Fill in **Plan**:
   - Treatment plan
   - Next steps
   - Follow-up recommendations

5. Click "Save Notes"
- **Verify:** Notes saved successfully
- **Verify:** Success message appears

#### Step 3: AI-Generated SOAP Notes (Alternative)
1. Navigate to session details
2. Click "Generate AI Notes" or "Generate SOAP Notes"
3. **Verify:** Loading indicator appears
4. **Verify:** AI generates SOAP notes
5. **Verify:** Notes appear in Subjective, Objective, Assessment, Plan sections
6. Review and edit if needed
7. Click "Save"
- **Verify:** AI-generated notes saved

#### Step 4: View SOAP Notes (Patient View)
- Login as patient
- Go to Sessions → Completed Sessions
- Open the completed session
- **Verify:** SOAP notes are visible (if allowed)
- **Verify:** Format is readable

---

## 🔍 **Key Testing Points**

### **Booking Flow**
- [ ] Can create booking successfully
- [ ] Credits are deducted correctly
- [ ] Session appears in both patient and therapist dashboards
- [ ] Email notifications sent (if configured)
- [ ] Session has correct date/time
- [ ] Session has correct duration

### **Video Call Flow**
- [ ] Can join session from both sides
- [ ] Video/audio works both ways
- [ ] Can toggle camera/mic
- [ ] Session can be ended
- [ ] Status updates correctly after ending

### **SOAP Notes Flow**
- [ ] Can access notes page after session
- [ ] Can save manual notes
- [ ] Can generate AI notes (if API key configured)
- [ ] Notes persist in database
- [ ] Notes are viewable by therapist
- [ ] Notes format is correct (SOAP structure)

---

## 🐛 **Troubleshooting**

### Booking Issues
- **No therapists showing?**
  - Verify therapist account exists and is approved
  - Check therapist availability settings
  - Verify therapist is active

- **Booking fails?**
  - Check browser console for errors
  - Verify credits balance
  - Check database for foreign key issues

### Video Call Issues
- **Can't join session?**
  - Verify Daily.co API keys are set
  - Check network connection
  - Try different browser/device

- **No video/audio?**
  - Check browser permissions
  - Verify camera/mic access granted
  - Check browser console for errors

### SOAP Notes Issues
- **Notes not saving?**
  - Check database connection
  - Verify session_notes table exists
  - Check browser console for API errors

- **AI notes not generating?**
  - Verify OPENAI_API_KEY is set in .env.local
  - Check API key is valid
  - Check server logs for errors

---

## 📊 **Testing Checklist**

### ✅ Pre-Flight
- [ ] Server running on localhost:3000
- [ ] Database connection working
- [ ] Test accounts created
- [ ] Environment variables set (.env.local)

### ✅ Booking
- [ ] Can create booking
- [ ] Session appears in dashboards
- [ ] Credits deducted
- [ ] Email notifications (if enabled)

### ✅ Video Call
- [ ] Can join from patient side
- [ ] Can join from therapist side
- [ ] Video/audio works
- [ ] Can complete session

### ✅ SOAP Notes
- [ ] Can access notes page
- [ ] Can save manual notes
- [ ] AI notes work (if enabled)
- [ ] Notes persist correctly
- [ ] Notes visible to both parties

---

## 🎯 **Quick Test URLs**

Once server is running:
- **Login:** http://localhost:3000/login
- **Signup:** http://localhost:3000/signup
- **Booking:** http://localhost:3000/dashboard/book
- **Sessions:** http://localhost:3000/dashboard/sessions
- **Therapist Dashboard:** http://localhost:3000/therapist/dashboard

---

## 📝 **API Endpoints to Test**

1. **POST** `/api/sessions/book` - Create booking
2. **POST** `/api/sessions/join` - Join video session
3. **POST** `/api/sessions/complete` - Complete session
4. **POST** `/api/sessions/soap-notes` - Generate AI SOAP notes
5. **POST** `/api/sessions/notes` - Save session notes

---

## 🚀 **Ready to Test!**

The server should be running now. Open your browser and start testing!

**Quick Start:**
1. Open http://localhost:3000
2. Create/login with test accounts
3. Start booking flow
4. Test video call
5. Complete SOAP notes

Good luck! 🎉

