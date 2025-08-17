import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET() {
  try {
    console.log('🔍 Checking admin user...')

    // Check if admin user exists in admin_auth table
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_auth')
      .select('*')
      .eq('email', 'asereopeyemimichael@gmail.com')
      .single()

    if (adminError) {
      console.log('❌ Admin user not found in admin_auth:', adminError.message)
    } else {
      console.log('✅ Admin user found in admin_auth:', adminUser)
    }

    // Check if user exists in users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'asereopeyemimichael@gmail.com')
      .single()

    if (userError) {
      console.log('❌ User not found in users table:', userError.message)
    } else {
      console.log('✅ User found in users table:', user)
    }

    return NextResponse.json({
      success: true,
      adminAuth: adminUser || null,
      user: user || null,
      adminError: adminError?.message || null,
      userError: userError?.message || null
    })

  } catch (error) {
    console.error('❌ Check admin user error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error
    })
  }
}
