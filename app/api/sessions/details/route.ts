import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    console.log('📋 Fetching session details for:', sessionId)

    // Fetch session data
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (sessionError) {
      console.error('❌ Error fetching session:', sessionError)
      return NextResponse.json(
        { error: 'Session not found', details: sessionError.message },
        { status: 404 }
      )
    }

    console.log('✅ Session found:', session.id)
    console.log('📋 Session user_id:', session.user_id)
    console.log('📋 Session therapist_id:', session.therapist_id)

    // Fetch user (patient) data separately
    let userData = null
    if (session.user_id) {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, full_name, email, phone')
        .eq('id', session.user_id)
        .single()
      
      if (userError) {
        console.error('❌ Error fetching user data:', userError)
      } else {
        console.log('✅ User data found:', user)
        userData = user
      }
    }

    // Fetch therapist data separately
    let therapistData = null
    if (session.therapist_id) {
      const { data: therapist, error: therapistError } = await supabase
        .from('users')
        .select('id, full_name, email, phone')
        .eq('id', session.therapist_id)
        .single()
      
      if (therapistError) {
        console.error('❌ Error fetching therapist data:', therapistError)
      } else {
        console.log('✅ Therapist data found:', therapist)
        therapistData = therapist
      }
    }

    // Combine the data
    const enrichedSession = {
      ...session,
      users: userData,
      therapist: therapistData
    }

    console.log('✅ Session details fetched successfully')
    console.log('📋 Enriched session users:', enrichedSession.users)
    console.log('📋 Enriched session therapist:', enrichedSession.therapist)

    return NextResponse.json({
      success: true,
      session: enrichedSession
    })
  } catch (error) {
    console.error('❌ Error in session details API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

