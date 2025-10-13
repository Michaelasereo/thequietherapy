# Therapist Onboarding Form Fields

## 📋 Comprehensive Field List for Manual Therapist Registration

### **Section 1: Personal Information** (Required)

| Field Name | Type | Required | Validation | Notes |
|------------|------|----------|------------|-------|
| **Full Name** | Text | ✅ Yes | Min 3 chars | Legal name as it appears on license |
| **Email** | Email | ✅ Yes | Valid email format | For account login and communication |
| **Phone Number** | Tel | ✅ Yes | Valid phone format | For urgent contact and verification |
| **Profile Photo** | File Upload | ⚠️ Optional | Image (jpg, png) max 5MB | Professional headshot |

---

### **Section 2: Professional Credentials** (Required)

| Field Name | Type | Required | Validation | Notes |
|------------|------|----------|------------|-------|
| **MDCN Registration Number** | Text | ✅ Yes | Alphanumeric | Medical and Dental Council of Nigeria license number |
| **License Number** | Text | ✅ Yes | Alphanumeric | Professional practicing license number |
| **Years of Experience** | Number | ✅ Yes | Min 0, Max 50 | Total years practicing as a therapist |
| **Education** | Textarea | ✅ Yes | Min 10 chars | Degrees, universities, graduation years |
| **Certifications** | Textarea | ⚠️ Optional | - | Additional certifications, training, specializations |

---

### **Section 3: Professional Profile** (Required)

| Field Name | Type | Required | Validation | Notes |
|------------|------|----------|------------|-------|
| **Specializations** | Multi-select | ✅ Yes | At least 1 | Options: Anxiety, Depression, PTSD, Relationships, Grief, etc. |
| **Languages Spoken** | Multi-select | ✅ Yes | At least 1 | Options: English, Yoruba, Igbo, Hausa, Pidgin, etc. |
| **Professional Bio** | Textarea | ✅ Yes | Min 50, Max 500 chars | Brief introduction and approach to therapy |

---

### **Section 4: Service Details** (Required)

| Field Name | Type | Required | Validation | Notes |
|------------|------|----------|------------|-------|
| **Session Rate** | Number | ✅ Yes | Min ₦3,000 | Your rate per session (default: ₦5,000) |
| **Preferred Session Duration** | Select | ✅ Yes | 30, 45, 60 mins | Default session length |

---

### **Section 5: Document Verification** (Required)

