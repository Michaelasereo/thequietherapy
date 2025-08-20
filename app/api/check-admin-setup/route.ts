import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET() {
  try {
    console.log('🔍 Checking admin setup...')

    // Check for admin user in users table
    const { data: adminUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'asereopeyemimichael@gmail.com')
      .single()

    // Check for admin_auth entry
    const { data: adminAuth, error: authError } = await supabase
      .from('admin_auth')
      .select('*')
      .eq('email', 'asereopeyemimichael@gmail.com')
      .single()

    // Check all users in the system
    const { data: allUsers, error: allUsersError } = await supabase
      .from('users')
      .select('id, email, user_type, is_verified, is_active')
      .order('created_at', { ascending: false })

    return NextResponse.json({
      success: true,
      adminUser: adminUser || null,
      adminAuth: adminAuth || null,
      allUsers: allUsers || [],
      userError: userError?.message || null,
      authError: authError?.message || null,
      allUsersError: allUsersError?.message || null,
      status: {
        hasAdminUser: !!adminUser,
        hasAdminAuth: !!adminAuth,
        totalUsers: allUsers?.length || 0
      }
    })

  } catch (error) {
    console.error('❌ Check admin setup error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error
    })
  }
}

export async function POST() {
  try {
    console.log('🔧 Setting up admin user...')
    
    // Call the setup admin user endpoint
    const setupResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/setup-admin-user`, {
      method: 'POST'
    })
    
    const setupResult = await setupResponse.json()
    
    return NextResponse.json(setupResult)

  } catch (error) {
    console.error('❌ Setup admin error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error
    })
  }
}
