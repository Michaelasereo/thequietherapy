import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const email = searchParams.get('email')
  const token = searchParams.get('token')

  console.log('🔍 Test verification endpoint called')
  console.log('Email:', email)
  console.log('Token:', token)

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check if magic link exists
    const { data: magicLink, error: magicLinkError } = await supabase
      .from('magic_links')
      .select('*')
      .eq('email', email)
      .eq('token', token)
      .single()

    console.log('Magic link found:', magicLink)
    console.log('Magic link error:', magicLinkError)

    if (magicLinkError) {
      return NextResponse.json({
        error: 'Magic link not found',
        details: magicLinkError.message
      })
    }

    // Check if magic link is expired
    const now = new Date()
    const expiresAt = new Date(magicLink.expires_at)
    const isExpired = now > expiresAt

    console.log('Current time:', now)
    console.log('Expires at:', expiresAt)
    console.log('Is expired:', isExpired)

    // Check if magic link is already used
    const isUsed = magicLink.used_at !== null

    console.log('Is used:', isUsed)

    return NextResponse.json({
      magicLink,
      isExpired,
      isUsed,
      isValid: !isExpired && !isUsed
    })

  } catch (error) {
    console.error('Test verification error:', error)
    return NextResponse.json({
      error: 'Test failed',
      details: error
    })
  }
}
