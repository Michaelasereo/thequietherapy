import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  console.log('🚀 PARTNER API /me CALLED')
  console.log('🔍 GET /partner/me called')
  console.log('📧 Request URL:', request.url)
  console.log('📧 User Agent:', request.headers.get('user-agent'))
  console.log('📧 Referer:', request.headers.get('referer'))
  
  try {
    // Get session token from cookie
    const cookieHeader = request.headers.get('cookie')
    console.log('🔍 Cookie header:', cookieHeader)
    
    if (!cookieHeader) {
      console.log('❌ No cookie header found')
      return NextResponse.json({ error: 'No session found' }, { status: 401 })
    }

    // Parse cookies more robustly
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=')
      if (key && value) {
        acc[key.trim()] = value.trim()
      }
      return acc
    }, {} as Record<string, string>)

    console.log('🔍 Parsed cookies:', cookies)

    const trpiPartnerUserCookie = cookies['trpi_partner_user']
    if (!trpiPartnerUserCookie) {
      console.log('❌ No trpi_partner_user cookie found')
      console.log('🔍 Available cookies:', Object.keys(cookies))
      return NextResponse.json({ error: 'No session found' }, { status: 401 })
    }

    console.log('🔍 Found trpi_partner_user cookie:', trpiPartnerUserCookie)

    let userData
    try {
      // Handle both URL-encoded and plain JSON
      const decodedCookie = decodeURIComponent(trpiPartnerUserCookie)
      console.log('🔍 Decoded cookie:', decodedCookie)
      userData = JSON.parse(decodedCookie)
      console.log('🔍 Parsed user data:', userData)
    } catch (parseError) {
      console.log('❌ Error parsing user cookie:', parseError)
      console.log('🔍 Raw cookie value:', trpiPartnerUserCookie)
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    const { id, email } = userData
    if (!id || !email) {
      console.log('❌ No user id or email in cookie')
      return NextResponse.json({ error: 'Invalid session data' }, { status: 401 })
    }

    console.log('🔍 Validating user:', { id, email })

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get user data from users table
    console.log('🔍 Making database query to get user data...')
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        full_name,
        user_type,
        partner_status,
        temporary_approval,
        company_name,
        organization_type,
        contact_person
      `)
      .eq('id', id)
      .eq('email', email)
      .eq('user_type', 'partner')
      .single()

    console.log('🔍 User query result:', { user, userError })

    if (userError || !user) {
      console.log('❌ User not found or not a partner:', userError?.message)
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 })
    }

    // Check if partner has valid status
    if (user.partner_status !== 'active' && user.partner_status !== 'temporary') {
      console.log('❌ Partner status not valid:', user.partner_status)
      return NextResponse.json({ error: 'Partner account not approved' }, { status: 403 })
    }

    console.log('✅ Session validated for partner:', user.email)

    const responseData = {
      success: true,
      partner: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        partner_status: user.partner_status,
        temporary_approval: user.temporary_approval,
        company_name: user.company_name,
        organization_type: user.organization_type,
        contact_person: user.contact_person
      }
    }

    console.log('✅ Returning partner data:', responseData)
    console.log('✅ PARTNER API /me COMPLETED SUCCESSFULLY')
    return NextResponse.json(responseData)

  } catch (error) {
    console.error('❌ /partner/me error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
