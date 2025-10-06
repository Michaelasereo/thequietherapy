import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SessionManager } from '@/lib/session-manager'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token is required' },
        { status: 400 }
      )
    }

    console.log('🔍 Verifying admin magic link:', { token: token.substring(0, 8) + '...' })

    // Find the magic link
    const { data: magicLink, error: magicLinkError } = await supabase
      .from('magic_links')
      .select('*')
      .eq('token', token)
      .eq('auth_type', 'admin')
      .is('used_at', null)
      .single()

    if (magicLinkError || !magicLink) {
      console.error('❌ Magic link not found or already used:', magicLinkError)
      return NextResponse.json(
        { success: false, error: 'Invalid or expired magic link' },
        { status: 400 }
      )
    }

    console.log('✅ Magic link found:', {
      id: magicLink.id,
      email: magicLink.email,
      expiresAt: magicLink.expires_at
    })

    // Check if expired
    const now = new Date()
    const expiresAt = new Date(magicLink.expires_at)
    
    if (expiresAt < now) {
      console.log('❌ Magic link expired')
      return NextResponse.json(
        { success: false, error: 'Magic link has expired' },
        { status: 400 }
      )
    }

    // Mark as used
    const { error: updateError } = await supabase
      .from('magic_links')
      .update({ used_at: new Date().toISOString() })
      .eq('id', magicLink.id)

    if (updateError) {
      console.error('❌ Error marking magic link as used:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to process magic link' },
        { status: 500 }
      )
    }

    console.log('✅ Magic link marked as used')

    // Get user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', magicLink.email)
      .single()

    if (userError || !userData) {
      console.error('❌ User not found:', userError)
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    console.log('✅ User found:', {
      id: userData.id,
      email: userData.email,
      user_type: userData.user_type
    })

    // Create unified session using SessionManager
    const sessionResult = await SessionManager.createSession({
      id: userData.id,
      email: userData.email,
      name: userData.full_name || userData.email?.split('@')[0] || 'Admin',
      role: 'admin',
      user_type: 'admin',
      is_verified: userData.is_verified || true,
      is_active: userData.is_active || true
    })

    if (!sessionResult) {
      console.error('❌ Failed to create admin session')
      return NextResponse.json(
        { success: false, error: 'Failed to create session' },
        { status: 500 }
      )
    }

    console.log('✅ Admin unified session created')

    // Redirect to admin dashboard
    console.log('🔄 Redirecting to admin dashboard')
    return NextResponse.redirect(new URL('/admin/dashboard', request.url))

  } catch (error) {
    console.error('❌ Admin magic link verification error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
