/**
 * Data Consistency Checker
 * 
 * Identifies and fixes data inconsistencies across the platform.
 * Focuses on therapist data which is duplicated across multiple tables.
 * 
 * Usage:
 * - Run daily via cron job
 * - Run manually when issues are reported
 * - Run before major deployments
 */

import { createClient } from '@supabase/supabase-js'
import { EnhancedTherapistConsistency } from '../therapist-consistency-enhanced'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface ConsistencyCheck {
  email: string
  consistent: boolean
  inconsistencies: string[]
  data?: {
    user: any
    enrollment: any
    profile: any
  }
}

export interface ConsistencyAuditReport {
  total: number
  consistent: number
  inconsistencies: number
  issues: Array<{
    email: string
    problems: string[]
  }>
  timestamp: string
}

export class DataConsistencyChecker {
  /**
   * Check all consistency issues for a therapist
   */
  static async checkTherapistConsistency(
    therapistEmail: string
  ): Promise<ConsistencyCheck> {
    const inconsistencies: string[] = []

    try {
      // Fetch from all 3 tables
      const [userResult, enrollmentResult, userIdResult] = await Promise.all([
        supabase
          .from('users')
          .select('*')
          .eq('email', therapistEmail)
          .eq('user_type', 'therapist')
          .single(),
        supabase
          .from('therapist_enrollments')
          .select('*')
          .eq('email', therapistEmail)
          .single(),
        supabase
          .from('users')
          .select('id')
          .eq('email', therapistEmail)
          .eq('user_type', 'therapist')
          .single()
      ])

      const user = userResult.data
      const enrollment = enrollmentResult.data

      let profile = null
      if (userIdResult.data?.id) {
        const { data } = await supabase
          .from('therapist_profiles')
          .select('*')
          .eq('user_id', userIdResult.data.id)
          .single()
        profile = data
      }

      // Check if records exist
      if (!user) {
        inconsistencies.push('Missing user record')
      }
      if (!enrollment) {
        inconsistencies.push('Missing therapist_enrollments record')
      }
      if (!profile && user) {
        inconsistencies.push('Missing therapist_profiles record')
      }

      if (!user || !enrollment) {
        return {
          email: therapistEmail,
          consistent: false,
          inconsistencies,
          data: { user, enrollment, profile }
        }
      }

      // Check avatar consistency
      if (user.avatar_url !== enrollment.profile_image_url) {
        inconsistencies.push(
          `Avatar mismatch: users.avatar_url (${user.avatar_url}) ≠ enrollments.profile_image_url (${enrollment.profile_image_url})`
        )
      }

      if (profile && enrollment.profile_image_url !== profile.profile_image_url) {
        inconsistencies.push(
          `Avatar mismatch: enrollments.profile_image_url ≠ profiles.profile_image_url`
        )
      }

      // Check verification status
      const enrollmentVerified = enrollment.status === 'approved'
      if (user.is_verified !== enrollmentVerified) {
        inconsistencies.push(
          `Verification mismatch: users.is_verified (${user.is_verified}) ≠ enrollments.status='approved' (${enrollmentVerified})`
        )
      }

      if (profile && user.is_verified !== profile.is_verified) {
        inconsistencies.push(
          `Verification mismatch: users.is_verified ≠ profiles.is_verified`
        )
      }

      // Check active status
      if (user.is_active !== enrollment.is_active) {
        inconsistencies.push(
          `Active status mismatch: users.is_active (${user.is_active}) ≠ enrollments.is_active (${enrollment.is_active})`
        )
      }

      // Check name consistency
      if (user.full_name !== enrollment.full_name) {
        inconsistencies.push(
          `Name mismatch: users.full_name ("${user.full_name}") ≠ enrollments.full_name ("${enrollment.full_name}")`
        )
      }

      // Check bio consistency (between enrollment and profile)
      if (profile && enrollment.bio !== profile.bio) {
        inconsistencies.push(
          `Bio mismatch: enrollments.bio ≠ profiles.bio`
        )
      }

      // Check experience years consistency
      if (profile && enrollment.experience_years !== profile.experience_years) {
        inconsistencies.push(
          `Experience mismatch: enrollments.experience_years (${enrollment.experience_years}) ≠ profiles.experience_years (${profile.experience_years})`
        )
      }

      return {
        email: therapistEmail,
        consistent: inconsistencies.length === 0,
        inconsistencies,
        data: { user, enrollment, profile }
      }

    } catch (error) {
      console.error('Error checking consistency:', error)
      return {
        email: therapistEmail,
        consistent: false,
        inconsistencies: [`Error: ${String(error)}`],
        data: undefined
      }
    }
  }

  /**
   * Auto-fix inconsistencies (uses enrollments as source of truth)
   */
  static async autoFixInconsistencies(
    therapistEmail: string
  ): Promise<{ fixed: boolean; issues: string[]; errors?: string[] }> {
    const check = await this.checkTherapistConsistency(therapistEmail)
    
    if (check.consistent) {
      return { 
        fixed: false, 
        issues: [],
      }
    }

    console.log('🔧 Auto-fixing inconsistencies for:', therapistEmail)
    console.log('Issues found:', check.inconsistencies)

    const errors: string[] = []

    try {
      // Use enrollment as source of truth
      if (!check.data?.enrollment) {
        return {
          fixed: false,
          issues: check.inconsistencies,
          errors: ['No enrollment data found - cannot auto-fix']
        }
      }

      const enrollment = check.data.enrollment

      // Fix users table
      try {
        await supabase
          .from('users')
          .update({
            full_name: enrollment.full_name,
            is_verified: enrollment.status === 'approved',
            is_active: enrollment.is_active,
            avatar_url: enrollment.profile_image_url,
            updated_at: new Date().toISOString()
          })
          .eq('email', therapistEmail)
          .eq('user_type', 'therapist')
      } catch (error) {
        errors.push(`Failed to fix users table: ${String(error)}`)
      }

      // Fix therapist_profiles table
      if (check.data?.user?.id) {
        try {
          await supabase
            .from('therapist_profiles')
            .update({
              profile_image_url: enrollment.profile_image_url,
              bio: enrollment.bio,
              experience_years: enrollment.experience_years,
              is_verified: enrollment.status === 'approved',
              updated_at: new Date().toISOString()
            })
            .eq('user_id', check.data.user.id)
        } catch (error) {
          errors.push(`Failed to fix profiles table: ${String(error)}`)
        }
      }

      console.log('✅ Auto-fix completed')
      return { 
        fixed: true, 
        issues: check.inconsistencies,
        errors: errors.length > 0 ? errors : undefined
      }

    } catch (error) {
      console.error('❌ Auto-fix failed:', error)
      return {
        fixed: false,
        issues: check.inconsistencies,
        errors: [...errors, String(error)]
      }
    }
  }

