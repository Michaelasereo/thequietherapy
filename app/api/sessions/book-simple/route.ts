import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/server-auth'

/**
 * SECURED: book-simple endpoint now proxies to main booking endpoint
 * with proper authentication and validation.
 * 
 * This maintains backward compatibility while ensuring all bookings
 * go through the secure, atomic booking flow with credit deduction.
 */
export async function POST(request: NextRequest) {
  try {
    // 🚨 CRITICAL: Require authentication before processing
    const authResult = await requireApiAuth(['individual'])
    if ('error' in authResult) {
      return authResult.error
    }

    const { session } = authResult
    const authenticatedUserId = session.user.id // Enforce authenticated user

    // Parse incoming request (may include legacy fields)
    const requestBody = await request.json()
    const {
      user_id, // Legacy field - will be ignored, using authenticated user instead
      therapist_id,
      session_date,
      start_time,
      end_time, // Legacy field - duration is calculated instead
      duration = 60, // Default to 60 minutes (book-simple legacy default)
      session_type = 'video', // Map 'individual' to 'video' for main endpoint
      patient_name,
      patient_email,
      patient_phone,
      complaints
    } = requestBody

    // Validate required fields
    if (!therapist_id || !session_date || !start_time) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: therapist_id, session_date, start_time' 
        },
        { status: 400 }
      )
    }

    // Calculate duration from end_time if provided (legacy support)
    let calculatedDuration = duration
    if (end_time && start_time) {
      const start = new Date(`${session_date}T${start_time}:00`)
      const end = new Date(`${session_date}T${end_time}:00`)
      const diffMinutes = Math.round((end.getTime() - start.getTime()) / 60000)
      if (diffMinutes > 0) {
        calculatedDuration = diffMinutes
      }
    }

    // Build notes from legacy fields if provided
    let notes = ''
    if (patient_name || patient_email || patient_phone || complaints) {
      const noteParts = []
      if (patient_name) noteParts.push(`Patient: ${patient_name}`)
      if (patient_email) noteParts.push(`Email: ${patient_email}`)
      if (patient_phone) noteParts.push(`Phone: ${patient_phone}`)
      if (complaints) noteParts.push(`Concerns: ${complaints}`)
      notes = noteParts.join(', ')
    }

    // Map session_type from legacy 'individual' to 'video'
    const mappedSessionType = session_type === 'individual' ? 'video' : session_type

    // Transform request to match main booking endpoint format
    const mainEndpointPayload = {
      therapist_id,
      session_date,
      start_time,
      duration: calculatedDuration,
      session_type: mappedSessionType,
      notes: notes || `Booking by ${session.user.full_name || session.user.email}`
    }

    console.log('🔄 book-simple: Proxying to main booking endpoint', {
      authenticated_user_id: authenticatedUserId,
      therapist_id,
      session_date,
      start_time,
      duration: calculatedDuration,
      legacy_user_id: user_id ? 'IGNORED (using authenticated user)' : 'not provided'
    })

    // Proxy to main booking endpoint
    // Forward all cookies for authentication
    const cookieHeader = request.headers.get('cookie')
    const authHeader = request.headers.get('authorization')

    // Build headers with authentication
    const proxyHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    }
    
    if (cookieHeader) {
      proxyHeaders['Cookie'] = cookieHeader
    }
    
    if (authHeader) {
      proxyHeaders['Authorization'] = authHeader
    }

    // Forward other relevant headers
    const forwardedHeaders = ['x-forwarded-for', 'user-agent', 'referer']
    forwardedHeaders.forEach(headerName => {
      const value = request.headers.get(headerName)
      if (value) {
        proxyHeaders[headerName] = value
      }
    })

    const baseUrl = request.nextUrl.origin
    const mainEndpointUrl = new URL('/api/sessions/book', baseUrl)

    try {
      const proxyResponse = await fetch(mainEndpointUrl.toString(), {
        method: 'POST',
        headers: proxyHeaders,
        body: JSON.stringify(mainEndpointPayload)
      })

      const proxyResponseData = await proxyResponse.json()

      // Maintain backward compatibility with book-simple response format
      if (proxyResponse.ok && proxyResponseData.data?.session) {
        return NextResponse.json({
          success: true,
          session: proxyResponseData.data.session,
          message: 'Session booked successfully'
        })
      }

      // Forward error responses
      return NextResponse.json(
        proxyResponseData,
        { status: proxyResponse.status }
      )

    } catch (fetchError) {
      console.error('❌ Error proxying to main booking endpoint:', fetchError)
      throw fetchError
    }

  } catch (error) {
    console.error('💥 Error in secured book-simple API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}