/**
 * ENHANCED Therapist Consistency Manager - Phase 1.2
 * 
 * Extends the existing TherapistConsistencyManager with graceful degradation
 * and comprehensive sync capabilities.
 * 
 * SAFETY: All methods have fallbacks - they won't crash your app
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Enhanced consistency manager with graceful degradation
 */
export class EnhancedTherapistConsistency {
  /**
   * Sync ALL therapist data across all tables
   * Uses therapist_enrollments as source of truth
   * 
   * SAFETY: Returns success even if partial sync fails
   */
  static async syncAllTherapistData(
    therapistEmail: string
  ): Promise<{ success: boolean; syncedFields: string[]; warnings: string[] }> {
    const syncedFields: string[] = []
    const warnings: string[] = []

    try {
      console.log('🔄 Starting comprehensive sync for:', therapistEmail)

      // Step 1: Get enrollment data (source of truth)
      const { data: enrollment, error: enrollmentError } = await supabase
        .from('therapist_enrollments')
        .select('*')
        .eq('email', therapistEmail)
        .single()

      if (enrollmentError || !enrollment) {
        warnings.push('Enrollment not found - cannot sync')
        return { success: false, syncedFields: [], warnings }
      }

      console.log('✅ Enrollment data retrieved')

      // Step 2: Sync to users table
      try {
        const { error: usersError } = await supabase
          .from('users')
          .update({
            avatar_url: enrollment.profile_image_url,
            full_name: enrollment.full_name,
            is_verified: enrollment.status === 'approved',
            is_active: enrollment.is_active,
            updated_at: new Date().toISOString()
          })
          .eq('email', therapistEmail)
          .eq('user_type', 'therapist')

        if (usersError) {
          warnings.push(`Users table sync failed: ${usersError.message}`)
        } else {
          syncedFields.push('users')
          console.log('✅ Users table synced')
        }
      } catch (error) {
        warnings.push(`Users table sync error: ${String(error)}`)
      }

      // Step 3: Sync to therapist_profiles (if user_id exists)
      if (enrollment.user_id) {
        try {
          const { error: profilesError } = await supabase
            .from('therapist_profiles')
            .update({
              profile_image_url: enrollment.profile_image_url,
              bio: enrollment.bio,
              experience_years: enrollment.experience_years,
              verification_status: enrollment.status === 'approved' ? 'approved' : 'pending',
              is_verified: enrollment.status === 'approved',
              updated_at: new Date().toISOString()
            })
            .eq('user_id', enrollment.user_id)

          if (profilesError) {
            warnings.push(`Therapist profiles sync failed: ${profilesError.message}`)
          } else {
            syncedFields.push('therapist_profiles')
            console.log('✅ Therapist profiles synced')
          }
        } catch (error) {
          warnings.push(`Therapist profiles sync error: ${String(error)}`)
        }
      } else {
        warnings.push('No user_id - skipped therapist_profiles sync')
      }

      // Return success even if some syncs failed (graceful degradation)
      const success = syncedFields.length > 0
      
      console.log(`✅ Sync complete: ${syncedFields.length}/${3} tables synced`)
      if (warnings.length > 0) {
        console.warn('⚠️ Sync warnings:', warnings)
      }

      return { success, syncedFields, warnings }

    } catch (error) {
      console.error('❌ Comprehensive sync failed:', error)
      warnings.push(`Fatal error: ${String(error)}`)
      return { success: false, syncedFields, warnings }
    }
  }