  /**
   * Audit all therapists for consistency issues
   */
  static async auditAllTherapists(): Promise<ConsistencyAuditReport> {
    console.log('🔍 Starting full therapist consistency audit...')

    const { data: therapists } = await supabase
      .from('users')
      .select('email')
      .eq('user_type', 'therapist')

    if (!therapists) {
      return {
        total: 0,
        consistent: 0,
        inconsistencies: 0,
        issues: [],
        timestamp: new Date().toISOString()
      }
    }

    const results = {
      total: therapists.length,
      consistent: 0,
      inconsistencies: 0,
      issues: [] as Array<{ email: string; problems: string[] }>
    }

    for (const therapist of therapists) {
      const check = await this.checkTherapistConsistency(therapist.email)
      
      if (check.consistent) {
        results.consistent++
      } else {
        results.inconsistencies++
        results.issues.push({
          email: therapist.email,
          problems: check.inconsistencies
        })
      }
    }

    console.log('📊 Audit complete:', {
      total: results.total,
      consistent: results.consistent,
      inconsistencies: results.inconsistencies
    })

    return {
      ...results,
      timestamp: new Date().toISOString()
    }
  }

  /**
   * Auto-fix all inconsistencies
   */
  static async autoFixAll(): Promise<{
    total: number
    fixed: number
    failed: number
    errors: Array<{ email: string; error: string }>
  }> {
    console.log('🔧 Auto-fixing all inconsistencies...')

    const audit = await this.auditAllTherapists()
    
    const results = {
      total: audit.inconsistencies,
      fixed: 0,
      failed: 0,
      errors: [] as Array<{ email: string; error: string }>
    }

    for (const issue of audit.issues) {
      const fixResult = await this.autoFixInconsistencies(issue.email)
      
      if (fixResult.fixed) {
        results.fixed++
      } else {
        results.failed++
        results.errors.push({
          email: issue.email,
          error: fixResult.errors?.join(', ') || 'Unknown error'
        })
      }
    }

    console.log('✅ Auto-fix complete:', results)
    return results
  }

  /**
   * Get summary report
   */
  static async getSummaryReport(): Promise<{
    totalTherapists: number
    consistent: number
    inconsistent: number
    consistencyRate: number
    topIssues: Array<{ issue: string; count: number }>
  }> {
    const audit = await this.auditAllTherapists()

    // Count issue types
    const issueTypes = new Map<string, number>()
    
    for (const item of audit.issues) {
      for (const problem of item.problems) {
        // Extract issue type (e.g., "Avatar mismatch", "Verification mismatch")
        const issueType = problem.split(':')[0]
        issueTypes.set(issueType, (issueTypes.get(issueType) || 0) + 1)
      }
    }

    const topIssues = Array.from(issueTypes.entries())
      .map(([issue, count]) => ({ issue, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    const consistencyRate = audit.total > 0
      ? Math.round((audit.consistent / audit.total) * 100)
      : 100

    return {
      totalTherapists: audit.total,
      consistent: audit.consistent,
      inconsistent: audit.inconsistencies,
      consistencyRate,
      topIssues
    }
  }

  /**
   * Check specific field consistency across all therapists
   */
  static async checkFieldConsistency(
    field: 'avatar' | 'verification' | 'active_status' | 'name'
  ): Promise<{
    total: number
    consistent: number
    inconsistent: number
    issues: string[]
  }> {
    const audit = await this.auditAllTherapists()
    
    const fieldKeywords = {
      avatar: 'Avatar mismatch',
      verification: 'Verification mismatch',
      active_status: 'Active status mismatch',
      name: 'Name mismatch'
    }

    const keyword = fieldKeywords[field]
    const fieldIssues = audit.issues.filter(issue =>
      issue.problems.some(p => p.includes(keyword))
    )

    return {
      total: audit.total,
      consistent: audit.total - fieldIssues.length,
      inconsistent: fieldIssues.length,
      issues: fieldIssues.map(i => i.email)
    }
  }
}

/**
 * Helper function to use in API routes or cron jobs
 */
export async function runConsistencyCheck(): Promise<ConsistencyAuditReport> {
  console.log('🔍 Running consistency check...')
  const report = await DataConsistencyChecker.auditAllTherapists()
  
  if (report.inconsistencies > 0) {
    console.warn(`⚠️ Found ${report.inconsistencies} inconsistencies`)
    
    // Optionally auto-fix
    if (process.env.AUTO_FIX_CONSISTENCY === 'true') {
      console.log('🔧 Auto-fixing enabled, attempting fixes...')
      await DataConsistencyChecker.autoFixAll()
    }
  } else {
    console.log('✅ All therapists consistent')
  }
  
  return report
}

