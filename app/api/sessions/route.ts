import { NextRequest, NextResponse } from "next/server"
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await import('next/headers').then(m => m.cookies())
    const userCookie = cookieStore.get("trpi_user")?.value
    
    if (!userCookie) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      )
    }

    const userData = JSON.parse(userCookie)

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get user sessions with therapist info
    const { data: sessions, error } = await supabase
      .from('sessions')
      .select(`
        *,
        therapist:therapists(full_name, specialization)
      `)
      .eq('user_id', userData.id)
      .order('scheduled_date', { ascending: true })

    if (error) {
      console.error('Get sessions error:', error)
      return NextResponse.json(
        { error: 'Failed to get sessions' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      sessions: sessions || []
    })

  } catch (error) {
    console.error('Get sessions error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
