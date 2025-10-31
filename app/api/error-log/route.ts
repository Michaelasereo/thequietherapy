import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Error Logging API
 * 
 * Logs client-side and server-side errors to database
 * for monitoring and debugging.
 */

export async function POST(request: NextRequest) {
  try {
    const errorData = await request.json()

    // Validate required fields
    if (!errorData.message || !errorData.type) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: message, type' },
        { status: 400 }
      )
    }

    // Get user info if available (from session)
    let userId: string | null = null
    let userEmail: string | null = null
    
    try {
      const sessionCookie = request.cookies.get('quiet_session')?.value
      if (sessionCookie) {
        const sessionData = JSON.parse(decodeURIComponent(sessionCookie))
        userId = sessionData.id || null
        userEmail = sessionData.email || null
      }
    } catch (e) {
      // Ignore session parsing errors
    }

    // Get IP address
    const ipAddress = 
      request.headers.get('x-forwarded-for') || 
      request.headers.get('x-real-ip') || 
      'unknown'

    // Prepare error log entry
    const errorLog = {
      error_type: errorData.type,
      message: errorData.message,
      stack: errorData.stack || null,
      url: errorData.url || null,
      user_agent: errorData.userAgent || request.headers.get('user-agent') || null,
      user_id: userId,
      user_email: userEmail,
      ip_address: ipAddress,
      additional_data: errorData.additionalData || null,
      created_at: new Date().toISOString()
    }

    // Log to database
    const { error: insertError } = await supabase
      .from('error_logs')
      .insert(errorLog)

    if (insertError) {
      console.error('❌ Failed to log error to database:', insertError)
      // Don't fail the request if logging fails
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to log error',
        logged: false 
      })
    }

    console.log('✅ Error logged:', {
      type: errorLog.error_type,
      message: errorLog.message,
      user: userEmail || 'anonymous',
      url: errorLog.url
    })

    // In production, also send to external service (e.g., Sentry, LogRocket)
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to external error tracking service
      // await sendToSentry(errorLog)
    }

    return NextResponse.json({ success: true, logged: true })

  } catch (error) {
    console.error('❌ Error logging API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        logged: false 
      },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint to retrieve error logs (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Add admin authentication check
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')
    const type = searchParams.get('type')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    let query = supabase
      .from('error_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    // Apply filters
    if (type) {
      query = query.eq('error_type', type)
    }
    if (startDate) {
      query = query.gte('created_at', startDate)
    }
    if (endDate) {
      query = query.lte('created_at', endDate)
    }

    const { data, error } = await query

    if (error) {
      console.error('Failed to fetch error logs:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch logs' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, logs: data })

  } catch (error) {
    console.error('Error fetching logs:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

