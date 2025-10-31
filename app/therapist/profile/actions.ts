'use server'

import { createClient } from '@supabase/supabase-js'
import { ServerSessionManager } from '@/lib/server-session-manager'
import { revalidatePath } from 'next/cache'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Update therapist profile with proper validation and RLS
 */
export async function updateTherapistProfile(formData: FormData) {
  try {
    // Authentication check
    const session = await ServerSessionManager.getSession()
    if (!session || session.role !== 'therapist') {
      return { success: false, error: 'Unauthorized' }
    }

    // Extract and validate form data
    const phone = formData.get('phone') as string
    const licensedQualification = formData.get('licensedQualification') as string
    const bio = formData.get('bio') as string
    const gender = formData.get('gender') as string
    const maritalStatus = formData.get('maritalStatus') as string
    const age = formData.get('age') as string
    
    // Parse array fields
    const specialization = formData.get('specialization') 
      ? JSON.parse(formData.get('specialization') as string) 
      : []
    const languages = formData.get('languages') 
      ? JSON.parse(formData.get('languages') as string) 
      : []

    // Get current enrollment data
    const { data: currentEnrollment, error: fetchError } = await supabase
      .from('therapist_enrollments')
      .select('*')
      .eq('email', session.email)
      .single()

    if (fetchError || !currentEnrollment) {
      console.error('❌ Error fetching enrollment:', fetchError)
      return { success: false, error: 'Enrollment not found' }
    }

    // Preserve original enrollment data on first edit
    let originalEnrollmentData = currentEnrollment.original_enrollment_data
    if (!originalEnrollmentData) {
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

    // Track edited fields
    const editedFields = new Set(currentEnrollment.edited_fields || [])
    
    // Build update object and track changes
    const updateData: any = {
      updated_at: new Date().toISOString(),
      profile_updated_at: new Date().toISOString(),
      original_enrollment_data: originalEnrollmentData
    }

    // Only update and track fields that changed from original
    if (phone && phone !== originalEnrollmentData.phone) {
      updateData.phone = phone
      editedFields.add('phone')
    }
    if (licensedQualification && licensedQualification !== originalEnrollmentData.licensed_qualification) {
      updateData.licensed_qualification = licensedQualification
      editedFields.add('licensed_qualification')
    }
    if (bio && bio !== originalEnrollmentData.bio) {
      updateData.bio = bio
      editedFields.add('bio')
    }
    if (specialization?.length > 0) {
      const originalSpec = Array.isArray(originalEnrollmentData.specialization) 
        ? originalEnrollmentData.specialization : []
      if (JSON.stringify(specialization.sort()) !== JSON.stringify(originalSpec.sort())) {
        updateData.specialization = specialization
        editedFields.add('specialization')
      }
    }
    if (languages?.length > 0) {
      const originalLangs = Array.isArray(originalEnrollmentData.languages) 
        ? originalEnrollmentData.languages : []
      if (JSON.stringify(languages.sort()) !== JSON.stringify(originalLangs.sort())) {
        updateData.languages = languages
        editedFields.add('languages')
      }
    }
    if (gender && gender !== originalEnrollmentData.gender) {
      updateData.gender = gender
      editedFields.add('gender')
    }
    if (maritalStatus && maritalStatus !== originalEnrollmentData.marital_status) {
      updateData.marital_status = maritalStatus
      editedFields.add('marital_status')
    }
    if (age && age !== originalEnrollmentData.age) {
      updateData.age = parseInt(age)
      editedFields.add('age')
    }

    updateData.edited_fields = Array.from(editedFields)

    // Update database
    const { error } = await supabase
      .from('therapist_enrollments')
      .update(updateData)
      .eq('email', session.email)

    if (error) {
      console.error('❌ Error updating profile:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ Profile updated successfully')
    console.log('🔍 Edited fields:', updateData.edited_fields)

    // Revalidate all therapist pages
    revalidatePath('/therapist/dashboard')
    revalidatePath('/therapist/dashboard/settings')

    return { 
      success: true, 
      editedFields: updateData.edited_fields,
      profileUpdatedAt: updateData.profile_updated_at
    }
  } catch (error) {
    console.error('❌ Server action error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Upload therapist avatar with proper validation
 */
export async function uploadTherapistAvatar(formData: FormData) {
  try {
    // Authentication check
    const session = await ServerSessionManager.getSession()
    if (!session || session.role !== 'therapist') {
      return { success: false, error: 'Unauthorized' }
    }

    const file = formData.get('avatar') as File
    if (!file) {
      return { success: false, error: 'No file provided' }
    }

    console.log('📸 Avatar upload requested for:', session.email)

    // ✅ USE UNIFIED AVATAR SERVICE FOR 3-WAY SYNC
    // This ensures avatar is synced across:
    // - users.avatar_url
    // - therapist_enrollments.profile_image_url
    // - therapist_profiles.profile_image_url
    const { AvatarService } = await import('@/lib/services/avatar-service')
    
    const result = await AvatarService.uploadAndSyncAvatar(
      file,
      session.email!,
      session.id
    )

    if (!result.success) {
      console.error('❌ Avatar upload failed:', result.error)
      return { success: false, error: result.error }
    }

    console.log('✅ Avatar uploaded and synced to all tables:', {
      imageUrl: result.imageUrl,
      syncedTables: result.syncedTables,
      warnings: result.warnings
    })

    // Get current enrollment for edit tracking
    const { data: currentEnrollment } = await supabase
      .from('therapist_enrollments')
      .select('edited_fields')
      .eq('email', session.email)
      .single()

    // Track image as edited field
    const editedFields = new Set(currentEnrollment?.edited_fields || [])
    editedFields.add('profile_image_url')

    await supabase
      .from('therapist_enrollments')
      .update({
        profile_updated_at: new Date().toISOString(),
        edited_fields: Array.from(editedFields)
      })
      .eq('email', session.email)

    console.log('✅ Edit tracking updated')

    // Revalidate pages
    revalidatePath('/therapist/dashboard')
    revalidatePath('/therapist/dashboard/settings')

    return {
      success: true,
      imageUrl: result.imageUrl,
      message: 'Avatar uploaded and synced successfully',
      syncedTables: result.syncedTables,
      warnings: result.warnings
    }
  } catch (error) {
    console.error('❌ Server action error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Reset a field to its enrollment default value
 */
export async function resetFieldToDefault(fieldName: string) {
  try {
    const session = await ServerSessionManager.getSession()
    if (!session || session.role !== 'therapist') {
      return { success: false, error: 'Unauthorized' }
    }

    // Get current enrollment
    const { data: enrollment, error: fetchError } = await supabase
      .from('therapist_enrollments')
      .select('*')
      .eq('email', session.email)
      .single()

    if (fetchError || !enrollment) {
      return { success: false, error: 'Enrollment not found' }
    }

    const originalData = enrollment.original_enrollment_data
    if (!originalData) {
      return { success: false, error: 'No original data to restore' }
    }

    // Get original value
    const originalValue = originalData[fieldName]
    
    // Remove from edited fields
    const editedFields = (enrollment.edited_fields || []).filter((f: string) => f !== fieldName)

    // Update database
    const { error } = await supabase
      .from('therapist_enrollments')
      .update({
        [fieldName]: originalValue,
        edited_fields: editedFields,
        updated_at: new Date().toISOString()
      })
      .eq('email', session.email)

    if (error) {
      return { success: false, error: error.message }
    }

    // Revalidate
    revalidatePath('/therapist/dashboard/settings')

    return { success: true, restoredValue: originalValue }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