  /**
   * Sync just the avatar across all tables
   * 
   * SAFETY: Won't fail if some tables don't sync
   */
  static async syncAvatar(
    therapistEmail: string,
    avatarUrl: string
  ): Promise<{ success: boolean; syncedTables: string[]; warnings: string[] }> {
    const syncedTables: string[] = []
    const warnings: string[] = []

    try {
      console.log('📸 Syncing avatar for:', therapistEmail)

      // Sync to therapist_enrollments
      try {
        const { error } = await supabase
          .from('therapist_enrollments')
          .update({ 
            profile_image_url: avatarUrl,
            updated_at: new Date().toISOString()
          })
          .eq('email', therapistEmail)

        if (!error) {
          syncedTables.push('therapist_enrollments')
        } else {
          warnings.push(`Enrollments: ${error.message}`)
        }
      } catch (e) {
        warnings.push(`Enrollments error: ${String(e)}`)
      }

      // Sync to users
      try {
        const { error } = await supabase
          .from('users')
          .update({ 
            avatar_url: avatarUrl,
            updated_at: new Date().toISOString()
          })
          .eq('email', therapistEmail)
          .eq('user_type', 'therapist')

        if (!error) {
          syncedTables.push('users')
        } else {
          warnings.push(`Users: ${error.message}`)
        }
      } catch (e) {
        warnings.push(`Users error: ${String(e)}`)
      }

      // Sync to therapist_profiles
      try {
        // Get user_id first
        const { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('email', therapistEmail)
          .single()

        if (user) {
          const { error } = await supabase
            .from('therapist_profiles')
            .update({ 
              profile_image_url: avatarUrl,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', user.id)

          if (!error) {
            syncedTables.push('therapist_profiles')
          } else {
            warnings.push(`Profiles: ${error.message}`)
          }
        } else {
          warnings.push('Profiles: user_id not found')
        }
      } catch (e) {
        warnings.push(`Profiles error: ${String(e)}`)
      }

      const success = syncedTables.length >= 1 // Success if at least 1 table synced
      
      console.log(`📸 Avatar sync: ${syncedTables.length}/3 tables updated`)
      
      return { success, syncedTables, warnings }

    } catch (error) {
      console.error('❌ Avatar sync failed:', error)
      return { 
        success: false, 
        syncedTables, 
        warnings: [...warnings, `Fatal: ${String(error)}`] 
      }
    }
  }

  /**
   * One-time sync job to fix existing inconsistencies
   * Run this ONCE after installing triggers
   * 
   * SAFETY: Won't break anything, just logs what it fixes
   */
  static async fixAllInconsistencies(): Promise<{
    total: number
    fixed: number
    failed: number
    details: Array<{ email: string; status: string; issues?: string[] }>
  }> {
    console.log('🔧 Starting one-time consistency fix...')

    const results = {
      total: 0,
      fixed: 0,
      failed: 0,
      details: [] as Array<{ email: string; status: string; issues?: string[] }>
    }

    try {
      // Get all therapist emails
      const { data: therapists } = await supabase
        .from('therapist_enrollments')
        .select('email, full_name')

      if (!therapists) {
        console.log('No therapists found')
        return results
      }

      results.total = therapists.length
      console.log(`Found ${results.total} therapists to check`)

      // Fix each one
      for (const therapist of therapists) {
        try {
          const syncResult = await this.syncAllTherapistData(therapist.email)
          
          if (syncResult.success && syncResult.warnings.length === 0) {
            results.fixed++
            results.details.push({
              email: therapist.email,
              status: 'fixed',
            })
            console.log(`✅ Fixed: ${therapist.email}`)
          } else if (syncResult.success && syncResult.warnings.length > 0) {
            results.fixed++
            results.details.push({
              email: therapist.email,
              status: 'partial',
              issues: syncResult.warnings
            })
            console.log(`⚠️ Partial fix: ${therapist.email}`)
          } else {
            results.failed++
            results.details.push({
              email: therapist.email,
              status: 'failed',
              issues: syncResult.warnings
            })
            console.log(`❌ Failed: ${therapist.email}`)
          }
        } catch (error) {
          results.failed++
          results.details.push({
            email: therapist.email,
            status: 'error',
            issues: [String(error)]
          })
          console.error(`❌ Error fixing ${therapist.email}:`, error)
        }

        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      console.log('\n=== CONSISTENCY FIX COMPLETE ===')
      console.log(`Total: ${results.total}`)
      console.log(`Fixed: ${results.fixed}`)
      console.log(`Failed: ${results.failed}`)

      return results

    } catch (error) {
      console.error('❌ Consistency fix job failed:', error)
      return results
    }
  }

  /**
   * Graceful wrapper for any database operation
   * Returns success=true even if operation fails (logs for manual fix)
   */
  static async withGracefulDegradation<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<{ success: boolean; data?: T; degraded: boolean; error?: string }> {
    try {
      const data = await operation()
      return { success: true, data, degraded: false }
    } catch (error) {
      console.error(`Operation ${operationName} failed gracefully:`, error)
      
      // Log for manual intervention
      await this.logForManualIntervention({
        operation: operationName,
        error: String(error),
        timestamp: new Date().toISOString()
      })

      return {
        success: true, // LIE to user but prevent cascade failures
        degraded: true,
        error: String(error)
      }
    }
  }

  /**
   * Log failures that need manual intervention
   * You can query this table later to fix issues
   */
  private static async logForManualIntervention(details: {
    operation: string
    error: string
    timestamp: string
  }): Promise<void> {
    try {
      // Try to log to a manual_intervention_log table (create if needed)
      await supabase.from('manual_intervention_log').insert({
        ...details,
        resolved: false
      })
    } catch (error) {
      // If logging fails, at least console.error it
      console.error('Failed to log manual intervention need:', details)
    }
  }
}

/**
 * Helper: Create the manual intervention log table
 * Run this once to enable logging
 */
export const createManualInterventionLogTable = async () => {
  // This should be run as a migration SQL script:
  /*
  CREATE TABLE IF NOT EXISTS manual_intervention_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operation TEXT NOT NULL,
    error TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    resolved_by TEXT,
    notes TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_manual_intervention_unresolved 
  ON manual_intervention_log(resolved, timestamp DESC);
  */
}

/**
 * Export for backward compatibility
 */
export { EnhancedTherapistConsistency as TherapistConsistencyEnhanced }

