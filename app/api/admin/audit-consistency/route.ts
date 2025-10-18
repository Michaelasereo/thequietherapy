import { NextResponse } from 'next/server'
import { TherapistConsistencyManager } from '@/lib/therapist-consistency'

/**
 * Admin API: Audit therapist data consistency
 * GET /api/admin/audit-consistency
 */
export async function GET() {
  try {
    console.log('🔍 Starting consistency audit...')

    const auditResults = await TherapistConsistencyManager.auditAllTherapists()

    console.log('📊 Audit Results:', auditResults)

    return NextResponse.json({
      success: true,
      audit: auditResults,
      summary: {
        total: auditResults.total,
        consistent: auditResults.consistent,
        inconsistent: auditResults.inconsistent,
        consistency_percentage: auditResults.total > 0 
          ? Math.round((auditResults.consistent / auditResults.total) * 100) 
          : 100
      }
    })

  } catch (error) {
    console.error('❌ Audit error:', error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}

/**
 * Admin API: Auto-fix all inconsistencies
 * POST /api/admin/audit-consistency
 */
export async function POST() {
  try {
    console.log('🔧 Starting auto-fix for all inconsistencies...')

    // First, audit to find issues
    const auditResults = await TherapistConsistencyManager.auditAllTherapists()

    const fixResults = {
      attempted: auditResults.inconsistent,
      fixed: 0,
      failed: 0,
      details: [] as Array<{ email: string; status: string; error?: string }>
    }

    // Auto-fix each inconsistent therapist
    for (const issue of auditResults.issues) {
      try {
        const result = await TherapistConsistencyManager.autoFixInconsistencies(issue.email)
        
        if (result.fixed) {
          fixResults.fixed++
          fixResults.details.push({
            email: issue.email,
            status: 'fixed'
          })
        } else {
          fixResults.failed++
          fixResults.details.push({
            email: issue.email,
            status: 'failed',
            error: result.issues.join(', ')
          })
        }
      } catch (error) {
        fixResults.failed++
        fixResults.details.push({
          email: issue.email,
          status: 'error',
          error: String(error)
        })
      }
    }

    console.log('✅ Auto-fix complete:', fixResults)

    return NextResponse.json({
      success: true,
      fixResults,
      summary: {
        attempted: fixResults.attempted,
        fixed: fixResults.fixed,
        failed: fixResults.failed,
        success_rate: fixResults.attempted > 0
          ? Math.round((fixResults.fixed / fixResults.attempted) * 100)
          : 100
      }
    })

  } catch (error) {
    console.error('❌ Auto-fix error:', error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}
