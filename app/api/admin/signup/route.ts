import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const ALLOWED_ADMIN_EMAIL = "asereopeyemimichael@gmail.com"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, fullName } = body

    console.log('🔧 Admin signup attempt:', { email, fullName })

    // Validate required fields
    if (!email || !fullName) {
      return NextResponse.json({
        success: false,
        error: 'Email and full name are required'
      }, { status: 400 })
    }

    // Check if email is allowed
    if (email !== ALLOWED_ADMIN_EMAIL) {
      console.log('❌ Unauthorized admin signup attempt:', email)
      return NextResponse.json({
        success: false,
        error: 'Only authorized administrators can register for admin access'
      }, { status: 403 })
    }

    // Check if admin user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, email, user_type')
      .eq('email', email)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('❌ Error checking existing user:', checkError)
      return NextResponse.json({
        success: false,
        error: 'Failed to check existing user'
      }, { status: 500 })
    }

    if (existingUser) {
      console.log('❌ Admin user already exists:', existingUser)
      return NextResponse.json({
        success: false,
        error: 'Admin user already exists. Please use the login page instead.'
      }, { status: 409 })
    }

    // Create admin user
    console.log('📝 Creating new admin user...')
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        email: email,
        full_name: fullName,
        user_type: 'admin',
        is_verified: true,
        is_active: true
      })
      .select()
      .single()

    if (createError) {
      console.error('❌ Error creating admin user:', createError)
      return NextResponse.json({
        success: false,
        error: 'Failed to create admin user',
        details: createError
      }, { status: 500 })
    }

    console.log('✅ Admin user created:', {
      id: newUser.id,
      email: newUser.email,
      user_type: newUser.user_type
    })

    // Create admin_auth entry
    console.log('📝 Creating admin auth entry...')
    const { error: authError } = await supabase
      .from('admin_auth')
      .insert({
        user_id: newUser.id,
        email: email,
        is_verified: true,
        is_active: true,
        role: 'admin',
        permissions: {
          all: true,
          manage_users: true,
          view_analytics: true,
          approve_therapists: true
        }
      })

    if (authError) {
      console.error('❌ Error creating admin auth:', authError)
      // Don't fail the signup if admin_auth creation fails, but log it
      console.log('⚠️ Admin auth creation failed, but user was created')
    } else {
      console.log('✅ Admin auth entry created')
    }

    // Send magic link for admin login
    console.log('📧 Sending admin magic link...')
    const { error: magicLinkError } = await supabase
      .from('magic_links')
      .insert({
        email: email,
        token: 'admin-magic-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        type: 'login',
        auth_type: 'admin',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        used_at: null
      })

    if (magicLinkError) {
      console.error('❌ Error creating magic link:', magicLinkError)
      return NextResponse.json({
        success: false,
        error: 'Failed to send magic link'
      }, { status: 500 })
    }

    console.log('✅ Admin signup completed successfully!')
    return NextResponse.json({
      success: true,
      message: 'Admin account created successfully! Please check your email for the login link.',
      user: {
        id: newUser.id,
        email: newUser.email,
        full_name: newUser.full_name,
        user_type: newUser.user_type
      }
    })

  } catch (error) {
    console.error('❌ Admin signup error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error
    }, { status: 500 })
  }
}
