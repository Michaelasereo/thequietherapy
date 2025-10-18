# Therapist Profile Implementation Review

## Overview
This document provides a comprehensive review of how the therapist profile system works, including enrollment, settings page, profile picture management, and data persistence.

---

## 1. Data Flow: Enrollment → Dashboard → Settings

### 1.1 Enrollment Process (`app/therapist/enroll/page.tsx`)

**Initial Data Collection:**
- 4-step enrollment form collects:
  - Basic Details (name, email, phone, qualification)
  - Document Verification (license uploads)
  - Specialization & Languages
  - Terms & Conditions

**Data Submission:**
```typescript
// actions/therapist-auth.ts - Line 31-119
export async function therapistEnrollAction(prevState: any, formData: FormData) {
  // 1. Validates email domain (@thequietherapy.live)
  // 2. Creates enrollment record in therapist_enrollments table
  // 3. Sends magic link to create account
  // 4. Status set to 'pending' (requires admin approval)
}
```

**Database Storage:**
- Enrollment data saved to `therapist_enrollments` table
- Fields: `full_name`, `email`, `phone`, `licensed_qualification`, `specialization`, `languages`
- Initial status: `pending` (admin approval required)

---

## 2. Settings Page Implementation

### 2.1 File Location
`app/therapist/dashboard/settings/page.tsx` (1065 lines)

### 2.2 Data Loading Process

**On Component Mount:**
```typescript
// Lines 170-193: Fetch enrollment data
const fetchEnrollmentData = async () => {
  const response = await fetch('/api/therapist/profile')
  // Loads from therapist_enrollments table via API
}

// Lines 196-291: Update form with fetched data
useEffect(() => {
  if (enrollmentData) {
    // Parses languages and specialization (handles JSON/CSV formats)
    // Populates form fields
    // Sets profile image from enrollment data
  }
}, [enrollmentData, therapistUser])
```

**Data Sources:**
1. **Primary:** `therapist_enrollments` table (via `/api/therapist/profile`)
2. **Fallback:** `therapistUser` context (if enrollment data unavailable)
3. **Image:** `profile_image_url` field from enrollment record

---

## 3. Profile Picture Management

### 3.1 Upload Flow

**Selection (Preview Only):**
```typescript
// Lines 294-331: handleImageUpload
const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
  // 1. Validates file type (JPEG, PNG, WebP)
  // 2. Validates size (max 5MB)
  // 3. Stores file temporarily
  // 4. Creates preview URL
  // 5. Does NOT upload yet - waits for form save
}
```

**Upload on Save:**
```typescript
// Lines 380-410: Image upload during form submission
if (pendingImageFile) {
  const formData = new FormData()
  formData.append('profileImage', pendingImageFile)
  
  const imageResponse = await fetch('/api/therapist/upload-profile-image', {
    method: 'POST',
    body: formData,
  })
  
  uploadedImageUrl = imageData.imageUrl // Supabase Storage URL
}
```

### 3.2 Storage Backend

**API Route:** `app/api/therapist/upload-profile-image/route.ts`

```typescript
// Lines 61-90: Upload to Supabase Storage
const fileName = `therapist-${session.id}-${Date.now()}.${fileExtension}`
const filePath = `therapist-profiles/${fileName}`

await supabase.storage
  .from('profile-images')
  .upload(filePath, buffer, { contentType: file.type })

const imageUrl = urlData.publicUrl
```

**Database Update:**
```typescript
// Lines 128-151: Update enrollment record
await supabase
  .from('therapist_enrollments')
  .update({ 
    profile_image_url: imageUrl,
    updated_at: new Date().toISOString(),
    profile_updated_at: new Date().toISOString(),
    original_enrollment_data: originalEnrollmentData,
    edited_fields: Array.from(editedFields)
  })
  .eq('email', userInfo?.email)
```

---

## 4. Profile Update & Persistence

### 4.1 Update Process

**API Route:** `app/api/therapist/update-profile/route.ts`

