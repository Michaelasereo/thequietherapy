import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email, user_type, type = 'login' } = await request.json()

    if (!email) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email is required' 
      }, { status: 400 })
    }

    console.log('🔄 Fallback magic link request:', { email, user_type, type })

    // Try to create magic link in database
    const supabase = createServerClient()
    const token = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    const { error: magicLinkError } = await supabase
      .from('magic_links')
      .insert({
        email,
        token,
        type,
        auth_type: user_type || 'individual',
        expires_at: expiresAt.toISOString(),
        metadata: { user_type: user_type || 'individual', fallback: true }
      })

    if (magicLinkError) {
      console.error('❌ Fallback magic link creation failed:', magicLinkError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to create magic link: ' + magicLinkError.message 
      }, { status: 500 })
    }

    // Create verification URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://thequietherapy.live'
    const verificationUrl = `${baseUrl}/api/auth/verify-magic-link?token=${token}&auth_type=${user_type || 'individual'}`

    console.log('✅ Fallback magic link created:', { 
      token: token.substring(0, 8) + '...',
      verificationUrl: verificationUrl.substring(0, 50) + '...'
    })

    // Return the magic link URL directly for testing
    return NextResponse.json({
      success: true,
      message: 'Magic link created successfully',
      magicLink: verificationUrl,
      expiresAt: expiresAt.toISOString(),
      note: 'Email service not available - magic link provided directly'
    })

  } catch (error: any) {
    console.error('❌ Fallback magic link error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error: ' + error.message 
    }, { status: 500 })
  }
}
