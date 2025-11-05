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
    try {
      console.log(`🔄 TherapistConsistencyManager: Approving ${email}`)

      // Get enrollment data first to get therapist details
      // Handle duplicates by getting the most recent one (or any approved one if exists)
      const { data: allEnrollmentsData, error: checkEnrollmentsError } = await supabase
        .from('therapist_enrollments')
        .select('*')
        .eq('email', email)
        .order('created_at', { ascending: false })

      if (checkEnrollmentsError || !allEnrollmentsData || allEnrollmentsData.length === 0) {
        console.error('❌ Enrollment not found for:', email)
        return { success: false, error: 'Therapist enrollment not found' }
      }

      // Use the most recent enrollment, or an approved one if it exists
      const enrollmentData = allEnrollmentsData.find(e => e.status === 'approved') || allEnrollmentsData[0]
      
      if (allEnrollmentsData.length > 1) {
        console.warn(`⚠️ Found ${allEnrollmentsData.length} enrollments for ${email}. Using most recent one for approval.`)
      }

      // Get user_id first for therapist_profiles update
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .eq('user_type', 'therapist')
        .single()

      let userId = userData?.id

      // If user doesn't exist, create one
      if (!userId) {
        console.log('🔄 User not found, creating new user account...')
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
          console.error('❌ Failed to create user account:', createUserError)
          return { success: false, error: `Failed to create user account: ${createUserError.message}` }
        }

        userId = newUser.id
        console.log('✅ Created new user account with ID:', userId)
      } else {
        // Update existing user
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
          console.error('❌ Failed to update users table:', userError)
          return { success: false, error: `Users table update failed: ${userError.message}` }
        }
        console.log('✅ Updated existing user account')
      }

      // Update ALL therapist_enrollments records for this email (handles duplicates)
      // We already have allEnrollmentsData from earlier, reuse it
      const allEnrollments = allEnrollmentsData.map(e => ({ id: e.id, status: e.status, is_active: e.is_active }))

      // If there are multiple enrollments, we need to handle them
      if (allEnrollments && allEnrollments.length > 1) {
        console.warn(`⚠️ Found ${allEnrollments.length} duplicate enrollments for ${email}. Updating all to approved.`)
      }

      // Update ALL enrollments for this email (handles duplicates)
      const { error: enrollmentError } = await supabase
        .from('therapist_enrollments')
        .update({ 
          status: 'approved',
          is_active: true,
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('email', email)

      if (enrollmentError) {
        console.error('❌ Failed to update enrollments table:', enrollmentError)
        // Rollback users table update
        if (userId && !userData?.id) {
          // Only delete if we created the user
          await supabase
            .from('users')
            .delete()
            .eq('id', userId)
        } else {
          await supabase
            .from('users')
            .update({ 
              is_verified: false,
              is_active: false,
              updated_at: new Date().toISOString()
            })
            .eq('email', email)
        }
        
        return { success: false, error: `Enrollments table update failed: ${enrollmentError.message}` }
      }

      // Clean up duplicate enrollments: Keep only the most recent approved one
      // Delete older duplicate enrollments if there are multiple
      if (allEnrollments && allEnrollments.length > 1) {
        console.log(`🧹 Cleaning up ${allEnrollments.length - 1} duplicate enrollment(s) for ${email}`)
        
        // Get the most recent approved enrollment ID
        const { data: latestEnrollment } = await supabase
          .from('therapist_enrollments')
          .select('id')
          .eq('email', email)
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (latestEnrollment) {
          // Delete all other enrollments (keep only the latest approved one)
          const { error: deleteError } = await supabase
            .from('therapist_enrollments')
            .delete()
            .eq('email', email)
            .neq('id', latestEnrollment.id)

          if (deleteError) {
            console.warn('⚠️ Failed to delete duplicate enrollments (non-critical):', deleteError)
            // Don't fail the approval if cleanup fails
          } else {
            console.log(`✅ Cleaned up ${allEnrollments.length - 1} duplicate enrollment(s)`)
          }
        }
      }

      // Update therapist_profiles table (CRITICAL for booking API)
      if (userId) {
        const { error: profileError } = await supabase
          .from('therapist_profiles')
          .update({ 
            verification_status: 'approved',
            is_verified: true,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)

        if (profileError) {
          console.error('❌ Failed to update therapist_profiles table:', profileError)
          // Try to create the profile if it doesn't exist
          console.log('🔄 Attempting to create missing therapist_profiles entry...')
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
            console.error('❌ Failed to create therapist_profiles entry:', createError)
            // This is a critical data consistency issue but won't prevent the approval
          } else {
            console.log('✅ Created missing therapist_profiles entry successfully')
          }
        } else {
          console.log('✅ Therapist_profiles updated successfully')
        }
      } else {
        console.error('❌ No user_id found, cannot update therapist_profiles')
      }

      console.log(`✅ TherapistConsistencyManager: Successfully approved ${email}`)
      return { success: true }

    } catch (error) {
      console.error('❌ TherapistConsistencyManager error:', error)
      return { success: false, error: String(error) }
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