**Edit Tracking System:**
```typescript
// Lines 29-62: Preserve original enrollment data (first edit only)
let originalEnrollmentData = currentEnrollment.original_enrollment_data
if (!originalEnrollmentData) {
  // Snapshot current data as "original"
  originalEnrollmentData = {
    full_name: currentEnrollment.full_name,
    phone: currentEnrollment.phone || '',
    licensed_qualification: currentEnrollment.licensed_qualification || '',
    bio: currentEnrollment.bio || '',
    specialization: currentEnrollment.specialization || [],
    languages: currentEnrollment.languages || [],
    gender: currentEnrollment.gender || '',
    age: currentEnrollment.age || null,
    marital_status: currentEnrollment.marital_status || '',
    profile_image_url: currentEnrollment.profile_image_url || ''
  }
}

// Lines 64-143: Track which fields changed
const editedFields = new Set(currentEnrollment.edited_fields || [])
// Compare each field with original, add to editedFields if changed
```

**Database Schema:**
```sql
-- add-profile-edit-tracking.sql
ALTER TABLE therapist_enrollments 
ADD COLUMN edited_fields JSONB DEFAULT '[]',
ADD COLUMN original_enrollment_data JSONB DEFAULT NULL,
ADD COLUMN profile_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
```

### 4.2 Data Refresh After Save

```typescript
// Lines 432-476: Settings page refresh logic
if (response.ok && data.success) {
  // 1. Set justSaved flag (prevent form reset)
  setJustSaved(true)
  
  // 2. Update local state immediately
  setProfileImage(uploadedImageUrl)
  setPendingImageFile(null)
  
  // 3. Force image version increment (cache bust)
  setImageVersion(prev => prev + 1)
  
  // 4. Wait 1 second for database commit
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // 5. Refresh therapist context (bypass cache)
  if (validateSession) {
    await validateSession() // Calls /api/therapist/profile
  }
  await fetchEnrollmentData()
  
  // 6. Second refresh for avatar URL
  await new Promise(resolve => setTimeout(resolve, 300))
  if (validateSession) {
    await validateSession()
  }
}
```

---

## 5. Avatar Display Across Application

### 5.1 Context System

**TherapistUserContext:** `context/therapist-user-context.tsx`

```typescript
// Lines 53-145: Refresh therapist data
const refreshTherapist = useCallback(async () => {
  // Fetches from /api/therapist/profile with cache busting
  const cacheBuster = Date.now()
  const response = await fetch(`/api/therapist/profile?t=${cacheBuster}`, {
    credentials: 'include',
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  })
  
  // Updates therapist state with avatar_url
  setTherapist(therapistData)
}, [user])

// Lines 193-202: Periodic refresh (every 5 minutes)
useEffect(() => {
  const interval = setInterval(() => {
    refreshTherapist()
  }, 5 * 60 * 1000)
}, [user, refreshTherapist])
```

### 5.2 Display Locations

**1. Dashboard Header** (`components/dashboard-header.tsx`)
```typescript
// Lines 45-48: Simple avatar display
<Avatar className="h-8 w-8">
  <AvatarImage src={user.avatar_url} alt={displayName} />
  <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
</Avatar>
```

**2. Settings Page** (`app/therapist/dashboard/settings/page.tsx`)
```typescript
// Lines 532-595: Profile picture with cache busting
<Image
  src={pendingImagePreview || (profileImage ? `${profileImage}?v=${imageVersion}` : '')}
  alt="Profile"
  fill
  className="rounded-full object-cover"
  key={imageVersion} // Force re-render on version change
/>
```

**3. Booking Page** (`components/therapist-card.tsx`)
```typescript
// Lines 82-87: Therapist card on booking flow
<Image
  src={therapist.picture || "/placeholder.svg"}
  alt={therapist.name}
  fill
  className="object-cover"
/>
```

**Note:** The `picture` field comes from API response mapping:
```typescript
// In booking-step-2.tsx line 34-85
therapists.map(t => ({
  ...t,
  picture: t.profile_image_url || t.avatar_url || t.profile_image
}))
```

---

## 6. Key Issues & Concerns

### 6.1 Avatar Not Updating After Save

**Symptoms:**
- Profile picture uploads successfully
- Image URL saved to database
- Avatar doesn't update in header/sidebar
- Requires page refresh to see new avatar

**Root Causes:**

1. **Cache Busting Issues:**
   ```typescript
   // Settings page uses cache busting
   `${profileImage}?v=${imageVersion}`
   
   // BUT: Header might not receive updated URL immediately
   // Context refresh may not propagate quickly enough
   ```

