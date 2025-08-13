# 🧪 Complete User Testing Guide

## 🎯 **Testing Objectives**
Test all user-side features to ensure everything works perfectly before moving to other development tasks.

## 📋 **Pre-Test Setup**

### **1. Database Setup**
```sql
-- Run this in your Supabase SQL editor
-- Copy and paste the contents of scripts/setup-patient-tables.sql
```

### **2. Test User Setup**
- Ensure you have a test user account
- Ensure you have a test therapist account (already onboarded with availability)

---

## 🚀 **Test Flow**

### **Phase 1: Book a Session Flow**

#### **Step 1: Navigate to Book Session**
1. Go to `/dashboard/book`
2. **Verify**: You see the 3-step booking process
   - Step 1: Patient Biodata
   - Step 2: Select Therapist  
   - Step 3: Payment

#### **Step 2: Complete Step 1 - Patient Biodata**
1. Fill out the form with test data:
   - Name: "Test User"
   - Age: "25"
   - Gender: "Male"
   - Marital Status: "Single"
   - Complaints: "Anxiety and stress"
   - Therapist Preference: "Female therapist"
2. Click "Next"
3. **Verify**: Moves to Step 2

#### **Step 3: Complete Step 2 - Select Therapist**
1. **Verify**: You see available therapists
2. Select a therapist
3. **Verify**: Shows therapist details and availability
4. Click "Next"
5. **Verify**: Moves to Step 3

#### **Step 4: Complete Step 3 - Payment**
1. **Verify**: Shows booking summary
2. **Verify**: Shows payment options
3. Complete the payment process
4. **Verify**: Success message and redirect to dashboard

---

### **Phase 2: Session Notes & History**

#### **Step 1: View Sessions**
1. Go to `/dashboard/sessions`
2. **Verify**: You see your booked session
3. **Verify**: Session shows as "Completed" or "Upcoming"

#### **Step 2: View Session Notes**
1. Click on a completed session
2. **Verify**: You can view session notes
3. **Verify**: Notes are properly formatted and readable

---

### **Phase 3: Go to Therapy (Immediate Session)**

#### **Step 1: Start Immediate Session**
1. Go to `/dashboard/therapy`
2. **Verify**: You can start an immediate session
3. **Verify**: Video call interface loads
4. **Verify**: Session controls work (mute, camera, etc.)

#### **Step 2: Test Session Features**
1. Test video/audio permissions
2. Test chat functionality
3. Test session recording (if available)
4. **Verify**: Session ends properly

---

### **Phase 4: Patient Data Management**

#### **Step 1: Edit Biodata**
1. Go to `/dashboard/biodata`
2. Click the edit button (pencil icon)
3. Fill out all fields:
   - Name: "John Doe"
   - Age: "30"
   - Sex: "Male"
   - Religion: "Christian"
   - Occupation: "Software Engineer"
   - Marital Status: "Single"
   - Tribe: "Yoruba"
   - Level of Education: "Bachelor's Degree"
   - Complaints: "Work stress and anxiety"
   - Therapist Preference: "Experienced CBT therapist"
4. Click "Save" (green checkmark)
5. **Verify**: Success toast appears
6. **Verify**: Data is saved and displayed

#### **Step 2: Edit Family History**
1. Go to `/dashboard/family-history`
2. Click the edit button
3. Fill out the form:
   - Mental Health History: "Mother had depression, father has anxiety"
   - Substance Abuse History: "No known family history"
   - Other Medical History: "Family history of diabetes"
4. Click "Save"
5. **Verify**: Success toast appears
6. **Verify**: Data is saved and displayed

#### **Step 3: Edit Social History**
1. Go to `/dashboard/social-history`
2. Click the edit button
3. Fill out both sections:

   **Lifestyle & Relationships:**
   - Living Situation: "Lives alone in apartment"
   - Employment: "Full-time software engineer"
   - Relationships: "Close relationship with sister"
   - Hobbies & Interests: "Reading, hiking, gaming"
   - Stressors: "Work deadlines, relationship issues"

   **Substance Use History:**
   - Smoking: "No history of smoking"
   - Alcohol: "Occasional social drinking"
   - Other Drugs: "No illicit drug use"

4. Click "Save"
5. **Verify**: Success toast appears
6. **Verify**: Data is saved and displayed

