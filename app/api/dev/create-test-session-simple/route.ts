import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ServerSessionManager } from '@/lib/server-session-manager'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // Get current therapist session
    const session = await ServerSessionManager.getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized - therapist not logged in' },
        { status: 401 }
      )
    }

    const therapistId = session.id
    const { test_user_id } = await request.json()

    if (!test_user_id) {
      return NextResponse.json(
        { error: 'Test user ID is required' },
        { status: 400 }
      )
    }

    console.log('🧪 Creating SIMPLE test session for:', {
      therapist_id: therapistId,
      user_id: test_user_id
    })

    // Create session starting NOW (for immediate testing)
    const now = new Date()
    const startTime = new Date(now.getTime() - 5 * 60 * 1000) // 5 min ago
    const endTime = new Date(now.getTime() + 35 * 60 * 1000) // 35 min from now

    // ULTRA-MINIMAL insert - only required columns
    const { data: newSession, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        user_id: test_user_id,
        therapist_id: therapistId,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
      })
      .select()
      .single()

    if (sessionError) {
      console.error('❌ Error creating test session:', sessionError)
      return NextResponse.json(
        { error: 'Failed to create test session', details: sessionError.message },
        { status: 500 }
      )
    }

    console.log('✅ Test session created:', newSession.id)

    return NextResponse.json({
      success: true,
      session: newSession,
      message: 'Test session created successfully'
    })

  } catch (error) {
    console.error('❌ Error in create-test-session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