2. **Multiple Data Sources:**
   - Settings page: `enrollmentData.profile_image_url`
   - Context: `therapist.avatar_url`
   - Header: `user.avatar_url`
   - Booking: `therapist.picture`
   
   These may not sync properly!

3. **Timing Issues:**
   ```typescript
   // Settings page waits 1000ms + 300ms
   await new Promise(resolve => setTimeout(resolve, 1000))
   // But is this enough for Supabase propagation?
   ```

4. **Context Update Propagation:**
   ```typescript
   // TherapistUserContext updates every 5 minutes
   // Immediate updates rely on manual refresh calls
   // May not reach all components
   ```

### 6.2 Inconsistent Field Naming

**Database vs Frontend:**
- DB: `profile_image_url` (in therapist_enrollments)
- API: Returns both `avatar_url` AND `profile_image`
- Context: Uses `avatar_url`
- Booking: Maps to `picture`

**Problem:** Multiple aliases cause confusion and sync issues.

### 6.3 Profile API Response Structure

**File:** `app/api/therapist/profile/route.ts`

```typescript
// Lines 176-266: Returns therapist data
const therapistData = {
  id: user.id,
  email: user.email,
  full_name: user.full_name || user.name,
  // ... other fields ...
  profile_image: profileImageUrl,  // From enrollment
  avatar_url: profileImageUrl,     // SAME VALUE, different key!
  // Edit tracking
  edited_fields: editedFields,
  original_enrollment_data: originalEnrollmentData,
  profile_updated_at: profileUpdatedAt,
}
```

**Issue:** Two fields for the same image URL creates confusion.

### 6.4 Missing Real-Time Updates

**Current Flow:**
1. User uploads image in settings
2. Image saved to Supabase Storage
3. URL saved to therapist_enrollments
4. Context refreshed manually
5. **But:** Other open tabs/components don't know about update

**No Mechanism For:**
- Broadcasting updates across components
- Real-time sync between tabs
- Optimistic UI updates

---

## 7. Suggested Improvements

### 7.1 Standardize Field Names

**Recommendation:** Use ONE consistent field name everywhere.

```typescript
// Everywhere in codebase, use:
profile_image_url  // Primary field name

// Update API to return only:
{
  profile_image_url: string
  // Remove: avatar_url, profile_image, picture
}

// Update all components to use:
user.profile_image_url
therapist.profile_image_url
```

### 7.2 Implement Event-Driven Updates

```typescript
// After successful upload, dispatch event:
window.dispatchEvent(new CustomEvent('profile-image-updated', {
  detail: { imageUrl: newImageUrl }
}))

// All components listen:
useEffect(() => {
  const handleUpdate = (e: CustomEvent) => {
    setProfileImage(e.detail.imageUrl)
  }
  window.addEventListener('profile-image-updated', handleUpdate)
  return () => window.removeEventListener('profile-image-updated', handleUpdate)
}, [])
```

### 7.3 Add Optimistic Updates

```typescript
// In settings page, update context immediately
onSubmit = async (values) => {
  // 1. Update local state
  setProfileImage(pendingImagePreview)
  
  // 2. Update context immediately (optimistic)
  therapistContext.updateTherapist({
    ...therapist,
    profile_image_url: pendingImagePreview
  })
  
  // 3. Upload to server
  const result = await uploadImage()
  
  // 4. If failed, rollback
  if (!result.success) {
    setProfileImage(originalImage)
    therapistContext.updateTherapist({ ...therapist, profile_image_url: originalImage })
  }
}
```

### 7.4 Add Loading States

```typescript
// Show spinner during upload
const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)

// Disable interactions during upload
<Button disabled={isUploadingAvatar || isSubmitting}>
  {isUploadingAvatar ? "Uploading..." : "Save Changes"}
</Button>
```

### 7.5 Better Error Handling

```typescript
// Current: Generic error messages
toast({ title: "Error", description: "Failed to update profile" })

// Better: Specific error messages
try {
  await uploadImage()
} catch (error) {
  if (error.code === 'STORAGE_QUOTA_EXCEEDED') {
    toast({ 
      title: "Storage Full", 
      description: "Please delete old images first" 
    })
  } else if (error.code === 'FILE_TOO_LARGE') {
    toast({ 
      title: "File Too Large", 
      description: "Please use an image smaller than 5MB" 
    })
  }
}
```

