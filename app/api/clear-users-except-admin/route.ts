import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    console.log('🧹 Clearing all users except admin...')

    // Delete all sessions except admin sessions
    const { error: sessionsError } = await supabase
      .from('user_sessions')
      .delete()
      .neq('user_id', 'fac0056c-2f16-4417-a1ae-9c63345937c8') // Admin user ID

    if (sessionsError) {
      console.error('Error deleting sessions:', sessionsError)
    } else {
      console.log('✅ Sessions cleared')
    }

    // Delete all magic links except admin magic links
    const { error: magicLinksError } = await supabase
      .from('magic_links')
      .delete()
      .neq('email', 'asereopeyemimichael@gmail.com')

    if (magicLinksError) {
      console.error('Error deleting magic links:', magicLinksError)
    } else {
      console.log('✅ Magic links cleared')
    }

    // Delete all therapist enrollments except admin
    const { error: enrollmentsError } = await supabase
      .from('therapist_enrollments')
      .delete()
      .neq('email', 'asereopeyemimichael@gmail.com')

    if (enrollmentsError) {
      console.error('Error deleting therapist enrollments:', enrollmentsError)
    } else {
      console.log('✅ Therapist enrollments cleared')
    }

    // Delete all users except admin
    const { error: usersError } = await supabase
      .from('users')
      .delete()
      .neq('email', 'asereopeyemimichael@gmail.com')

    if (usersError) {
      console.error('Error deleting users:', usersError)
    } else {
      console.log('✅ Users cleared')
    }

    // Verify admin user still exists
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('id, email, full_name, user_type, is_verified, is_active')
      .eq('email', 'asereopeyemimichael@gmail.com')
      .single()

    if (adminError) {
      console.error('Error verifying admin user:', adminError)
      return NextResponse.json({ error: 'Admin user not found' }, { status: 500 })
    }

    console.log('✅ Admin user verified:', adminUser)

    return NextResponse.json({
      success: true,
      message: 'All users cleared except admin',
      adminUser
    })

  } catch (error) {
    console.error('❌ Clear users error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
