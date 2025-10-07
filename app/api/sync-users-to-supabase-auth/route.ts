import { NextResponse } from 'next/server'
import { syncAllUsersToSupabaseAuth, getAllSupabaseAuthUsers } from '@/lib/supabase-auth-sync'

export async function POST() {
  try {
    console.log('🔄 Starting manual sync of all users to Supabase auth...')
    
    const syncResult = await syncAllUsersToSupabaseAuth()
    
    if (!syncResult.success) {
      return NextResponse.json({
        success: false,
        error: syncResult.error
      }, { status: 500 })
    }

    // Get current Supabase auth users count
    const authUsersResult = await getAllSupabaseAuthUsers()
    
    return NextResponse.json({
      success: true,
      message: 'User sync completed successfully',
      sync: {
        total: (syncResult as any).total || 0,
        successful: (syncResult as any).successful || 0,
        failed: (syncResult as any).failed || 0,
        results: syncResult.results
      },
      supabase_auth: {
        total_users: authUsersResult.success ? authUsersResult.users?.length || 0 : 'Unknown',
        users: authUsersResult.success && authUsersResult.users ? authUsersResult.users.map(u => ({
          id: u.id,
          email: u.email,
          user_type: u.user_metadata?.user_type,
          created_at: u.created_at,
          last_sign_in: u.last_sign_in_at
        })) : []
      }
    })
  } catch (error) {
    console.error('❌ Error in sync-users-to-supabase-auth:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to sync users to Supabase auth',
      details: error
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    console.log('📋 Getting Supabase auth users...')
    
    const authUsersResult = await getAllSupabaseAuthUsers()
    
    if (!authUsersResult.success) {
      return NextResponse.json({
        success: false,
        error: authUsersResult.error
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Supabase auth users retrieved successfully',
      data: {
        total_users: authUsersResult.users?.length || 0,
        users: authUsersResult.users ? authUsersResult.users.map(u => ({
          id: u.id,
          email: u.email,
          user_type: u.user_metadata?.user_type,
          full_name: u.user_metadata?.full_name,
          phone: u.user_metadata?.phone,
          created_at: u.created_at,
          last_sign_in: u.last_sign_in_at,
          email_confirmed: u.email_confirmed_at,
          provider: u.app_metadata?.provider
        })) : []
      }
    })
  } catch (error) {
    console.error('❌ Error getting Supabase auth users:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get Supabase auth users',
      details: error
    }, { status: 500 })
  }
}
