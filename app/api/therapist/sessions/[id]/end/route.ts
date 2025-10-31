import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireApiAuth } from '@/lib/server-auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Auth: therapist only
    const authResult = await requireApiAuth(['therapist'])
    if ('error' in authResult) {
      return authResult.error
    }

    const therapistId = authResult.session.user.id

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify session ownership and current state
    const { data: sessionRecord, error: fetchErr } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', id)
      .eq('therapist_id', therapistId)
      .single()

    if (fetchErr || !sessionRecord) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Allow ending when in_progress or scheduled-but-started running late; set completed and end_time
    const { error: updateErr } = await supabase
      .from('sessions')
      .update({ status: 'completed', end_time: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('therapist_id', therapistId)

    if (updateErr) {
      return NextResponse.json({ error: 'Failed to end session' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('End session API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


