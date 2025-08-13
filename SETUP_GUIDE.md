# 🚀 Complete Setup Guide for Testing

## 📋 **Prerequisites**
- Node.js installed
- Supabase project set up
- Environment variables configured

## 🗄️ **Database Setup**

### **Step 1: Run Patient Data Schema**
```sql
-- Copy and paste the contents of scripts/setup-patient-tables.sql
-- into your Supabase SQL editor and run it
```

### **Step 2: Create Test Therapist**
```bash
# Run the test therapist creation script
node scripts/create-test-therapist.js
```

**Expected Output:**
```
🚀 Creating test therapist...
✅ Therapist user created: [therapist-id]
✅ Therapist added to global_users
✅ Therapist added to therapists table
✅ Availability slots created
✅ Test user credits updated to 3
🎉 Test therapist setup complete!
📧 Email: test.therapist@trpi.com
🔑 Password: test123456
🆔 Therapist ID: [therapist-id]
```

## 👤 **Test Accounts**

### **Test User Account**
- **Email**: `test.user@trpi.com`
- **Password**: `test123456`
- **Credits**: 3 (automatically set)

### **Test Therapist Account**
- **Email**: `test.therapist@trpi.com`
- **Password**: `test123456`
- **Name**: Dr. Sarah Johnson
- **Specialization**: CBT, Anxiety, Depression
- **Availability**: Next 7 days, 9 AM - 5 PM

## 🧪 **Complete Test Flow**

### **Phase 1: User Registration & Login**
1. **Register/Login as User**
   - Go to `/login`
   - Use: `test.user@trpi.com` / `test123456`
   - **Verify**: Dashboard loads with 3 credits

### **Phase 2: Book a Session**
1. **Navigate to Book Session**
   - Go to `/dashboard/book`
   - **Verify**: 3-step booking process

2. **Step 1: Patient Biodata**
   - Fill out the form:
     - Name: "Test User"
     - Age: "25"
     - Gender: "Male"
     - Marital Status: "Single"
     - Complaints: "Anxiety and stress"
   - Click "Next"
   - **Verify**: Moves to Step 2

3. **Step 2: Select Therapist**
   - **Verify**: Dr. Sarah Johnson appears in the list
   - Select Dr. Sarah Johnson
   - Click "Next"
   - **Verify**: Moves to Step 3

4. **Step 3: Payment**
   - **Verify**: Shows booking summary
   - **Verify**: Shows 1 credit will be deducted
   - Complete the booking
   - **Verify**: Success message and redirect to dashboard
   - **Verify**: Credits reduced to 2

### **Phase 3: View Upcoming Sessions**
1. **Check Sessions**
   - Go to `/dashboard/sessions`
   - **Verify**: Shows upcoming session with Dr. Sarah Johnson
   - **Verify**: Session status is "Scheduled"
   - **Verify**: "Join Session" button is available

### **Phase 4: Join and Complete Session**
1. **Join Session**
   - Click "Join Session" button
   - **Verify**: Redirects to `/session/[sessionId]`
   - **Verify**: Shows session details

2. **Start Session**
   - Click "Start Session" button
   - **Verify**: Session status changes to "In Progress"
   - **Verify**: Timer starts counting

3. **End Session**
   - Click "End Session" button
   - **Verify**: Session completes
   - **Verify**: Success message
   - **Verify**: Redirects back to sessions page

### **Phase 5: Patient Data Management**
1. **Edit Biodata**
   - Go to `/dashboard/biodata`
   - Click edit button
   - Fill out all fields
   - Click save
   - **Verify**: Data saves successfully

2. **Edit Family History**
   - Go to `/dashboard/family-history`
   - Click edit button
   - Fill out the form
   - Click save
   - **Verify**: Data saves successfully

3. **Edit Social History**
   - Go to `/dashboard/social-history`
   - Click edit button
   - Fill out both sections
   - Click save
   - **Verify**: Data saves successfully

