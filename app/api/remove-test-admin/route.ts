import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST() {
  try {
    console.log('🔧 Removing test admin user...')

    // Remove test admin user
    const { data: deletedUser, error: userError } = await supabase
      .from('users')
      .delete()
      .eq('email', 'test-admin-flow@example.com')
      .select()
      .single()

    if (userError && userError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('❌ Error deleting test admin user:', userError)
      return NextResponse.json({
        success: false,
        error: 'Failed to delete test admin user',
        details: userError
      })
    }

    console.log('✅ Test admin user removed:', deletedUser)

    // Remove any admin_auth entries for test admin
    const { data: deletedAuth, error: authError } = await supabase
      .from('admin_auth')
      .delete()
      .eq('email', 'test-admin-flow@example.com')
      .select()

    if (authError && authError.code !== 'PGRST116') {
      console.error('❌ Error deleting test admin auth:', authError)
    } else {
      console.log('✅ Test admin auth entries removed:', deletedAuth)
    }

    // Check remaining users
    const { data: remainingUsers, error: listError } = await supabase
      .from('users')
      .select('id, email, user_type, is_verified, is_active')
      .order('created_at', { ascending: false })

    if (listError) {
      console.error('❌ Error listing remaining users:', listError)
    } else {
      console.log('📊 Remaining users:', remainingUsers)
    }

    return NextResponse.json({
      success: true,
      message: 'Test admin user removed successfully!',
      deletedUser: deletedUser,
      remainingUsers: remainingUsers || []
    })

  } catch (error) {
    console.error('❌ Remove test admin error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error
    })
  }
}
