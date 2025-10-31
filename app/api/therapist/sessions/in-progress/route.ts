import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireApiAuth } from '@/lib/server-auth'

export async function GET(request: NextRequest) {
  try {
    // Auth: therapist only
    const authResult = await requireApiAuth(['therapist'])
    if ('error' in authResult) {
      return authResult.error
    }

    const therapistId = authResult.session.user.id

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: sessions, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('therapist_id', therapistId)
      .eq('status', 'in_progress')
      .order('start_time', { ascending: false })
      .limit(10)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, sessions: sessions || [] })
  } catch (err) {
    console.error('Therapist in-progress sessions API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


