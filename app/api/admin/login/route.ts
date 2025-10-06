import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'
import { sendMagicLinkEmail } from '@/lib/email'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      )
    }

    // Only allow the specific admin email
    if (email !== 'asereopeyemimichael@gmail.com') {
      return NextResponse.json(
        { success: false, error: 'Access denied. Admin login restricted.' },
        { status: 403 }
      )
    }

    console.log('🔑 Admin login request for:', email)

    // Create magic link directly
    const token = randomUUID()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    console.log('✅ Creating magic link for admin:', { 
      token: token.substring(0, 8) + '...', 
      expiresAt: expiresAt.toISOString() 
    })

    const { error: magicLinkError } = await supabase
      .from('magic_links')
      .insert({
        email,
        token,
        type: 'login',
        auth_type: 'admin',
        expires_at: expiresAt.toISOString(),
        metadata: { auth_type: 'admin' }
      })

    if (magicLinkError) {
      console.error('❌ Error creating magic link:', magicLinkError)
      return NextResponse.json(
        { success: false, error: 'Failed to create magic link' },
        { status: 500 }
      )
    }

    // Send the magic link email
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/api/auth/verify-admin-magic-link?token=${token}`
    
    console.log('📧 Sending magic link email...')
    const emailResult = await sendMagicLinkEmail(email, verificationUrl, 'login', { auth_type: 'admin' })
    
    if (!emailResult.success) {
      console.error('❌ Failed to send magic link email:', emailResult.error)
      console.log('⚠️ Magic link created but email failed to send. Token:', token.substring(0, 8) + '...')
    } else {
      console.log('✅ Magic link email sent successfully')
    }

    return NextResponse.json({
      success: true,
      message: 'Magic link sent! Check your email to log in.'
    })

  } catch (error) {
    console.error('❌ Admin login API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
