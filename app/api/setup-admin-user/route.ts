import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST() {
  try {
    const adminEmail = 'asereopeyemimichael@gmail.com'
    
    console.log('🔧 Setting up admin user for:', adminEmail)

    // First, check if user exists in users table
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', adminEmail)
      .single()

    let userId: string

    if (userError || !existingUser) {
      // Create user if doesn't exist
      console.log('📝 Creating new user...')
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          email: adminEmail,
          full_name: 'Admin User',
          user_type: 'admin',
          is_verified: true,
          is_active: true
        })
        .select()
        .single()

      if (createError) {
        console.error('❌ Error creating user:', createError)
        return NextResponse.json({
          success: false,
          error: 'Failed to create user',
          details: createError
        })
      }

      userId = newUser.id
      console.log('✅ User created with ID:', userId)
    } else {
      userId = existingUser.id
      console.log('✅ User already exists with ID:', userId)
    }

    // Check if admin_auth entry exists
    const { data: existingAdmin, error: adminError } = await supabase
      .from('admin_auth')
      .select('*')
      .eq('email', adminEmail)
      .single()

    if (adminError || !existingAdmin) {
      // Create admin_auth entry
      console.log('📝 Creating admin auth entry...')
      const { error: createAdminError } = await supabase
        .from('admin_auth')
        .insert({
          user_id: userId,
          email: adminEmail,
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

      if (createAdminError) {
        console.error('❌ Error creating admin auth:', createAdminError)
        return NextResponse.json({
          success: false,
          error: 'Failed to create admin auth',
          details: createAdminError
        })
      }

      console.log('✅ Admin auth entry created')
    } else {
      console.log('✅ Admin auth entry already exists')
    }

    console.log('🎉 Admin user setup complete!')
    return NextResponse.json({
      success: true,
      message: 'Admin user setup complete!',
      userId: userId,
      email: adminEmail
    })

  } catch (error) {
    console.error('❌ Setup admin user error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error
    })
  }
}
