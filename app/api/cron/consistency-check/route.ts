import { NextRequest, NextResponse } from 'next/server'
import { DataConsistencyChecker } from '@/lib/services/data-consistency-checker'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Automated Consistency Check Cron Job
 * 
 * Runs daily to check data consistency across all therapists.
 * Can be triggered manually or via cron service.
 * 
 * Setup with Vercel Cron:
 * Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/consistency-check",
 *     "schedule": "0 2 * * *"
 *   }]
 * }
 * 
 * Or use external cron service (e.g., cron-job.org)
 */

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Starting automated consistency check...')

    // Verify cron authorization (use secret token)
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.CRON_SECRET || 'dev-cron-secret'

    if (authHeader !== `Bearer ${expectedToken}`) {
      console.error('❌ Unauthorized cron request')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Run consistency audit
    const audit = await DataConsistencyChecker.auditAllTherapists()

    console.log('📊 Audit complete:', {
      total: audit.total,
      consistent: audit.consistent,
      inconsistencies: audit.inconsistencies
    })

    // Auto-fix if enabled and issues found
    let fixedCount = 0
    if (process.env.AUTO_FIX_CONSISTENCY === 'true' && audit.inconsistencies > 0) {
      console.log('🔧 Auto-fix enabled, attempting to fix inconsistencies...')
      
      const fixResults = await DataConsistencyChecker.autoFixAll()
      fixedCount = fixResults.fixed

      console.log('✅ Fixed:', fixResults.fixed)
      console.log('❌ Failed:', fixResults.failed)

      if (fixResults.errors.length > 0) {
        console.error('Errors during auto-fix:', fixResults.errors)
      }
    }

    // Log to database
    await supabase.from('consistency_check_logs').insert({
      total_therapists: audit.total,
      consistent: audit.consistent,
      inconsistent: audit.inconsistencies,
      auto_fixed: fixedCount,
      issues_found: audit.issues,
      timestamp: audit.timestamp,
      created_at: new Date().toISOString()
    })

    // Send alert if critical issues found
    if (audit.inconsistencies > 10) {
      console.warn(`⚠️ HIGH inconsistency count: ${audit.inconsistencies}`)
      
      // TODO: Send email/Slack alert
      // await sendAlert({
      //   title: 'High Data Inconsistency Detected',
      //   message: `Found ${audit.inconsistencies} inconsistencies`,
      //   severity: 'warning'
      // })
    }

    // Return report
    return NextResponse.json({
      success: true,
      audit,
      autoFixed: fixedCount,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Consistency check failed:', error)

    // Log error
    await supabase.from('error_logs').insert({
      error_type: 'cron_job_error',
      message: 'Consistency check cron job failed',
      stack: error instanceof Error ? error.stack : null,
      url: '/api/cron/consistency-check',
      created_at: new Date().toISOString()
    })

    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * POST endpoint for manual trigger
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Add admin authentication
    console.log('🔧 Manual consistency check triggered')

    const audit = await DataConsistencyChecker.auditAllTherapists()
    const summary = await DataConsistencyChecker.getSummaryReport()

    return NextResponse.json({
      success: true,
      audit,
      summary,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Manual consistency check failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

