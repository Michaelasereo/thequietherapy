import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { SessionManager } from '@/lib/session-manager'

export async function PUT(request: NextRequest) {
  try {
    // Get the user's session from our auth system
    const session = await SessionManager.getSessionFromRequest(request)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const supabase = createServerClient()
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('user_type')
      .eq('id', session.id)
      .single()

    if (userError || !userData || userData.user_type !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { therapistId, sessionRate } = body

    // Validate input
    if (!therapistId || !sessionRate) {
      return NextResponse.json(
        { error: 'Missing required fields: therapistId, sessionRate' },
        { status: 400 }
      )
    }

    if (typeof sessionRate !== 'number' || sessionRate < 0) {
      return NextResponse.json(
        { error: 'Session rate must be a positive number' },
        { status: 400 }
      )
    }

    // Update therapist session rate
    const { data, error } = await supabase
      .from('therapist_profiles')
      .update({ 
        session_rate: sessionRate,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', therapistId)
      .select()
      .single()

    if (error) {
      console.error('Database error updating therapist rate:', error)
      return NextResponse.json(
        { error: 'Failed to update therapist rate', details: error.message },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Therapist not found' },
        { status: 404 }
      )
    }

    console.log('✅ Updated therapist rate:', { therapistId, sessionRate })

    return NextResponse.json({
      success: true,
      message: 'Therapist rate updated successfully',
      therapist: {
        id: therapistId,
        session_rate: sessionRate
      }
    })

  } catch (error) {
    console.error('Error updating therapist rate:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get the user's session from our auth system
    const session = await SessionManager.getSessionFromRequest(request)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const supabase = createServerClient()
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('user_type')
      .eq('id', session.id)
      .single()

    if (userError || !userData || userData.user_type !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const therapistId = searchParams.get('therapistId')

    if (!therapistId) {
      return NextResponse.json(
        { error: 'Missing therapistId parameter' },
        { status: 400 }
      )
    }

    // Get therapist rate
    const { data, error } = await supabase
      .from('therapist_profiles')
      .select('user_id, session_rate, updated_at')
      .eq('user_id', therapistId)
      .single()

    if (error) {
      console.error('Database error fetching therapist rate:', error)
      return NextResponse.json(
        { error: 'Failed to fetch therapist rate', details: error.message },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Therapist not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      therapist: {
        id: data.user_id,
        session_rate: data.session_rate,
        updated_at: data.updated_at
      }
    })

  } catch (error) {
    console.error('Error fetching therapist rate:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