#### **Step 4: View Medical History (Read-only)**
1. Go to `/dashboard/medical-history`
2. **Verify**: Shows "Therapist Managed" badges
3. **Verify**: Medical and drug history sections are read-only
4. **Verify**: Shows your patient data from previous steps

---

### **Phase 5: Credits Management**

#### **Step 1: View Current Credits**
1. Go to `/dashboard/credits`
2. **Verify**: Shows current credit balance
3. **Verify**: Shows credit packages

#### **Step 2: Test Predefined Packages**
1. Click on "Standard Package" (12 credits for $100)
2. **Verify**: Package is highlighted
3. Click "Purchase Credits"
4. **Verify**: Payment processing message
5. **Verify**: Success message after 2 seconds

#### **Step 3: Test Custom Amount**
1. Enter custom amount: "75"
2. **Verify**: Shows "7 credits" calculation
3. Click "Purchase Credits"
4. **Verify**: Payment processing and success

---

### **Phase 6: Therapist Medical History Management**

#### **Step 1: Switch to Therapist Account**
1. Log out of user account
2. Log in as therapist
3. Go to `/therapist/dashboard/clients`

#### **Step 2: Access Client Medical History**
1. Click on a client from the list
2. **Verify**: Client details page loads
3. Click "Medical History" button
4. **Verify**: Medical history management page loads

#### **Step 3: Add Medical Diagnosis**
1. Click "Add Diagnosis"
2. Fill out the form:
   - Condition: "Generalized Anxiety Disorder"
   - Diagnosis Date: "2024-01-15"
   - Notes: "Diagnosed by primary care physician"
3. Click "Add Diagnosis"
4. **Verify**: Success message
5. **Verify**: Diagnosis appears in the table

#### **Step 4: Add Drug History**
1. Click "Add Medication"
2. Fill out the form:
   - Medication Name: "Sertraline (Zoloft)"
   - Dosage: "50mg daily"
   - Start Date: "2024-02-01"
   - Prescribing Doctor: "Dr. Smith (PCP)"
   - Duration of Usage: "Ongoing"
   - Notes: "Prescribed for GAD, no side effects"
3. Click "Add Medication"
4. **Verify**: Success message
5. **Verify**: Medication appears in the table

#### **Step 5: Verify Patient Can See Changes**
1. Switch back to patient account
2. Go to `/dashboard/medical-history`
3. **Verify**: New diagnosis and medication are visible
4. **Verify**: Data is read-only for patient

---

## ✅ **Success Criteria**

### **All Features Must:**
- ✅ Load without errors
- ✅ Save data successfully
- ✅ Show appropriate success/error messages
- ✅ Navigate between pages correctly
- ✅ Display data correctly after saving
- ✅ Handle form validation properly
- ✅ Work on both desktop and mobile

### **Data Persistence:**
- ✅ Patient biodata saves and loads
- ✅ Family history saves and loads
- ✅ Social history saves and loads
- ✅ Medical history (therapist-managed) saves and loads
- ✅ Drug history (therapist-managed) saves and loads

### **Access Control:**
- ✅ Patients can only edit their own data
- ✅ Therapists can only access their clients' data
- ✅ Medical/drug history is read-only for patients
- ✅ Proper authentication checks

---

## 🐛 **Common Issues to Check**

### **Database Issues:**
- Tables not created properly
- RLS policies not working
- Connection issues

### **UI Issues:**
- Forms not submitting
- Loading states not working
- Toast notifications not appearing
- Navigation not working

### **Data Issues:**
- Data not saving
- Data not loading
- Wrong data displayed
- Access denied errors

---

## 📝 **Test Results Log**

| Feature | Status | Notes |
|---------|--------|-------|
| Book Session Flow | ⏳ | |
| Session Notes | ⏳ | |
| Go to Therapy | ⏳ | |
| Patient Biodata | ⏳ | |
| Family History | ⏳ | |
| Social History | ⏳ | |
| Medical History (Patient View) | ⏳ | |
| Credits Management | ⏳ | |
| Therapist Medical History | ⏳ | |

---

## 🎉 **Completion Checklist**

- [ ] All user features tested
- [ ] All data saves correctly
- [ ] All navigation works
- [ ] All forms validate properly
- [ ] All success/error messages appear
- [ ] Therapist can manage client medical history
- [ ] Patient can view but not edit medical history
- [ ] Credits system works with custom amounts
- [ ] No console errors
- [ ] Mobile responsive

Once all tests pass, you can confidently move to other development tasks! 🚀
