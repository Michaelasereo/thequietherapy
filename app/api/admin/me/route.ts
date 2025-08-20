import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Admin /me endpoint called')

    // Get admin session cookie
    const cookieStore = await cookies()
    const adminCookie = cookieStore.get('trpi_admin_user')

    if (!adminCookie?.value) {
      console.log('❌ No admin session cookie found')
      return NextResponse.json(
        { success: false, error: 'No admin session found' },
        { status: 401 }
      )
    }

    let adminSession
    try {
      adminSession = JSON.parse(adminCookie.value)
    } catch (error) {
      console.error('❌ Error parsing admin session cookie:', error)
      return NextResponse.json(
        { success: false, error: 'Invalid admin session' },
        { status: 401 }
      )
    }

    console.log('🔍 Admin session found:', {
      id: adminSession.id,
      email: adminSession.email,
      role: adminSession.role
    })

    // Verify admin user exists in database
    const { data: adminUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', adminSession.email)
      .eq('user_type', 'admin')
      .single()

    if (userError || !adminUser) {
      console.error('❌ Admin user not found in database:', userError)
      return NextResponse.json(
        { success: false, error: 'Admin user not found' },
        { status: 404 }
      )
    }

    // Check if admin is active
    if (!adminUser.is_active || !adminUser.is_verified) {
      console.log('❌ Admin user is not active or verified')
      return NextResponse.json(
        { success: false, error: 'Admin account is not active' },
        { status: 403 }
      )
    }

    console.log('✅ Admin user validated successfully:', {
      id: adminUser.id,
      email: adminUser.email,
      user_type: adminUser.user_type
    })

    return NextResponse.json({
      success: true,
      admin: {
        id: adminUser.id,
        email: adminUser.email,
        full_name: adminUser.full_name,
        user_type: adminUser.user_type,
        is_verified: adminUser.is_verified,
        is_active: adminUser.is_active,
        session_token: adminSession.session_token,
        created_at: adminUser.created_at,
        last_login_at: adminUser.last_login_at
      }
    })

  } catch (error) {
    console.error('❌ Admin /me endpoint error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
