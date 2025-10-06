import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireApiAuth } from '@/lib/server-auth'
import { handleApiError, successResponse } from '@/lib/api-response'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Admin /me endpoint called')

    // SECURE Authentication Check - only admins can access admin info
    const authResult = await requireApiAuth(['admin'])
    if ('error' in authResult) {
      return authResult.error
    }

    const { session } = authResult
    const adminId = session.user.id // This is now TRUSTED and verified

    console.log('🔍 Admin session found:', {
      id: session.user.id,
      email: session.user.email,
      role: session.user.user_type
    })

    // Verify admin user exists in database
    const { data: adminUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', adminId)
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
        session_token: session.session_token,
        created_at: adminUser.created_at,
        last_login_at: adminUser.last_login_at
      }
    })

  } catch (error) {
    return handleApiError(error)
  }
}
