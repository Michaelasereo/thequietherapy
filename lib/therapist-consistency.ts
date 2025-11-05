/**
 * Therapist Consistency Manager
 * 
 * Ensures data consistency between users and therapist_enrollments tables.
 * Use this instead of direct table updates to prevent data drift.
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export class TherapistConsistencyManager {
  /**
   * Set therapist active status in BOTH tables atomically
   */
  static async setTherapistActive(email: string, isActive: boolean): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`🔄 TherapistConsistencyManager: Setting ${email} to ${isActive ? 'ACTIVE' : 'INACTIVE'}`)

      // Update users table
      const { error: userError } = await supabase
        .from('users')
        .update({ 
          is_active: isActive,
          updated_at: new Date().toISOString()
        })
        .eq('email', email)
        .eq('user_type', 'therapist')

      if (userError) {
        console.error('❌ Failed to update users table:', userError)
        return { success: false, error: `Users table update failed: ${userError.message}` }
      }

      // Update therapist_enrollments table
      const { error: enrollmentError } = await supabase
        .from('therapist_enrollments')
        .update({ 
          is_active: isActive,
          updated_at: new Date().toISOString()
        })
        .eq('email', email)

      if (enrollmentError) {
        console.error('❌ Failed to update enrollments table:', enrollmentError)
        // Rollback users table update
        await supabase
          .from('users')
          .update({ 
            is_active: !isActive, // Revert
            updated_at: new Date().toISOString()
          })
          .eq('email', email)
        
        return { success: false, error: `Enrollments table update failed: ${enrollmentError.message}` }
      }

      console.log(`✅ TherapistConsistencyManager: Successfully updated ${email}`)
      return { success: true }

    } catch (error) {
      console.error('❌ TherapistConsistencyManager error:', error)
      return { success: false, error: String(error) }
    }
  }

  /**
   * Approve therapist in BOTH tables atomically
   */
  static async approveTherapist(email: string): Promise<{ success: boolean; error?: string }> {
    const startTime = Date.now()
    const approvalId = `approval-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    try {
      console.log(`🔄 [${approvalId}] TherapistConsistencyManager: Starting approval for ${email}`)
      console.log(`📊 [${approvalId}] Approval timestamp: ${new Date().toISOString()}`)

      // Get enrollment data first to get therapist details
      // Handle duplicates by getting the most recent one (or any approved one if exists)
      console.log(`🔍 [${approvalId}] Step 1: Fetching enrollments for ${email}`)
      const { data: allEnrollmentsData, error: checkEnrollmentsError } = await supabase
        .from('therapist_enrollments')
        .select('*')
        .eq('email', email)
        .order('created_at', { ascending: false })

      if (checkEnrollmentsError) {
        console.error(`❌ [${approvalId}] Error fetching enrollments:`, {
          error: checkEnrollmentsError,
          code: checkEnrollmentsError.code,
          message: checkEnrollmentsError.message,
          details: checkEnrollmentsError.details
        })
        return { success: false, error: `Database error: ${checkEnrollmentsError.message}` }
      }

      if (!allEnrollmentsData || allEnrollmentsData.length === 0) {
        console.error(`❌ [${approvalId}] No enrollments found for email: ${email}`)
        return { success: false, error: 'Therapist enrollment not found. Please ensure the therapist has completed enrollment.' }
      }

      console.log(`✅ [${approvalId}] Found ${allEnrollmentsData.length} enrollment(s) for ${email}`)
      allEnrollmentsData.forEach((enrollment, index) => {
        console.log(`   [${approvalId}] Enrollment ${index + 1}:`, {
          id: enrollment.id,
          status: enrollment.status,
          created_at: enrollment.created_at,
          user_id: enrollment.user_id || 'NOT LINKED'
        })
      })

      // Use the most recent enrollment, or an approved one if it exists
      const enrollmentData = allEnrollmentsData.find(e => e.status === 'approved') || allEnrollmentsData[0]
      
      if (allEnrollmentsData.length > 1) {
        console.warn(`⚠️ [${approvalId}] Found ${allEnrollmentsData.length} enrollments for ${email}. Using most recent one for approval.`)
        console.warn(`   [${approvalId}] Duplicate cleanup will be performed after approval.`)
      }

      // Get user_id first for therapist_profiles update
      console.log(`🔍 [${approvalId}] Step 2: Checking for existing user account`)
      const { data: userData, error: userCheckError } = await supabase
        .from('users')
        .select('id, is_verified, is_active, created_at')
        .eq('email', email)
        .eq('user_type', 'therapist')
        .single()

      if (userCheckError && userCheckError.code !== 'PGRST116') {
        console.error(`❌ [${approvalId}] Error checking user account:`, {
          error: userCheckError,
          code: userCheckError.code,
          message: userCheckError.message
        })
      }

      let userId = userData?.id

      // If user doesn't exist, create one
      if (!userId) {
        console.log(`🔄 [${approvalId}] Step 2a: User not found, creating new user account...`)
        const { data: newUser, error: createUserError } = await supabase
          .from('users')
          .insert({
            email: enrollmentData.email,
            full_name: enrollmentData.full_name,
            user_type: 'therapist',
            is_verified: true,
            is_active: true,
            credits: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select('id')
          .single()

        if (createUserError) {
          console.error(`❌ [${approvalId}] Failed to create user account:`, {
            error: createUserError,
            code: createUserError.code,
            message: createUserError.message,
            details: createUserError.details
          })
          return { success: false, error: `Failed to create user account: ${createUserError.message}` }
        }

        userId = newUser.id
        console.log(`✅ [${approvalId}] Created new user account with ID: ${userId}`)
      } else {
        // Update existing user
        console.log(`🔄 [${approvalId}] Step 2b: Updating existing user account (ID: ${userId})`)
        console.log(`   [${approvalId}] Current user state:`, {
          is_verified: userData?.is_verified,
          is_active: userData?.is_active,
          created_at: userData?.created_at
        })
        
        const { error: userError } = await supabase
          .from('users')
          .update({ 
            is_verified: true,
            is_active: true,
            updated_at: new Date().toISOString()
          })
          .eq('email', email)
          .eq('user_type', 'therapist')

        if (userError) {
          console.error(`❌ [${approvalId}] Failed to update users table:`, {
            error: userError,
            code: userError.code,
            message: userError.message,
            details: userError.details
          })
          return { success: false, error: `Users table update failed: ${userError.message}` }
        }
        console.log(`✅ [${approvalId}] Updated existing user account`)
      }

      // Update ALL therapist_enrollments records for this email (handles duplicates)
      // We already have allEnrollmentsData from earlier, reuse it
      const allEnrollments = allEnrollmentsData.map(e => ({ id: e.id, status: e.status, is_active: e.is_active }))

      // If there are multiple enrollments, we need to handle them
      if (allEnrollments && allEnrollments.length > 1) {
        console.warn(`⚠️ Found ${allEnrollments.length} duplicate enrollments for ${email}. Updating all to approved.`)
      }

      // Update ALL enrollments for this email (handles duplicates)
      // IMPORTANT: Link user_id to enrollments so they're properly connected
      console.log(`🔍 [${approvalId}] Step 3: Updating all enrollments for ${email}`)
      console.log(`   [${approvalId}] Will update ${allEnrollmentsData.length} enrollment(s)`)
      console.log(`   [${approvalId}] Linking to user_id: ${userId}`)
      
      const { data: updatedData, error: enrollmentError, count: updatedCount } = await supabase
        .from('therapist_enrollments')
        .update({ 
          status: 'approved',
          is_active: true,
          user_id: userId, // Link the user_id to enrollments
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('email', email)
        .select('id')

      if (enrollmentError) {
        console.error(`❌ [${approvalId}] Failed to update enrollments table:`, {
          error: enrollmentError,
          code: enrollmentError.code,
          message: enrollmentError.message,
          details: enrollmentError.details
        })
        
        // Rollback users table update
        console.log(`🔄 [${approvalId}] Rolling back user account changes...`)
        if (userId && !userData?.id) {
          // Only delete if we created the user
          const { error: rollbackError } = await supabase
            .from('users')
            .delete()
            .eq('id', userId)
          
          if (rollbackError) {
            console.error(`❌ [${approvalId}] Rollback failed:`, rollbackError)
          } else {
            console.log(`✅ [${approvalId}] Rolled back user account creation`)
          }
        } else {
          const { error: rollbackError } = await supabase
            .from('users')
            .update({ 
              is_verified: false,
              is_active: false,
              updated_at: new Date().toISOString()
            })
            .eq('email', email)
          
          if (rollbackError) {
            console.error(`❌ [${approvalId}] Rollback failed:`, rollbackError)
          } else {
            console.log(`✅ [${approvalId}] Rolled back user account update`)
          }
        }
        
        return { success: false, error: `Enrollments table update failed: ${enrollmentError.message}` }
      }
      
      const actualUpdatedCount = updatedData?.length || updatedCount || allEnrollmentsData.length
      console.log(`✅ [${approvalId}] Updated ${actualUpdatedCount} enrollment(s)`)

      // Clean up duplicate enrollments: Keep only the most recent approved one
      // Delete older duplicate enrollments if there are multiple
      if (allEnrollments && allEnrollments.length > 1) {
        console.log(`🧹 [${approvalId}] Step 4: Cleaning up ${allEnrollments.length - 1} duplicate enrollment(s)`)
        
        // Get the most recent approved enrollment ID
        const { data: latestEnrollment, error: latestError } = await supabase
          .from('therapist_enrollments')
          .select('id, created_at')
          .eq('email', email)
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (latestError) {
          console.warn(`⚠️ [${approvalId}] Error finding latest enrollment for cleanup:`, latestError)
        }

        if (latestEnrollment) {
          console.log(`   [${approvalId}] Keeping enrollment ID: ${latestEnrollment.id} (created: ${latestEnrollment.created_at})`)
          
          // Delete all other enrollments (keep only the latest approved one)
          const { data: deletedData, error: deleteError } = await supabase
            .from('therapist_enrollments')
            .delete()
            .eq('email', email)
            .neq('id', latestEnrollment.id)
            .select('id')
          
          const deletedCount = deletedData?.length || 0

          if (deleteError) {
            console.warn(`⚠️ [${approvalId}] Failed to delete duplicate enrollments (non-critical):`, {
              error: deleteError,
              code: deleteError.code,
              message: deleteError.message
            })
            // Don't fail the approval if cleanup fails
          } else {
            console.log(`✅ [${approvalId}] Cleaned up ${deletedCount || allEnrollments.length - 1} duplicate enrollment(s)`)
          }
        }
      }

      // Update therapist_profiles table (CRITICAL for booking API and availability)
      console.log(`🔍 [${approvalId}] Step 5: Updating therapist_profiles`)
      if (userId) {
        // First, try to update existing profile
        const { data: existingProfile, error: checkError } = await supabase
          .from('therapist_profiles')
          .select('id, verification_status, is_verified, created_at')
          .eq('user_id', userId)
          .single()

        if (checkError && checkError.code !== 'PGRST116') {
          console.error(`❌ [${approvalId}] Error checking therapist_profiles:`, {
            error: checkError,
            code: checkError.code,
            message: checkError.message
          })
        }

        if (existingProfile) {
          // Update existing profile
          console.log(`   [${approvalId}] Updating existing profile (ID: ${existingProfile.id})`)
          console.log(`   [${approvalId}] Current profile state:`, {
            verification_status: existingProfile.verification_status,
            is_verified: existingProfile.is_verified,
            created_at: existingProfile.created_at
          })
          
          const { error: profileError } = await supabase
            .from('therapist_profiles')
            .update({ 
              verification_status: 'approved',
              is_verified: true,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userId)

          if (profileError) {
            console.error(`❌ [${approvalId}] Failed to update therapist_profiles table:`, {
              error: profileError,
              code: profileError.code,
              message: profileError.message,
              details: profileError.details
            })
          } else {
            console.log(`✅ [${approvalId}] Therapist_profiles updated successfully`)
          }
        } else {
          // Create new profile if it doesn't exist
          console.log(`🔄 [${approvalId}] Creating new therapist_profiles entry...`)
          const { error: createError } = await supabase
            .from('therapist_profiles')
            .insert({
              user_id: userId,
              verification_status: 'approved',
              is_verified: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
          
          if (createError) {
            console.error(`❌ [${approvalId}] Failed to create therapist_profiles entry:`, {
              error: createError,
              code: createError.code,
              message: createError.message,
              details: createError.details
            })
            // This is a critical data consistency issue but won't prevent the approval
          } else {
            console.log(`✅ [${approvalId}] Created therapist_profiles entry successfully`)
          }
        }
      } else {
        console.error(`❌ [${approvalId}] No user_id found, cannot update therapist_profiles`)
      }

      const duration = Date.now() - startTime
      console.log(`✅ [${approvalId}] TherapistConsistencyManager: Successfully approved ${email}`)
      console.log(`📊 [${approvalId}] Approval completed in ${duration}ms`)
      console.log(`📊 [${approvalId}] Summary:`, {
        email,
        userId,
        enrollmentsUpdated: allEnrollmentsData.length,
        duplicatesCleaned: allEnrollmentsData.length > 1 ? allEnrollmentsData.length - 1 : 0,
        duration: `${duration}ms`
      })
      
      return { success: true }

    } catch (error) {
      const duration = Date.now() - startTime
      console.error(`❌ [${approvalId}] TherapistConsistencyManager error:`, {
        error,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        duration: `${duration}ms`
      })
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  }

  /**
   * Validate consistency between tables
   * Returns inconsistencies found
   */
  static async validateConsistency(email: string): Promise<{
    isConsistent: boolean
    issues: string[]
    userData?: any
    enrollmentData?: any
  }> {
    try {
      console.log(`🔍 Validating consistency for ${email}`)

      const { data: user } = await supabase
        .from('users')
        .select('email, full_name, is_verified, is_active')
        .eq('email', email)
        .eq('user_type', 'therapist')
        .single()

      const { data: enrollment } = await supabase
        .from('therapist_enrollments')
        .select('email, full_name, status, is_active')
        .eq('email', email)
        .single()

      const issues: string[] = []

      if (!user) {
        issues.push('User not found in users table')
      }

      if (!enrollment) {
        issues.push('User not found in therapist_enrollments table')
      }

      if (user && enrollment) {
        if (user.is_active !== enrollment.is_active) {
          issues.push(`is_active mismatch: users=${user.is_active}, enrollments=${enrollment.is_active}`)
        }

        if (user.full_name !== enrollment.full_name) {
          issues.push(`full_name mismatch: users="${user.full_name}", enrollments="${enrollment.full_name}"`)
        }

        if (user.is_verified && enrollment.status !== 'approved') {
          issues.push(`Verification mismatch: user verified but enrollment not approved`)
        }
      }

      const isConsistent = issues.length === 0

      if (!isConsistent) {
        console.error('🚨 CONSISTENCY ISSUES DETECTED:', { email, issues })
      } else {
        console.log('✅ Data is consistent for', email)
      }

      return {
        isConsistent,
        issues,
        userData: user,
        enrollmentData: enrollment
      }

    } catch (error) {
      console.error('❌ Validation error:', error)
      return {
        isConsistent: false,
        issues: [`Validation error: ${String(error)}`]
      }
    }
  }

  /**
   * Auto-fix inconsistencies (uses enrollment as source of truth)
   */
  static async autoFixInconsistencies(email: string): Promise<{ fixed: boolean; issues: string[] }> {
    const validation = await this.validateConsistency(email)

    if (validation.isConsistent) {
      return { fixed: false, issues: [] }
    }

    console.log(`🔧 Auto-fixing inconsistencies for ${email}`)

    // Use enrollment as source of truth
    if (validation.enrollmentData) {
      const { error } = await supabase
        .from('users')
        .update({
          is_active: validation.enrollmentData.is_active,
          is_verified: validation.enrollmentData.status === 'approved',
          full_name: validation.enrollmentData.full_name,
          updated_at: new Date().toISOString()
        })
        .eq('email', email)

      if (error) {
        console.error('❌ Auto-fix failed:', error)
        return { fixed: false, issues: validation.issues }
      }

      console.log('✅ Auto-fix completed')
      return { fixed: true, issues: validation.issues }
    }

    return { fixed: false, issues: validation.issues }
  }

  /**
   * Audit all therapists for consistency issues
   */
  static async auditAllTherapists(): Promise<{
    total: number
    consistent: number
    inconsistent: number
    issues: Array<{ email: string; problems: string[] }>
  }> {
    console.log('🔍 Starting full therapist consistency audit...')

    const { data: users } = await supabase
      .from('users')
      .select('email')
      .eq('user_type', 'therapist')

    if (!users) {
      return { total: 0, consistent: 0, inconsistent: 0, issues: [] }
    }

    const results = {
      total: users.length,
      consistent: 0,
      inconsistent: 0,
      issues: [] as Array<{ email: string; problems: string[] }>
    }

    for (const user of users) {
      const validation = await this.validateConsistency(user.email)
      
      if (validation.isConsistent) {
        results.consistent++
      } else {
        results.inconsistent++
        results.issues.push({
          email: user.email,
          problems: validation.issues
        })
      }
    }

    console.log('📊 Audit complete:', {
      total: results.total,
      consistent: results.consistent,
      inconsistent: results.inconsistent
    })

    return results
  }
}

/**
 * Helper function to use in API routes
 */
export const validateTherapistConsistency = async (email: string) => {
  const validation = await TherapistConsistencyManager.validateConsistency(email)
  
  if (!validation.isConsistent) {
    console.warn('⚠️ Attempting auto-fix for', email)
    const fix = await TherapistConsistencyManager.autoFixInconsistencies(email)
    
    if (fix.fixed) {
      console.log('✅ Auto-fix successful for', email)
    } else {
      console.error('❌ Auto-fix failed for', email, '- manual intervention required')
    }
  }
  
  return validation
}
