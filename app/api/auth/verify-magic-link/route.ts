import { NextRequest, NextResponse } from 'next/server'
import { verifyMagicLink } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(new URL('/login?error=missing-token', request.url))
  }

  try {
    const result = await verifyMagicLink(token)
    
    if (result.success && result.user) {
      // Determine redirect based on user type
      let redirectUrl = '/dashboard'
      
      if (result.user.user_type === 'therapist') {
        redirectUrl = '/therapist/dashboard'
      } else if (result.user.user_type === 'partner') {
        redirectUrl = '/partner/dashboard'
      } else if (result.user.user_type === 'admin') {
        redirectUrl = '/admin/dashboard'
      }

      // Set appropriate session cookie based on user type
      const response = NextResponse.redirect(new URL(redirectUrl, request.url))
      
      if (result.user.user_type === 'therapist') {
        response.cookies.set("trpi_therapist_user", JSON.stringify({
          id: result.user.id,
          name: result.user.full_name || result.user.email.split('@')[0],
          email: result.user.email,
          role: "therapist",
          session_token: result.user.session_token
        }), {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          maxAge: 60 * 60 * 24 * 7, // 1 week
          path: "/",
        })
      } else if (result.user.user_type === 'partner') {
        response.cookies.set("trpi_partner_user", JSON.stringify({
          id: result.user.id,
          name: result.user.full_name || result.user.email.split('@')[0],
          email: result.user.email,
          role: "partner",
          organization_name: result.user.organization_name,
          session_token: result.user.session_token
        }), {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          maxAge: 60 * 60 * 24 * 7, // 1 week
          path: "/",
        })
      } else {
        // Regular user
        response.cookies.set("trpi_user", JSON.stringify({
          id: result.user.id,
          name: result.user.full_name || result.user.email.split('@')[0],
          email: result.user.email,
          session_token: result.user.session_token
        }), {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          maxAge: 60 * 60 * 24 * 7, // 1 week
          path: "/",
        })
      }

      return response
    } else {
      return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(result.error || 'invalid-token')}`, request.url))
    }
  } catch (error) {
    console.error('Error verifying magic link:', error)
    return NextResponse.redirect(new URL('/login?error=verification-failed', request.url))
  }
}
