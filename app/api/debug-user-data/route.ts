import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get all users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    // Get all active sessions
    const { data: sessions, error: sessionsError } = await supabase
      .from('user_sessions')
      .select('*')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })

    // Get all magic links
    const { data: magicLinks, error: magicLinksError } = await supabase
      .from('magic_links')
      .select('*')
      .order('created_at', { ascending: false })

    return NextResponse.json({
      users: users || [],
      sessions: sessions || [],
      magicLinks: magicLinks || [],
      errors: {
        users: usersError?.message,
        sessions: sessionsError?.message,
        magicLinks: magicLinksError?.message
      }
    })

  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({ error: 'Debug failed' }, { status: 500 })
  }
}