---

## 8. Database Schema

### Current Tables

**therapist_enrollments:**
```sql
CREATE TABLE therapist_enrollments (
  id UUID PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  licensed_qualification TEXT,
  bio TEXT,
  specialization TEXT[], -- or JSONB
  languages JSONB,
  gender VARCHAR(20),
  age INTEGER,
  marital_status VARCHAR(20),
  status VARCHAR(20) DEFAULT 'pending',
  
  -- Profile image
  profile_image_url TEXT,
  
  -- Edit tracking
  edited_fields JSONB DEFAULT '[]',
  original_enrollment_data JSONB,
  profile_updated_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**users:**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  user_type TEXT CHECK (user_type IN ('client', 'therapist', 'admin')),
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  avatar_url TEXT,
  -- ... other fields
);
```

### Issue: Duplicate Storage

- Profile image stored in `therapist_enrollments.profile_image_url`
- Users table also has `avatar_url` field
- These may not stay in sync!

**Recommendation:** Use single source of truth (therapist_enrollments) and join when needed.

---

## 9. API Endpoints

### Profile Endpoints

1. **GET `/api/therapist/profile`**
   - Returns: Combined user + enrollment data
   - Source: `therapist_enrollments` table (primary)
   - Fallback: `users` table
   - Includes: `avatar_url`, `profile_image`, `edited_fields`

2. **PUT `/api/therapist/update-profile`**
   - Updates: Phone, qualification, bio, specialization, languages, gender, age, marital status
   - Does NOT update: Name, email, profile picture
   - Returns: Edit tracking data

3. **POST `/api/therapist/upload-profile-image`**
   - Uploads: File to Supabase Storage (`profile-images` bucket)
   - Updates: `therapist_enrollments.profile_image_url`
   - Returns: Public URL

4. **GET `/api/therapists`** (Public - for booking)
   - Returns: List of active therapists
   - Includes: `profile_image_url` for booking cards

---

## 10. Testing Checklist

To verify the implementation works correctly:

### Profile Picture Upload
- [ ] Upload new profile picture in settings
- [ ] Verify image appears in settings page immediately
- [ ] Save form
- [ ] Check if avatar updates in header without refresh
- [ ] Refresh page - verify avatar persists
- [ ] Check avatar in sidebar (if applicable)
- [ ] Check avatar in booking flow (different user session)

### Profile Updates
- [ ] Edit bio field
- [ ] Save changes
- [ ] Verify changes persist after refresh
- [ ] Check if edited_fields array updated correctly
- [ ] Verify original_enrollment_data preserved

### Edge Cases
- [ ] Upload image larger than 5MB (should fail)
- [ ] Upload invalid file type (should fail)
- [ ] Cancel edit mode (should revert changes)
- [ ] Upload image then cancel (should clear preview)
- [ ] Multiple quick saves (check for race conditions)
- [ ] Network error during upload (should rollback)

