# Therapist Enrollment System - Comprehensive Review

## Executive Summary
Found **CRITICAL ISSUE**: ID documents uploaded in Step 2 are **NOT being saved** to the database or uploaded to storage. The files are collected in the form but lost during submission.

---

## Enrollment Flow Analysis

### Current Flow:
1. **Step 1 (Basic Details)** ✅ Works
   - Collects: fullName, email, phone, gender, age, maritalStatus, bio
   - **Profile image**: Uploaded to Supabase Storage ✅
   - File stored in `formData.profileImageFile`

2. **Step 2 (Document Verification)** ❌ **BROKEN**
   - Collects: `idUpload` (FileList), `licensedQualification` (string)
   - **ID Document**: File is collected but **NEVER uploaded** ❌
   - Only `licensedQualification` is saved to database
   - File reference stored in `formData.idUpload` but lost on submission

3. **Step 3 (Specialization & Languages)** ✅ Works
   - Collects: specialization[], languages[]
   - Data saved correctly

4. **Step 4 (Terms & Submission)** ⚠️ **INCOMPLETE**
   - Form submission occurs
   - Only sends: email, fullName, phone, licensedQualification, specialization, languages, gender, age, maritalStatus, bio, profileImage
   - **Missing: idUpload file from Step 2**

---

## Code Flow Details

### Form Submission (`app/therapist/enroll/page.tsx`)
```typescript
// Line 54-55: Combines form data
const finalData = { ...formData, ...data }

// Line 65-80: Creates FormData to send
const formDataToSend = new FormData()
formDataToSend.append('email', finalData.email)
formDataToSend.append('fullName', finalData.fullName)
// ... other fields ...
formDataToSend.append('profileImage', profileImageFile) // ✅ Profile image included

// ❌ MISSING: idUpload file from Step 2 is NOT included!
```

### API Route (`app/api/therapist/enroll/route.ts`)
```typescript
// Lines 38-77: Only handles profile image
let profileImageFile: File | null = null

if (contentType.includes('multipart/form-data')) {
  // ... extracts profileImage ...
  const imageFile = formData.get('profileImage') as File | null
  if (imageFile && imageFile.size > 0) {
    profileImageFile = imageFile
  }
  // ❌ NO CODE to extract idUpload file!
}

// Lines 111-161: Uploads profile image to Supabase Storage
// ❌ NO CODE to upload ID document!

// Lines 167-209: Inserts enrollment data
// ❌ NO CODE to save id_document or license_document fields!
```

### Step 2 Component (`components/therapist-enrollment-steps/step-2-document-verification.tsx`)
```typescript
// Line 13: Validates that file is required
idUpload: z.any().refine((file) => file?.length > 0, "ID document is required.")

// Line 43-52: onSubmit just passes data along
async function onSubmit(data: DocumentVerificationFormValues) {
  // Just shows a toast and passes data
  onNext(data) // ❌ File is passed but never uploaded!
}
```

---

## Database Schema

### `therapist_enrollments` Table Columns (Available but Unused):
- ✅ `license_document TEXT` - Available but never populated
- ✅ `id_document TEXT` - Available but never populated
- ✅ `license_uploaded_at TIMESTAMP` - Available but never populated
- ✅ `id_uploaded_at TIMESTAMP` - Available but never populated
- ✅ `license_verified BOOLEAN` - Available but never populated
- ✅ `id_verified BOOLEAN` - Available but never populated

**Problem**: Schema supports document storage, but enrollment code doesn't use it.

---

## Document Upload API Analysis

