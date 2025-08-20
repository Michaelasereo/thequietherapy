import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST() {
  try {
    console.log('🔧 Clearing all admin users...')

    // Get all admin users first
    const { data: adminUsers, error: fetchError } = await supabase
      .from('users')
      .select('id, email, user_type')
      .eq('user_type', 'admin')

    if (fetchError) {
      console.error('❌ Error fetching admin users:', fetchError)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch admin users',
        details: fetchError
      })
    }

    console.log('📊 Found admin users:', adminUsers)

    if (!adminUsers || adminUsers.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No admin users found to clear',
        deletedUsers: []
      })
    }

    // Delete all admin users
    const { data: deletedUsers, error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('user_type', 'admin')
      .select()

    if (deleteError) {
      console.error('❌ Error deleting admin users:', deleteError)
      return NextResponse.json({
        success: false,
        error: 'Failed to delete admin users',
        details: deleteError
      })
    }

    console.log('✅ Admin users deleted:', deletedUsers)

    // Also clear admin_auth entries
    const { data: deletedAuth, error: authError } = await supabase
      .from('admin_auth')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

    if (authError) {
      console.error('❌ Error deleting admin auth entries:', authError)
    } else {
      console.log('✅ Admin auth entries deleted:', deletedAuth)
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
      message: 'All admin users cleared successfully!',
      deletedUsers: deletedUsers,
      remainingUsers: remainingUsers || []
    })

  } catch (error) {
    console.error('❌ Clear admin users error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error
    })
  }
}
