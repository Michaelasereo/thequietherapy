import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  console.log('🔍 GET /api/auth/roles called')
  
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get all active roles for this user
    const { data: roles, error } = await supabase
      .rpc('get_user_roles', { user_email: email })

    if (error) {
      console.error('❌ Error getting user roles:', error)
      return NextResponse.json({ error: 'Failed to get user roles' }, { status: 500 })
    }

    console.log('✅ User roles found:', roles)

    return NextResponse.json({
      success: true,
      email,
      roles: roles || []
    })

  } catch (error) {
    console.error('❌ Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
