# Avatar Update Fix - Cache Busting Implementation

## 🎯 **Problem**
Avatar images weren't updating in the UI after uploading a new profile picture, even though:
- ✅ Image uploaded successfully to Supabase
- ✅ Database updated with new URL
- ✅ API returned new URL
- ✅ Context refreshed with new data

**Root Cause**: Browser and React were caching the old image.

---

## ✅ **Solution: Cache-Busting with Version Tracking**

### Implementation Overview
1. Added version counter that increments when avatar URL changes
2. Appended version as query parameter to force browser to fetch new image
3. Used `key` prop to force React component re-mount

---

## 📝 **Code Changes**

### 1. **TherapistHeader Component** (`components/therapist-header.tsx`)

**Added**:
```typescript
// Cache-busting version tracker
const [avatarVersion, setAvatarVersion] = useState(0)

// Update version when avatar URL changes
useEffect(() => {
  if (user.avatar_url) {
    console.log('🔄 TherapistHeader: Avatar URL changed, incrementing version')
    setAvatarVersion(prev => prev + 1)
  }
}, [user.avatar_url])

// Add cache-busting parameter to avatar URL
const avatarUrlWithCacheBust = user.avatar_url 
  ? `${user.avatar_url}?v=${avatarVersion}`
  : undefined
```

**Updated Avatar**:
```tsx
<Avatar className="h-8 w-8" key={avatarVersion}>
  {avatarUrlWithCacheBust ? (
    <AvatarImage 
      src={avatarUrlWithCacheBust} 
      alt={displayName}
      key={avatarVersion}
    />
  ) : null}
  <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
</Avatar>
```

### 2. **Settings Page** (`app/therapist/dashboard/settings/page.tsx`)

**Added**:
```typescript
const [imageVersion, setImageVersion] = useState(0)

// Force image refresh when profile image URL changes
useEffect(() => {
  if (profileImage) {
    console.log('🔄 Settings: Profile image changed, incrementing version')
    setImageVersion(prev => prev + 1)
  }
}, [profileImage])
```

**After Save**:
```typescript
// Force image version increment to bust cache
setImageVersion(prev => prev + 1)
```

**Updated Image Display**:
```tsx
<div className="relative w-24 h-24" key={imageVersion}>
  <Image
    src={pendingImagePreview || (profileImage ? `${profileImage}?v=${imageVersion}` : '')}
    alt="Profile"
    fill
    className="rounded-full object-cover border-2 border-gray-200"
    key={imageVersion}
  />
</div>
```

### 3. **Context with Aggressive Cache Headers** (`context/therapist-user-context.tsx`)

```typescript
const cacheBuster = Date.now()
const response = await fetch(`/api/therapist/profile?t=${cacheBuster}`, {
  credentials: 'include',
  headers: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  }
})
```

### 4. **Image Upload API with Edit Tracking** (`app/api/therapist/upload-profile-image/route.ts`)

Now tracks image uploads:
```typescript
const editedFields = new Set(currentEnrollment?.edited_fields || [])
editedFields.add('profile_image_url')

await supabase
  .from('therapist_enrollments')
  .update({ 
    profile_image_url: imageUrl,
    profile_updated_at: new Date().toISOString(),
    original_enrollment_data: originalEnrollmentData,
    edited_fields: Array.from(editedFields)
  })
```

---

## 🔄 **How It Works**

### Upload Flow:
```
1. User selects image → Preview shows
2. User clicks "Save Changes"
3. Image uploads to Supabase → Returns URL
   Example: https://.../therapist-77ee...-1760722896122.jpeg
   
4. Update profile API called
5. setProfileImage(newUrl) → Triggers useEffect
6. setImageVersion(prev => prev + 1) → Version goes from 0 to 1
7. Image src becomes: https://.../therapist-77ee...-1760722896122.jpeg?v=1
   
8. Context refreshes → Gets new avatar_url
9. Layout receives new therapist.avatar_url
10. Header receives new user.avatar_url
11. Header's useEffect triggers → setAvatarVersion(prev => prev + 1)
12. Header avatar src becomes: https://.../therapist-77ee...-1760722896122.jpeg?v=1
13. Browser sees NEW URL → Fetches fresh image
```

### Why This Works:
- **Browser**: Treats `image.jpg?v=1` as completely different from `image.jpg?v=0`
- **React**: `key` prop forces component re-mount
- **Radix Avatar**: Gets fresh `src` and bypasses internal cache

---

## 📊 **Expected Console Output**

```
🔄 Settings: Profile image changed, incrementing version
🔄 Settings: Incrementing image version for cache bust
⏳ Waiting for database to update...
🔄 Refreshing therapist context...
🔄 TherapistContext: Fetching profile with cache buster: 1760722896122
🔍 TherapistContext: New avatar_url: https://.../image.jpeg
🔄 TherapistHeader: Avatar URL changed, incrementing version
🔍 TherapistHeader: avatarUrlWithCacheBust: https://.../image.jpeg?v=2
✅ Context refreshed, exiting edit mode
```

---

## ✨ **Benefits**

1. **No Page Reload Required** - Image updates live
2. **Works Across All Components** - Header, settings, everywhere
3. **Persistent Across Navigations** - Avatar stays updated
4. **Browser Cache Friendly** - Each version is properly cached
5. **Fallback to First Letter** - Shows initials when no image

---

## 🧪 **Testing**

1. Go to `/therapist/dashboard/settings`
2. Click "Edit Profile"
3. Upload new profile picture
4. Click "Save Changes"
5. Watch console logs for version increments
6. **Avatar should update immediately** in:
   - Settings form (big avatar)
   - Header (top-right small avatar)
7. Navigate to `/therapist/dashboard` → Avatar persists
8. Refresh page → Avatar still there

---

## 🔧 **If Issues Persist**

If the avatar STILL doesn't update after implementing cache-busting:

### Fallback Option: Auto Page Reload

Uncomment these lines in `app/therapist/dashboard/settings/page.tsx` (around line 472):

```typescript
// Force a full page refresh to ensure avatar updates everywhere
setTimeout(() => {
  window.location.reload()
}, 1500)
```

This provides a 1.5-second delay to show the success message, then refreshes the entire page, guaranteeing the new avatar displays everywhere.

---

## 📈 **Version Tracking Behavior**

- **Initial Load**: `avatarVersion = 0`
- **First Upload**: `avatarVersion = 1` → URL becomes `image.jpeg?v=1`
- **Second Upload**: `avatarVersion = 2` → URL becomes `image.jpeg?v=2`
- **Each Upload**: Version increments, forcing new fetch

The browser caches each version independently, so navigation is fast but updates are immediate.

---

Generated: 2025-10-17  
Status: ✅ Implemented - Test Now  
Expected Result: Avatar updates live without page reload

