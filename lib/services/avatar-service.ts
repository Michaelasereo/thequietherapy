/**
 * Avatar Service - Unified Avatar Management
 * 
 * Ensures avatar updates are synced across all 3 tables:
 * - users.avatar_url
 * - therapist_enrollments.profile_image_url
 * - therapist_profiles.profile_image_url
 * 
 * USE THIS SERVICE for all avatar operations to prevent inconsistency.
 */

import { createClient } from '@supabase/supabase-js'
import { EnhancedTherapistConsistency } from '@/lib/therapist-consistency-enhanced'
import { therapistEvents, THERAPIST_EVENTS } from '@/lib/events'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface AvatarUploadResult {
  success: boolean
  imageUrl?: string
  error?: string
  syncedTables?: string[]
  warnings?: string[]
}

export interface AvatarValidationResult {
  valid: boolean
  error?: string
}

export interface AvatarConsistencyCheck {
  consistent: boolean
  details: {
    users?: string | null
    enrollments?: string | null
    profiles?: string | null
  }
  inconsistencies?: string[]
}

export class AvatarService {
  /**
   * Upload and sync avatar across all 3 tables atomically
   * 
   * This is the PRIMARY method to use for avatar uploads
   */
  static async uploadAndSyncAvatar(
    file: File,
    therapistEmail: string,
    therapistId: string
  ): Promise<AvatarUploadResult> {
    try {
      console.log('🎨 AvatarService: Starting upload for', therapistEmail)

      // Step 1: Validate file
      const validation = this.validateFile(file)
      if (!validation.valid) {
        console.error('❌ Validation failed:', validation.error)
        return { success: false, error: validation.error }
      }

      // Step 2: Upload to Supabase Storage
      const uploadResult = await this.uploadToStorage(file, therapistId)
      if (!uploadResult.success) {
        console.error('❌ Upload failed:', uploadResult.error)
        return { success: false, error: uploadResult.error }
      }

      const imageUrl = uploadResult.imageUrl!
      const filePath = uploadResult.filePath!

      console.log('✅ File uploaded to storage:', imageUrl)

      // Step 3: Sync to all 3 tables using EnhancedTherapistConsistency
      console.log('🔄 Syncing avatar to all tables...')
      const syncResult = await EnhancedTherapistConsistency.syncAvatar(
        therapistEmail,
        imageUrl
      )

      if (!syncResult.success) {
        console.error('❌ Sync failed, rolling back storage upload')
        // Rollback: Delete uploaded file
        await this.deleteFromStorage(filePath)
        return { 
          success: false, 
          error: 'Failed to sync avatar to database',
          warnings: syncResult.warnings
        }
      }

      console.log('✅ Avatar synced to tables:', syncResult.syncedTables)

      // Step 4: Emit event for real-time UI updates
      console.log('📡 Emitting AVATAR_UPDATED event')
      therapistEvents.emit(THERAPIST_EVENTS.AVATAR_UPDATED, {
        profile_image_url: imageUrl,
        timestamp: Date.now(),
        syncedTables: syncResult.syncedTables,
        source: 'avatar-service'
      })

      return {
        success: true,
        imageUrl,
        syncedTables: syncResult.syncedTables,
        warnings: syncResult.warnings
      }

    } catch (error) {
      console.error('❌ AvatarService unexpected error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * Update avatar from existing URL (e.g., from external source)
   */
  static async updateAvatarFromUrl(
    imageUrl: string,
    therapistEmail: string
  ): Promise<AvatarUploadResult> {
    try {
      console.log('🔄 AvatarService: Updating avatar from URL for', therapistEmail)

      // Sync to all 3 tables
      const syncResult = await EnhancedTherapistConsistency.syncAvatar(
        therapistEmail,
        imageUrl
      )

      if (!syncResult.success) {
        return {
          success: false,
          error: 'Failed to sync avatar',
          warnings: syncResult.warnings
        }
      }

      // Emit event
      therapistEvents.emit(THERAPIST_EVENTS.AVATAR_UPDATED, {
        profile_image_url: imageUrl,
        timestamp: Date.now(),
        syncedTables: syncResult.syncedTables,
        source: 'avatar-service-url'
      })

      return {
        success: true,
        imageUrl,
        syncedTables: syncResult.syncedTables,
        warnings: syncResult.warnings
      }

    } catch (error) {
      console.error('❌ AvatarService URL update error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * Validate file type and size
   */
  private static validateFile(file: File): AvatarValidationResult {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Invalid file type. Please upload JPEG, PNG, or WebP.'
      }
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'File too large. Maximum size is 5MB.'
      }
    }

    // Check if file is actually an image
    if (!file.name.match(/\.(jpg|jpeg|png|webp)$/i)) {
      return {
        valid: false,
        error: 'Invalid file extension.'
      }
    }

    return { valid: true }
  }

  /**
   * Upload file to Supabase Storage
   */
  private static async uploadToStorage(
    file: File,
    therapistId: string
  ): Promise<{ success: boolean; imageUrl?: string; filePath?: string; error?: string }> {
    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `therapist-${therapistId}-${Date.now()}.${fileExt}`
      const filePath = `therapist-profiles/${fileName}`

      // Convert file to buffer
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      console.log('📤 Uploading to storage:', filePath)

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, buffer, {
          contentType: file.type,
          upsert: false
        })

      if (uploadError) {
        console.error('Storage upload error:', uploadError)
        return { success: false, error: uploadError.message }
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath)

      return {
        success: true,
        imageUrl: urlData.publicUrl,
        filePath
      }

    } catch (error) {
      console.error('Upload to storage failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * Delete file from Supabase Storage (used for rollback)
   */
  private static async deleteFromStorage(filePath: string): Promise<void> {
    try {
      console.log('🗑️ Rolling back: Deleting file from storage:', filePath)
      await supabase.storage.from('profile-images').remove([filePath])
    } catch (error) {
      console.error('Failed to delete file during rollback:', error)
    }
  }

  /**
   * Verify avatar consistency across all 3 tables
   * 
   * Use this to check if avatar is synced correctly
   */
  static async verifyAvatarConsistency(
    therapistEmail: string
  ): Promise<AvatarConsistencyCheck> {
    try {
      console.log('🔍 Verifying avatar consistency for:', therapistEmail)

      // Fetch from all 3 tables
      const [userResult, enrollmentResult, userIdResult] = await Promise.all([
        supabase
          .from('users')
          .select('avatar_url')
          .eq('email', therapistEmail)
          .eq('user_type', 'therapist')
          .single(),
        supabase
          .from('therapist_enrollments')
          .select('profile_image_url')
          .eq('email', therapistEmail)
          .single(),
        supabase
          .from('users')
          .select('id')
          .eq('email', therapistEmail)
          .eq('user_type', 'therapist')
          .single()
      ])

      let profileImageUrl = null
      if (userIdResult.data?.id) {
        const { data } = await supabase
          .from('therapist_profiles')
          .select('profile_image_url')
          .eq('user_id', userIdResult.data.id)
          .single()
        profileImageUrl = data?.profile_image_url
      }

      const avatars = {
        users: userResult.data?.avatar_url || null,
        enrollments: enrollmentResult.data?.profile_image_url || null,
        profiles: profileImageUrl
      }

      // Check consistency
      const inconsistencies: string[] = []

      if (avatars.users !== avatars.enrollments) {
        inconsistencies.push('users.avatar_url ≠ enrollments.profile_image_url')
      }

      if (avatars.enrollments !== avatars.profiles) {
        inconsistencies.push('enrollments.profile_image_url ≠ profiles.profile_image_url')
      }

      if (avatars.users !== avatars.profiles) {
        inconsistencies.push('users.avatar_url ≠ profiles.profile_image_url')
      }

      const consistent = inconsistencies.length === 0

      console.log('📊 Consistency check result:', { consistent, avatars })

      return {
        consistent,
        details: avatars,
        inconsistencies: inconsistencies.length > 0 ? inconsistencies : undefined
      }

    } catch (error) {
      console.error('❌ Consistency check error:', error)
      return {
        consistent: false,
        details: {},
        inconsistencies: [`Error: ${String(error)}`]
      }
    }
  }

  /**
   * Fix avatar inconsistencies (uses enrollments as source of truth)
   */
  static async fixAvatarInconsistency(
    therapistEmail: string
  ): Promise<{ fixed: boolean; error?: string }> {
    try {
      console.log('🔧 Fixing avatar inconsistency for:', therapistEmail)

      // Check current state
      const check = await this.verifyAvatarConsistency(therapistEmail)
      
      if (check.consistent) {
        console.log('✅ Already consistent, no fix needed')
        return { fixed: false }
      }

      console.log('⚠️ Inconsistencies found:', check.inconsistencies)

      // Use enrollments as source of truth
      const sourceUrl = check.details.enrollments

      if (!sourceUrl) {
        return { 
          fixed: false, 
          error: 'No source URL found in enrollments table' 
        }
      }

      // Sync from enrollments to other tables
      const syncResult = await EnhancedTherapistConsistency.syncAvatar(
        therapistEmail,
        sourceUrl
      )

      if (!syncResult.success) {
        return {
          fixed: false,
          error: 'Sync failed: ' + (syncResult.warnings?.join(', ') || 'Unknown error')
        }
      }

      console.log('✅ Avatar inconsistency fixed')
      return { fixed: true }

    } catch (error) {
      console.error('❌ Fix avatar inconsistency error:', error)
      return {
        fixed: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * Batch verify consistency for multiple therapists
   */
  static async batchVerifyConsistency(
    therapistEmails: string[]
  ): Promise<Array<{ email: string; consistent: boolean; inconsistencies?: string[] }>> {
    const results = []

    for (const email of therapistEmails) {
      const check = await this.verifyAvatarConsistency(email)
      results.push({
        email,
        consistent: check.consistent,
        inconsistencies: check.inconsistencies
      })
    }

    return results
  }

  /**
   * Get avatar URL for a therapist (checks all tables and returns first found)
   */
  static async getAvatarUrl(therapistEmail: string): Promise<string | null> {
    try {
      const { data } = await supabase
        .from('therapist_enrollments')
        .select('profile_image_url')
        .eq('email', therapistEmail)
        .single()

      return data?.profile_image_url || null
    } catch (error) {
      console.error('Error getting avatar URL:', error)
      return null
    }
  }
}

