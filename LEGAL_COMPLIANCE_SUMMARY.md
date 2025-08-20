# Therapy Web Application - Legal Compliance Summary (Updated)

## **Application Overview**

**Application Name:** Therapy Platform (TRPI App)  
**Target Market:** Nigerian users seeking mental health therapy services  
**Primary Function:** Online therapy sessions with browser-based audio recording and AI-powered transcription

---

## **Core Features**

### **1. Video Therapy Sessions**
- **Provider:** Daily.co integration for secure video conferencing
- **Function:** Real-time video therapy sessions between patients and therapists
- **Features:** Screen sharing, room management
- **⚠️ IMPORTANT:** Raw audio recording is DISABLED on Daily.co for compliance

### **2. Browser-Based Audio Recording & Transcription**
- **Method:** Browser MediaRecorder API (local processing)
- **Provider:** OpenAI Whisper API for speech-to-text conversion
- **Function:** Local audio recording → Direct transcription → Text storage only
- **Compliance:** No raw audio stored on external servers

### **3. User Authentication & Management**
- **Method:** Magic link authentication via email
- **User Types:** Patients, Therapists, Partners, Administrators
- **Session Management:** Secure session tokens and role-based access

### **4. Session Management System**
- **Database:** Supabase (PostgreSQL) for session storage
- **Features:** Appointment scheduling, session notes, progress tracking
- **Data Types:** Session metadata, transcripts, therapeutic notes (NO raw audio)

### **5. Cross-Dashboard Communication**
- **Real-time Updates:** Live status updates across user dashboards
- **Notifications:** System alerts and session reminders
- **Data Sync:** Synchronized data across therapist and patient interfaces

---

## **Data Flow (Compliant Approach)**

### **Data Collection**
1. **User Registration:** Email, full name, phone number, user type
2. **Session Data:** Video streams (Daily.co), local audio recording (browser)
3. **Therapeutic Content:** Session transcripts, progress notes, mood ratings
4. **Medical Information:** Patient complaints, therapy preferences, session outcomes

### **Data Processing**
1. **Local Audio Processing:** Browser MediaRecorder → Local audio capture
2. **Direct Transcription:** Local audio → OpenAI Whisper API → Text only
3. **Data Validation:** Input validation and sanitization before storage

### **Data Storage**
1. **Primary Storage:** Supabase (PostgreSQL) database
2. **Session Notes:** Structured storage of transcripts, SOAP notes, progress tracking
3. **User Data:** Encrypted storage of personal information and authentication data
4. **⚠️ NO Raw Audio Storage:** Raw audio files are never stored

### **Data Transmission**
1. **Video Streams:** Encrypted transmission via Daily.co servers (video only)
2. **Audio Data:** Temporary transmission to OpenAI Whisper API (transcription only)
3. **Database Queries:** Encrypted HTTPS connections to Supabase

### **Data Deletion**
1. **User Request:** Users can request complete data deletion
2. **Retention Policy:** Configurable data retention periods
3. **Cascade Deletion:** Related session data deleted when user account is removed
4. **Audio Cleanup:** Raw audio automatically deleted from browser after processing

---

## **Third-Party Services (Compliance Status)**

### **1. Daily.co (Video Conferencing)**
- **Purpose:** Video session hosting and management
- **Data Shared:** Video streams only (NO audio recording)
- **Location:** International servers
- **Compliance:** ✅ Video-only service, no audio storage

### **2. OpenAI Whisper API (Transcription)**
- **Purpose:** Speech-to-text conversion only
- **Data Shared:** Temporary audio for transcription (no storage)
- **Location:** OpenAI servers (international)
- **Compliance:** ✅ Temporary processing only, no audio retention

### **3. Supabase (Database & Authentication)**
- **Purpose:** Primary data storage and user authentication
- **Data Stored:** User data, sessions, transcripts, medical notes (NO raw audio)
- **Location:** Cloud-hosted (configurable region selection)
- **Compliance:** ✅ Text-only storage, encrypted

### **4. Browser MediaRecorder API (Local Processing)**
- **Purpose:** Local audio recording and processing
- **Data Processed:** Audio captured and processed locally
- **Location:** User's browser (local device)
- **Compliance:** ✅ Local processing only, no external storage

---

## **Data Storage Location**

### **Primary Data Storage**
- **Platform:** Supabase (PostgreSQL)
- **Location:** Cloud-hosted (configurable for Nigeria compliance)
- **Recommendation:** Configure Supabase region for Nigeria or West Africa

### **Audio Processing Location**
- **Browser Storage:** Temporary audio processing (local device only)
- **Processing Queue:** Temporary audio files during transcription (local)
- **⚠️ NO External Audio Storage:** Raw audio never stored on external servers

### **Data Residency Considerations**
- **NDPR Compliance:** Data stored within Nigeria or approved jurisdictions
- **Healthcare Data:** Medical information requires additional security measures
- **Audio Compliance:** No raw audio stored externally - maximum privacy protection

---

## **Security Measures**

### **Data Encryption**
- **In Transit:** TLS 1.3 encryption for all data transmission
- **At Rest:** Database-level encryption for stored data
- **API Communications:** Encrypted HTTPS connections to all third-party services