### `/api/therapist/upload-document/route.ts`
- ✅ Exists and works
- ❌ **Requires authentication** (user must be logged in)
- ❌ **Cannot be used during enrollment** (user doesn't exist yet)
- Only works **after** enrollment is complete and user is logged in

### `/api/upload-document/route.ts`
- ✅ Exists and can upload to Supabase Storage
- ⚠️ Requires `therapistId` parameter
- ⚠️ Not called during enrollment flow

---

## Problems Identified

### 1. **CRITICAL: ID Documents Not Uploaded** ❌
- **Location**: Step 2 → API Route
- **Issue**: ID document file collected in Step 2 is never uploaded to storage or saved to database
- **Impact**: Users submit ID documents but they're lost
- **Fix Required**: Modify enrollment API to handle document uploads

### 2. **Missing Document Upload in Enrollment Flow** ❌
- **Location**: `app/api/therapist/enroll/route.ts`
- **Issue**: API only handles profile image, not ID documents
- **Impact**: Documents are collected but discarded
- **Fix Required**: Add document upload logic similar to profile image

### 3. **Form Data Not Including Documents** ⚠️
- **Location**: `app/therapist/enroll/page.tsx` line 65-80
- **Issue**: FormData sent to API doesn't include `idUpload` file
- **Impact**: Documents never reach the API
- **Fix Required**: Add document file to FormData before submission

### 4. **Database Fields Not Populated** ⚠️
- **Location**: `app/api/therapist/enroll/route.ts` line 167-209
- **Issue**: `id_document` and `license_document` columns exist but insertData doesn't include them
- **Impact**: Even if uploaded, documents wouldn't be saved
- **Fix Required**: Add document URLs to insertData

### 5. **Document Upload API Mismatch** ⚠️
- **Location**: `/api/therapist/upload-document/route.ts`
- **Issue**: Requires authentication, can't be used during enrollment
- **Impact**: No way to upload documents during enrollment
- **Note**: This is OK if we fix enrollment API to handle documents directly

---

## Recommended Fixes

### Fix 1: Include Document File in Form Submission
**File**: `app/therapist/enroll/page.tsx`

Add to FormData creation (around line 78):
```typescript
// Add ID document file if provided
const idUploadFile = finalData.idUpload?.[0] as File | undefined
if (idUploadFile) {
  formDataToSend.append('idDocument', idUploadFile)
}
```

### Fix 2: Extract Document in API Route
**File**: `app/api/therapist/enroll/route.ts`

Add to file extraction (around line 60):
```typescript
let idDocumentFile: File | null = null

if (contentType.includes('multipart/form-data')) {
  // ... existing code ...
  
  // Get ID document file if provided
  const idDocFile = formData.get('idDocument') as File | null
  if (idDocFile && idDocFile.size > 0) {
    idDocumentFile = idDocFile
  }
}
```

### Fix 3: Upload Document to Storage
**File**: `app/api/therapist/enroll/route.ts`

Add after profile image upload (around line 155):
```typescript
// Handle ID document upload if provided
let idDocumentUrl: string | null = null

if (idDocumentFile) {
  try {
    console.log('📄 Uploading ID document during enrollment...')
    
    // Generate unique file name
    const fileExtension = idDocumentFile.name.split('.').pop()?.toLowerCase() || 'pdf'
    const tempId = `enroll-${Date.now()}-${Math.random().toString(36).substring(7)}`
    const fileName = `id-document-${tempId}.${fileExtension}`
    const filePath = `therapist-documents/enrollment/${fileName}`
    
    // Convert file to buffer
    const arrayBuffer = await idDocumentFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('therapist-documents')
      .upload(filePath, buffer, {
        contentType: idDocumentFile.type,
        upsert: false
      })
    
    if (uploadError) {
      console.error('❌ ID document upload error:', uploadError)
      console.warn('⚠️  Continuing enrollment without ID document due to upload error')
    } else {
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('therapist-documents')
        .getPublicUrl(filePath)
      
      idDocumentUrl = urlData.publicUrl
      console.log('✅ ID document uploaded:', idDocumentUrl)
    }
  } catch (docError) {
    console.error('❌ Error handling ID document:', docError)
    console.warn('⚠️  Continuing enrollment without ID document due to processing error')
  }
}
```

### Fix 4: Save Document URL to Database
**File**: `app/api/therapist/enroll/route.ts`

Add to insertData (around line 177):
```typescript
const insertData: any = {
  // ... existing fields ...
  id_document: idDocumentUrl, // Add ID document URL
  id_uploaded_at: idDocumentUrl ? new Date().toISOString() : null,
  // ... rest of fields ...
}
```

### Fix 5: Cleanup on Error
**File**: `app/api/therapist/enroll/route.ts`

Add to error cleanup (around line 224):
```typescript
// If enrollment failed and we uploaded documents, try to clean them up
if (idDocumentUrl) {
  try {
    const urlParts = idDocumentUrl.split('/')
    const bucketIndex = urlParts.findIndex((part: string) => part === 'therapist-documents')
    if (bucketIndex !== -1) {
      const filePath = urlParts.slice(bucketIndex + 1).join('/')
      await supabase.storage
        .from('therapist-documents')
        .remove([filePath])
    }
  } catch (cleanupError) {
    console.error('Failed to cleanup uploaded document:', cleanupError)
  }
}
```

---

## Testing Checklist

After implementing fixes, test:

1. ✅ Complete enrollment with ID document upload
2. ✅ Verify document appears in Supabase Storage (`therapist-documents/enrollment/`)
3. ✅ Verify `id_document` field is populated in `therapist_enrollments` table
4. ✅ Verify `id_uploaded_at` timestamp is set
5. ✅ Test enrollment without ID document (should still work)
6. ✅ Test enrollment with invalid document (should handle gracefully)
7. ✅ Verify document cleanup on enrollment failure
8. ✅ Test with large documents (should respect size limits)

---

## Additional Notes

### Storage Bucket Requirements
- Ensure `therapist-documents` bucket exists in Supabase Storage
- Set appropriate RLS policies for document access
- Consider privacy: documents should only be accessible to admins

### License Document
- Currently, only `licensedQualification` (string) is saved
- `license_document` field exists but is never used
- Consider if license document file upload is needed (separate from ID document)

### Verification Flow
- Documents are uploaded but `id_verified` and `license_verified` remain `false`
- Admin verification process should update these fields
- Consider adding admin interface to view and verify documents

---

## Summary

**Main Issue**: ID documents from Step 2 are collected but never uploaded or saved.

**Root Cause**: Enrollment API only handles profile image, not ID documents.

**Solution**: Extend enrollment API to handle ID document uploads similar to profile images.

**Priority**: **HIGH** - Users are submitting documents that are being lost.

