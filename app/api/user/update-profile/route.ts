import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ServerSessionManager } from '@/lib/server-session-manager'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PUT(request: NextRequest) {
  try {
    // Get authenticated user session
    const session = await ServerSessionManager.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const userId = session.id
    const body = await request.json()
    const { full_name } = body

    console.log('🔍 Updating user profile:', { userId, full_name })

    // Update user profile in the users table
    const { data, error } = await supabase
      .from('users')
      .update({ 
        full_name: full_name,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('❌ Error updating user profile:', error)
      return NextResponse.json({ 
        error: 'Failed to update profile',
        details: error.message 
      }, { status: 500 })
    }

    console.log('✅ User profile updated successfully')

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: data
    })

  } catch (error) {
    console.error('❌ Profile update error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