4. **View Medical History**
   - Go to `/dashboard/medical-history`
   - **Verify**: Shows "Therapist Managed" badges
   - **Verify**: Medical and drug history are read-only

### **Phase 6: Credits Management**
1. **View Credits**
   - Go to `/dashboard/credits`
   - **Verify**: Shows 2 credits (after booking)

2. **Test Custom Amount**
   - Enter custom amount: "75"
   - **Verify**: Shows "7 credits" calculation
   - Click "Purchase Credits"
   - **Verify**: Payment processing and success
   - **Verify**: Credits increase to 9

### **Phase 7: Therapist Actions (Switch to Therapist Account)**
1. **Login as Therapist**
   - Logout from user account
   - Login with: `test.therapist@trpi.com` / `test123456`

2. **View Clients**
   - Go to `/therapist/dashboard/clients`
   - **Verify**: Shows test user as client

3. **Access Client Medical History**
   - Click on the client
   - Click "Medical History" button
   - **Verify**: Medical history management page loads

4. **Add Medical Diagnosis**
   - Click "Add Diagnosis"
   - Fill out the form
   - Click "Add Diagnosis"
   - **Verify**: Diagnosis appears in table

5. **Add Drug History**
   - Click "Add Medication"
   - Fill out the form
   - Click "Add Medication"
   - **Verify**: Medication appears in table

### **Phase 8: Verify Patient Can See Changes**
1. **Switch Back to Patient**
   - Logout from therapist account
   - Login as user: `test.user@trpi.com` / `test123456`

2. **Check Medical History**
   - Go to `/dashboard/medical-history`
   - **Verify**: New diagnosis and medication are visible
   - **Verify**: Data is read-only

## ✅ **Success Criteria**

### **All Features Must Work:**
- ✅ **Booking Flow**: Complete 3-step booking process
- ✅ **Credit System**: Credits deduct and add correctly
- ✅ **Session Management**: Join, complete, and view sessions
- ✅ **Patient Data**: Edit and save biodata, family history, social history
- ✅ **Medical History**: Therapist can add, patient can view (read-only)
- ✅ **Real-time Updates**: Data persists and updates correctly
- ✅ **Access Control**: Proper permissions for patients vs therapists

### **Data Persistence:**
- ✅ Patient biodata saves and loads
- ✅ Family history saves and loads
- ✅ Social history saves and loads
- ✅ Medical history (therapist-managed) saves and loads
- ✅ Drug history (therapist-managed) saves and loads
- ✅ Session data persists
- ✅ Credits update correctly

### **User Experience:**
- ✅ Smooth navigation between pages
- ✅ Proper loading states
- ✅ Success/error messages
- ✅ Form validation
- ✅ Responsive design

## 🐛 **Troubleshooting**

### **Common Issues:**

1. **Therapist not showing in booking**
   - Check if therapist is verified and active
   - Verify availability slots exist
   - Check API endpoint `/api/therapists`

2. **Credits not updating**
   - Check database connection
   - Verify user authentication
   - Check RLS policies

3. **Session booking fails**
   - Check if user has enough credits
   - Verify time slot availability
   - Check session creation permissions

4. **Data not saving**
   - Check RLS policies
   - Verify table structure
   - Check authentication

### **Database Queries for Debugging:**

```sql
-- Check therapist availability
SELECT * FROM therapist_availability WHERE therapist_id = '[therapist-id]';

-- Check user credits
SELECT credits FROM global_users WHERE email = 'test.user@trpi.com';

-- Check sessions
SELECT * FROM global_sessions WHERE user_id = '[user-id]';

-- Check patient data
SELECT * FROM patient_biodata WHERE user_id = '[user-id]';
```

## 🎉 **Completion**

Once all tests pass successfully, you have a fully functional therapy platform with:
- ✅ Complete booking system
- ✅ Credit management
- ✅ Session management
- ✅ Patient data management
- ✅ Therapist medical history management
- ✅ Proper access controls
- ✅ Data persistence

You can now confidently move to other development tasks! 🚀
