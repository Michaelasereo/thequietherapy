import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.json({ error: 'No token provided' })
  }

  try {
    // Check if magic link exists
    const { data: magicLink, error: findError } = await supabase
      .from('magic_links')
      .select('*')
      .eq('token', token)
      .single()

    if (findError) {
      return NextResponse.json({ 
        error: 'Magic link not found', 
        details: findError,
        token: token 
      })
    }

    if (!magicLink) {
      return NextResponse.json({ 
        error: 'Magic link not found', 
        token: token 
      })
    }

    // Check if it's expired
    const now = new Date()
    const expiresAt = new Date(magicLink.expires_at)
    const isExpired = now > expiresAt

    // Check if it's already used
    const isUsed = magicLink.used_at !== null

    return NextResponse.json({
      magicLink,
      isExpired,
      isUsed,
      now: now.toISOString(),
      expiresAt: expiresAt.toISOString()
    })

  } catch (error) {
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error 
    })
  }
}