### Cross-Tab Sync
- [ ] Open settings in Tab 1
- [ ] Open dashboard in Tab 2
- [ ] Upload image in Tab 1
- [ ] Check if Tab 2 updates (currently won't - needs event listener)

---

## 11. Common Issues & Solutions

### Issue 1: "Avatar doesn't update after save"

**Diagnosis:**
```bash
# Check if image was uploaded to Supabase
# In Supabase Dashboard > Storage > profile-images bucket
# Look for: therapist-{userId}-{timestamp}.jpg

# Check if database updated
# In Supabase Dashboard > SQL Editor:
SELECT email, profile_image_url, profile_updated_at 
FROM therapist_enrollments 
WHERE email = 'therapist@example.com';
```

**Solution:**
```typescript
// Add manual page reload after successful save
toast({ title: "Success", description: "Profile updated. Refreshing..." })
setTimeout(() => window.location.reload(), 1000)
```

### Issue 2: "Old avatar cached by browser"

**Diagnosis:**
```javascript
// Check image URL in browser console
console.log('Avatar URL:', user.avatar_url)
// If it's the same URL, browser may cache it
```

**Solution:**
```typescript
// Use cache-busting query parameter
const avatarUrl = `${user.avatar_url}?t=${Date.now()}`

// Or use unique filename on upload
const fileName = `therapist-${userId}-${Date.now()}.${ext}`
```

### Issue 3: "Image URL in database but not showing"

**Diagnosis:**
```sql
-- Check all possible avatar fields
SELECT 
  e.email,
  e.profile_image_url as enrollment_avatar,
  u.avatar_url as user_avatar
FROM therapist_enrollments e
JOIN users u ON u.email = e.email
WHERE e.email = 'therapist@example.com';
```

**Solution:**
```typescript
// Ensure API returns the right field
// In /api/therapist/profile:
const profileImageUrl = enrollmentData?.profile_image_url || 
                        profile?.profile_image_url || 
                        null

return {
  avatar_url: profileImageUrl,  // Use same value
  profile_image: profileImageUrl // for all aliases
}
```

---

## 12. File Reference

### Key Files to Review

**Frontend Components:**
1. `app/therapist/dashboard/settings/page.tsx` - Settings page (1065 lines)
2. `app/therapist/enroll/page.tsx` - Enrollment flow
3. `components/therapist-card.tsx` - Booking card display
4. `components/dashboard-header.tsx` - Header avatar
5. `components/therapist-avatar-upload.tsx` - Separate avatar component

**Context & State:**
1. `context/therapist-user-context.tsx` - Therapist data context
2. `context/therapist-dashboard-context.tsx` - Dashboard state

**API Routes:**
1. `app/api/therapist/profile/route.ts` - GET profile data
2. `app/api/therapist/update-profile/route.ts` - PUT profile updates
3. `app/api/therapist/upload-profile-image/route.ts` - POST image upload
4. `app/api/therapist/me/route.ts` - Therapist session data

**Actions (Server-Side):**
1. `actions/therapist-auth.ts` - Enrollment action
2. `app/therapist/profile/actions.ts` - Profile update actions

**Database Migrations:**
1. `add-therapist-profile-fields.sql` - Added gender, age, marital_status
2. `add-profile-edit-tracking.sql` - Added edit tracking fields

---

## 13. Questions for Review

1. **Data Consistency:**
   - Should we use one field name (`profile_image_url`) everywhere?
   - Should `users.avatar_url` be synced with `therapist_enrollments.profile_image_url`?
   - Or should `users` table NOT store avatar at all?

2. **Update Strategy:**
   - Current approach uses polling (5-minute interval) + manual refresh
   - Should we implement WebSocket/SSE for real-time updates?
   - Or is manual refresh acceptable for this use case?

3. **Cache Management:**
   - Current cache busting: Query parameters + version numbers
   - Is this sufficient or should we use ETags/Cache-Control headers?
   - Should images be stored with unique names (no cache bust needed)?

4. **Image Storage:**
   - Currently: Supabase Storage (`profile-images` bucket)
   - Path: `therapist-profiles/{filename}`
   - Should we organize by user ID folder? (`therapist-profiles/{userId}/{filename}`)
   - Should we delete old images when uploading new ones?

5. **Error Recovery:**
   - If upload succeeds but database update fails, we orphan files in storage
   - Should we implement cleanup job for orphaned images?
   - Should we retry failed database updates?

6. **Performance:**
   - Loading enrollment data on every settings page visit
   - Should we cache this data client-side?
   - Should we implement stale-while-revalidate pattern?

---

## Conclusion

The therapist profile system works but has several areas for improvement:

**Strengths:**
✅ Complete enrollment-to-settings data flow
✅ Edit tracking system (original vs edited fields)
✅ Image upload with validation
✅ Multiple display locations (header, settings, booking)

**Weaknesses:**
❌ Inconsistent field naming (avatar_url vs profile_image_url vs picture)
❌ Avatar updates don't propagate immediately across components
❌ No real-time sync between browser tabs
❌ Manual cache busting instead of unique filenames
❌ Multiple data sources that may go out of sync

**Priority Fixes:**
1. Standardize field naming across entire codebase
2. Implement event-driven updates for avatar changes
3. Add optimistic UI updates for better UX
4. Use unique filenames for uploads (eliminate cache issues)
5. Consolidate data source (therapist_enrollments as single source of truth)

---

**Document Prepared:** 2024
**Last Updated:** Current session
**Prepared For:** Senior Developer Review