| Field Name | Type | Required | Validation | Notes |
|------------|------|----------|------------|-------|
| **License Document** | File Upload | ✅ Yes | PDF/Image max 10MB | MDCN license certificate |
| **ID Document** | File Upload | ✅ Yes | PDF/Image max 10MB | Government-issued ID (NIN, Passport, Driver's License) |

---

### **Section 6: Banking Information** (Required for Payouts)

| Field Name | Type | Required | Validation | Notes |
|------------|------|----------|------------|-------|
| **Bank Name** | Select | ✅ Yes | Nigerian banks | For earnings withdrawal |
| **Account Number** | Text | ✅ Yes | 10 digits (NUBAN) | Bank account number |
| **Account Name** | Text | ✅ Yes | Must match full name | Account holder name |
| **BVN** | Text | ⚠️ Optional | 11 digits | Bank Verification Number (for verification) |

---

### **Section 7: Availability** (Optional - can be set later)

| Field Name | Type | Required | Validation | Notes |
|------------|------|----------|------------|-------|
| **Availability Notes** | Textarea | ⚠️ Optional | Max 200 chars | General availability notes |
| **Timezone** | Select | ✅ Yes | Default: WAT | West Africa Time, GMT+1 |

---

### **Section 8: Agreement & Consent** (Required)

| Field Name | Type | Required | Validation | Notes |
|------------|------|----------|------------|-------|
| **Terms & Conditions** | Checkbox | ✅ Yes | Must be checked | Platform terms of service |
| **Privacy Policy** | Checkbox | ✅ Yes | Must be checked | Data protection agreement |
| **Code of Ethics** | Checkbox | ✅ Yes | Must be checked | Professional conduct agreement |
| **Platform Guidelines** | Checkbox | ✅ Yes | Must be checked | QuietTherapy usage guidelines |

---

## 🎯 Recommended Specialization Options

```typescript
const specializations = [
  'Anxiety Disorders',
  'Depression',
  'Post-Traumatic Stress Disorder (PTSD)',
  'Relationship & Marriage Counseling',
  'Grief & Loss',
  'Stress Management',
  'Addiction & Substance Abuse',
  'Eating Disorders',
  'ADHD & Learning Disabilities',
  'Child & Adolescent Therapy',
  'Family Therapy',
  'Career Counseling',
  'Anger Management',
  'Self-Esteem Issues',
  'Sleep Disorders',
  'OCD (Obsessive-Compulsive Disorder)',
  'Bipolar Disorder',
  'Schizophrenia',
  'Personality Disorders',
  'Trauma & Crisis Intervention'
]
```

---

## 🌍 Recommended Language Options

```typescript
const languages = [
  'English',
  'Yoruba',
  'Igbo',
  'Hausa',
  'Nigerian Pidgin',
  'Fulani',
  'Ibibio',
  'Tiv',
  'Ijaw',
  'Edo',
  'French',
  'Arabic'
]
```

---

## 🏦 Nigerian Banks List

```typescript
const nigerianBanks = [
  'Access Bank',
  'Citibank Nigeria',
  'Ecobank Nigeria',
  'Fidelity Bank',
  'First Bank of Nigeria',
  'First City Monument Bank (FCMB)',
  'Guaranty Trust Bank (GTBank)',
  'Heritage Bank',
  'Keystone Bank',
  'Polaris Bank',
  'Providus Bank',
  'Stanbic IBTC Bank',
  'Standard Chartered Bank',
  'Sterling Bank',
  'SunTrust Bank',
  'Union Bank of Nigeria',
  'United Bank for Africa (UBA)',
  'Unity Bank',
  'Wema Bank',
  'Zenith Bank',
  'Kuda Bank',
  'OPay',
  'PalmPay',
  'Moniepoint',
  'VFD Microfinance Bank'
]
```

---

## 📱 Form Flow Recommendation

### **Step 1: Personal Information**
- Full Name, Email, Phone, Photo Upload

### **Step 2: Professional Credentials**
- MDCN Code, License Number, Experience, Education

### **Step 3: Professional Profile**
- Specializations, Languages, Bio

### **Step 4: Service Details**
- Session Rate, Duration

### **Step 5: Document Upload**
- License Document, ID Document

### **Step 6: Banking Information**
- Bank Name, Account Number, Account Name

### **Step 7: Review & Submit**
- Review all information
- Accept terms and conditions
- Submit for manual verification

---

## ✅ Validation Rules

### Required Fields (Cannot submit without):
1. Full Name
2. Email (valid format)
3. Phone Number
4. MDCN Registration Number
5. License Number
6. Years of Experience
7. Education
8. At least 1 Specialization
9. At least 1 Language
10. Professional Bio (50-500 characters)
11. Session Rate (minimum ₦3,000)
12. License Document (PDF/Image)
13. ID Document (PDF/Image)
14. Bank Name
15. Account Number (10 digits)
16. Account Name
17. All 4 consent checkboxes

### Optional Fields:
- Profile Photo
- Certifications
- BVN
- Availability Notes

---

## 🔒 Security & Privacy

### Document Handling:
- Upload to secure cloud storage (Supabase Storage or AWS S3)
- Encrypt sensitive documents
- Only admins can view license/ID documents
- Automatically delete documents after verification (optional)

### Data Protection:
- All personal data encrypted at rest
- Banking information extra encryption
- Comply with NDPR (Nigeria Data Protection Regulation)

---

## 📊 Admin Verification Process

After submission, admins should verify:

1. ✅ MDCN number is valid and active
2. ✅ License document matches provided number
3. ✅ ID document matches applicant name
4. ✅ Education credentials are legitimate
5. ✅ Banking information is correct
6. ✅ Professional bio is appropriate

**Verification Timeline**: 1-3 business days

---

## 🎨 UI/UX Best Practices

1. **Progress Indicator**: Show current step (e.g., "Step 3 of 7")
2. **Save Draft**: Allow saving progress and returning later
3. **Field Hints**: Tooltips for complex fields (MDCN number format)
4. **Image Preview**: Show uploaded photos before submit
5. **Error Messages**: Clear, helpful validation messages
6. **Success Screen**: Confirmation with "What's Next" guidance
7. **Mobile Responsive**: Works on all devices

---

## 📧 Post-Submission Communication

### Confirmation Email:
- Thank you for registering
- Application reference number
- Expected verification timeline
- What happens next

### Approval Email:
- Congratulations message
- How to set up availability
- Platform tutorial/walkthrough
- First steps checklist

### Rejection Email:
- Reason for rejection
- What can be corrected
- Re-application process

---

## 💡 Additional Recommendations

### Future Enhancements:
1. **Video Introduction**: Allow therapists to upload a short intro video
2. **Approach & Methods**: Dropdown for therapy approaches (CBT, DBT, Psychodynamic, etc.)
3. **Client Age Groups**: Who they specialize in (Children, Teens, Adults, Seniors)
4. **Issues They Don't Treat**: Important for matching
5. **Cancellation Policy**: Their specific policy
6. **Professional Memberships**: APA, Nigerian Psychological Association, etc.
7. **Publications/Research**: Academic contributions
8. **Consultation Fee**: One-time consultation vs. regular sessions

---

## 🚀 Implementation Priority

### Phase 1 (MVP - Must Have):
- Personal Info, Credentials, Profile, Documents, Consent ✅

### Phase 2 (Important):
- Banking Information, Service Details ✅

### Phase 3 (Nice to Have):
- Availability Notes, Additional Certifications, Video Intro

---

**Total Estimated Time to Complete Form**: 10-15 minutes
**Database Tables Affected**: `users`, `therapist_profiles`, `therapist_enrollments`

