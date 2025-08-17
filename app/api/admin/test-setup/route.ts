import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing admin setup...')

    // Check if admin_auth table exists
    const { data: adminAuth, error: adminAuthError } = await supabase
      .from('admin_auth')
      .select('*')
      .eq('email', 'asereopeyemimichael@gmail.com')
      .single()

    console.log('Admin auth check:', { adminAuth, adminAuthError })

    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'asereopeyemimichael@gmail.com')
      .single()

    console.log('User check:', { user, userError })

    // Check if magic_links table exists
    const { data: magicLinks, error: magicLinksError } = await supabase
      .from('magic_links')
      .select('count')
      .limit(1)

    console.log('Magic links check:', { magicLinks, magicLinksError })

    return NextResponse.json({
      success: true,
      adminAuth: adminAuth || null,
      adminAuthError: adminAuthError?.message || null,
      user: user || null,
      userError: userError?.message || null,
      magicLinksError: magicLinksError?.message || null
    })

  } catch (error) {
    console.error('❌ Admin setup test error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
