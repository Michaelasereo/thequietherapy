import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    console.log('🧹 Clearing ALL users and data for fresh testing...')

    // Delete all sessions
    const { error: sessionsError } = await supabase
      .from('user_sessions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

    if (sessionsError) {
      console.error('Error deleting sessions:', sessionsError)
    } else {
      console.log('✅ All sessions cleared')
    }

    // Delete all magic links
    const { error: magicLinksError } = await supabase
      .from('magic_links')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

    if (magicLinksError) {
      console.error('Error deleting magic links:', magicLinksError)
    } else {
      console.log('✅ All magic links cleared')
    }

    // Delete all therapist enrollments
    const { error: enrollmentsError } = await supabase
      .from('therapist_enrollments')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

    if (enrollmentsError) {
      console.error('Error deleting therapist enrollments:', enrollmentsError)
    } else {
      console.log('✅ All therapist enrollments cleared')
    }

    // Delete all users
    const { error: usersError } = await supabase
      .from('users')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

    if (usersError) {
      console.error('Error deleting users:', usersError)
    } else {
      console.log('✅ All users cleared')
    }

    // Verify everything is cleared
    const { data: remainingUsers } = await supabase
      .from('users')
      .select('count')
      .limit(1)

    const { data: remainingSessions } = await supabase
      .from('user_sessions')
      .select('count')
      .limit(1)

    const { data: remainingMagicLinks } = await supabase
      .from('magic_links')
      .select('count')
      .limit(1)

    console.log('✅ Database cleared successfully')

    return NextResponse.json({
      success: true,
      message: 'All users and data cleared for fresh testing',
      remainingData: {
        users: remainingUsers?.length || 0,
        sessions: remainingSessions?.length || 0,
        magicLinks: remainingMagicLinks?.length || 0
      }
    })

  } catch (error) {
    console.error('❌ Clear all users error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