### **Authentication & Access Control**
- **Multi-factor Authentication:** Email-based magic link authentication
- **Role-based Access:** Different permission levels for patients, therapists, admins
- **Session Management:** Secure session tokens with expiration
- **Row Level Security (RLS):** Database-level access controls

### **Audio Data Protection**
- **Local Processing:** All audio processing happens in user's browser
- **No External Storage:** Raw audio never stored on external servers
- **Temporary Transmission:** Audio sent to OpenAI only for transcription
- **Automatic Cleanup:** Raw audio deleted after processing

---

## **User Rights & Consent Management**

### **Consent Collection**
- **Explicit Consent:** Users must actively consent to data processing
- **Granular Consent:** Separate consent for transcription services
- **Audio Consent:** Clear explanation of local audio processing
- **Withdrawal Rights:** Users can withdraw consent at any time

### **Data Subject Rights (NDPR)**
- **Right to Access:** Users can request their personal data
- **Right to Rectification:** Users can correct inaccurate data
- **Right to Erasure:** Users can request complete data deletion
- **Right to Portability:** Users can export their data
- **Right to Object:** Users can object to data processing

### **Audio-Specific Rights**
- **Opt-out of Transcription:** Users can disable AI transcription
- **Local Processing Only:** Users control their audio data
- **No External Audio Storage:** Maximum privacy protection

---

## **Medical Context & Healthcare Compliance**

### **Sensitive Health Data**
- **Data Classification:** Therapy sessions contain sensitive mental health information
- **Legal Framework:** Subject to NDPR, healthcare regulations, and medical confidentiality laws
- **Professional Standards:** Must comply with therapist-patient confidentiality requirements

### **Healthcare Compliance Requirements**
- **Medical Records:** Session notes and transcripts constitute medical records
- **Confidentiality:** All therapy-related data must be kept confidential
- **Audio Confidentiality:** No raw audio stored externally - maximum protection
- **Professional Oversight:** Therapists must have access to and control over patient data
- **Audit Trails:** Complete audit trails for all data access and modifications

### **Special Considerations**
- **Mental Health Data:** Particularly sensitive category requiring enhanced protection
- **Therapist-Patient Privilege:** Legal protection for therapy communications
- **Audio Privacy:** Local audio processing maintains maximum confidentiality
- **Emergency Situations:** Protocols for handling crisis situations and mandatory reporting
- **Data Retention:** Medical records retention requirements may exceed standard data retention

---

## **Compliance Recommendations**

### **Immediate Actions Required**
1. **Data Residency:** Configure Supabase for Nigeria-based data storage
2. **Privacy Policy:** Develop comprehensive privacy policy compliant with NDPR
3. **Terms of Service:** Create terms addressing therapy-specific legal requirements
4. **Consent Forms:** Develop detailed consent forms for data processing
5. **Audio Processing Notice:** Clear explanation of local audio processing

### **Legal Review Required**
1. **Healthcare Regulations:** Review compliance with Nigerian healthcare laws
2. **Professional Licensing:** Ensure compliance with therapist licensing requirements
3. **Insurance Requirements:** Verify professional liability insurance coverage
4. **Data Protection Impact Assessment:** Conduct DPIA for healthcare data processing
5. **Audio Processing Compliance:** Verify local audio processing compliance

### **Technical Enhancements**
1. **Audit Logging:** Implement comprehensive audit trails
2. **Data Encryption:** Enhance encryption for medical data
3. **Access Controls:** Strengthen role-based access controls
4. **Backup Security:** Secure backup procedures for medical data
5. **Audio Processing Monitoring:** Monitor for any external audio storage

---

## **Risk Assessment**

### **Low-Risk Areas (Due to Local Processing)**
- **Audio Data Storage:** No raw audio stored externally
- **Local Processing:** Audio processed in user's browser only
- **Minimal Data Transfer:** Only transcripts stored in database

### **Medium-Risk Areas**
- **International Data Transfer:** Daily.co video streams and OpenAI transcription
- **Medical Data Sensitivity:** Therapy sessions contain highly sensitive information
- **Third-party Dependencies:** Reliance on external services for core functionality

### **Mitigation Strategies**
- **Data Localization:** Configure services for Nigeria-based data storage where possible
- **Encryption Standards:** Implement highest-level encryption for medical data
- **Service Agreements:** Ensure third-party services comply with NDPR requirements
- **Regular Audits:** Conduct regular security and compliance audits
- **Audio Processing Controls:** Monitor and control all audio processing

---

## **Compliance Status Summary**

### **✅ Compliant Features**
- **Local Audio Processing:** All audio handled in browser
- **No Raw Audio Storage:** No external audio storage
- **Transcript Only Storage:** Only text stored in database
- **Encrypted Communications:** All data transmission encrypted
- **User Consent Management:** Comprehensive consent system

### **⚠️ Areas Requiring Attention**
- **Video Stream Location:** Daily.co servers (international)
- **Transcription Processing:** OpenAI servers (international)
- **Data Residency:** Configure for Nigeria compliance
- **Legal Documentation:** Privacy policy and terms of service

---

**Note:** This summary reflects the updated compliance approach with disabled Daily.co audio recording and browser-based MediaRecorder processing. This approach significantly improves NDPR compliance and data privacy protection for Nigerian users.
