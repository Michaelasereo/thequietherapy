import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST() {
  try {
    console.log('🔧 Fixing admin user ID mismatch...')

    const adminEmail = 'asereopeyemimichael@gmail.com'

    // Get the correct user ID from users table
    const { data: adminUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', adminEmail)
      .single()

    if (userError || !adminUser) {
      return NextResponse.json({
        success: false,
        error: 'Admin user not found in users table'
      })
    }

    console.log('✅ Found admin user ID:', adminUser.id)

    // Update the admin_auth table with the correct user_id
    const { data: updatedAdminAuth, error: updateError } = await supabase
      .from('admin_auth')
      .update({ user_id: adminUser.id })
      .eq('email', adminEmail)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Error updating admin auth:', updateError)
      return NextResponse.json({
        success: false,
        error: 'Failed to update admin auth',
        details: updateError
      })
    }

    console.log('✅ Admin auth updated successfully')

    return NextResponse.json({
      success: true,
      message: 'Admin user ID fixed successfully!',
      adminUser: {
        id: adminUser.id,
        email: adminEmail
      },
      adminAuth: updatedAdminAuth
    })

  } catch (error) {
    console.error('❌ Fix admin user ID error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error
    })
  }
}
