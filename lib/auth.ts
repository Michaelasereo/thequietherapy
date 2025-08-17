import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { sendMagicLinkEmail } from './email';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface MagicLinkData {
  email: string;
  type: 'booking' | 'login' | 'signup';
  auth_type?: 'individual' | 'therapist' | 'partner' | 'admin';
  metadata?: {
    first_name?: string;
    user_type?: string;
    [key: string]: any;
  };
}

export interface SessionData {
  user_id: string;
  session_token: string;
  expires_at: Date;
  user_agent?: string;
  ip_address?: string;
}

// New function to create magic link for specific auth type
export async function createMagicLinkForAuthType(
  email: string, 
  authType: 'individual' | 'therapist' | 'partner' | 'admin',
  type: 'login' | 'signup' = 'login',
  metadata?: any
) {
  console.log('🔑 createMagicLinkForAuthType called:', { email, authType, type, metadata })
  
  try {
    const token = randomUUID()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours (for testing)

    console.log('✅ Token created:', { 
      token: token.substring(0, 8) + '...', 
      expiresAt: expiresAt.toISOString(),
      now: new Date().toISOString(),
      expiresAtLocal: expiresAt.toLocaleString(),
      nowLocal: new Date().toLocaleString()
    })

    const { error } = await supabase
      .from('magic_links')
      .insert({
        email,
        token,
        type,
        auth_type: authType,
        expires_at: expiresAt.toISOString(),
        metadata: { ...metadata, auth_type: authType }
      })

    if (error) {
      console.error('❌ Error creating magic link:', error)
      throw error
    }

    console.log('✅ Magic link created successfully for auth type:', authType)

    // Send the magic link email
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/verify-magic-link?token=${token}&auth_type=${authType}`
    
    console.log('📧 Sending magic link email...')
    const emailResult = await sendMagicLinkEmail(email, verificationUrl, type, { ...metadata, auth_type: authType })
    
    if (!emailResult.success) {
      console.error('❌ Failed to send magic link email:', emailResult.error)
      // Don't fail the entire request if email fails, just log it
      console.log('⚠️ Magic link created but email failed to send. Token:', token.substring(0, 8) + '...')
    } else {
      console.log('✅ Magic link email sent successfully')
    }

    return { success: true, token }
  } catch (error) {
    console.error('❌ createMagicLinkForAuthType error:', error)
    return { success: false, error: 'Failed to create magic link' }
  }
}

// Updated verifyMagicLink to handle auth type
export async function verifyMagicLinkForAuthType(token: string, authType: 'individual' | 'therapist' | 'partner' | 'admin') {
  console.log('🔍 verifyMagicLinkForAuthType called with token:', token.substring(0, 8) + '...', 'authType:', authType)
  console.log('📅 Timestamp:', new Date().toISOString())
  
  try {
    // Find the magic link
    console.log('🔍 Looking up magic link in database...')
    const { data: magicLink, error: magicLinkError } = await supabase
      .from('magic_links')
      .select('*')
      .eq('token', token)
      .eq('auth_type', authType)
      .is('used_at', null)
      .single()

    if (magicLinkError) {
      console.error('❌ Magic link lookup error:', magicLinkError)
      return { success: false, error: 'Invalid or expired magic link' }
    }

    if (!magicLink) {
      console.log('❌ Magic link not found or already used')
      return { success: false, error: 'Invalid or expired magic link' }
    }

    console.log('✅ Magic link found:', {
      id: magicLink.id,
      email: magicLink.email,
      type: magicLink.type,
      auth_type: magicLink.auth_type,
      expiresAt: magicLink.expires_at,
      metadata: magicLink.metadata
    })

    // Check if expired
    const now = new Date()
    const expiresAt = new Date(magicLink.expires_at)
    const timeDiffMs = expiresAt.getTime() - now.getTime()
    const timeDiffMinutes = timeDiffMs / (1000 * 60)
    
    console.log('🔍 Expiration check:', {
      now: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      nowLocal: now.toLocaleString(),
      expiresAtLocal: expiresAt.toLocaleString(),
      timeDiffMs,
      timeDiffMinutes,
      isExpired: timeDiffMs < 0
    })
    
    if (timeDiffMs < 0) {
      console.log('❌ Magic link expired')
      return { success: false, error: 'Magic link has expired' }
    }

    // Mark as used
    console.log('✅ Marking magic link as used...')
    const { error: updateError } = await supabase
      .from('magic_links')
      .update({ used_at: new Date().toISOString() })
      .eq('id', magicLink.id)

    if (updateError) {
      console.error('❌ Error marking magic link as used:', updateError)
      return { success: false, error: 'Failed to process magic link' }
    }

    console.log('✅ Magic link marked as used')

    // Get user data
    console.log('🔍 Fetching user data...')
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', magicLink.email)
      .single()

    if (userError) {
      console.error('❌ User lookup error:', userError)
      return { success: false, error: 'User not found' }
    }

    if (!userData) {
      console.log('❌ User not found in users table')
      return { success: false, error: 'User not found' }
    }

    console.log('✅ User found:', {
      id: userData.id,
      email: userData.email,
      user_type: userData.user_type,
      is_verified: userData.is_verified
    })

    // Handle partner signup verification
    if (magicLink.type === 'signup' && magicLink.auth_type === 'partner') {
      console.log('🔍 Partner signup verification - marking user as verified')
      const { error: verifyError } = await supabase
        .from('users')
        .update({ 
          is_verified: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', userData.id)

      if (verifyError) {
        console.error('❌ Error marking partner as verified:', verifyError)
        return { success: false, error: 'Failed to verify partner account' }
      }

      console.log('✅ Partner marked as verified')
      userData.is_verified = true
    }

    // Allow cross-role access - user can access any role they're enrolled for
    // Only check if user is verified
    if (!userData.is_verified) {
      console.log('❌ User is not verified')
      return { success: false, error: 'Please verify your email before accessing the platform.' }
    }

    // Create simple session token (no database table needed)
    console.log('🔑 Creating simple session for auth type:', authType)
    const sessionToken = randomUUID()
    const sessionExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    console.log('✅ Session token created:', {
      sessionToken: sessionToken.substring(0, 8) + '...',
      expiresAt: sessionExpiresAt.toISOString(),
      authType
    })

    // Update user's last login
    console.log('✅ Updating user last login...')
    const { error: updateUserError } = await supabase
      .from('users')
      .update({
        last_login_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', userData.id)

    if (updateUserError) {
      console.error('❌ Error updating user last login:', updateUserError)
      // Don't fail the whole process for this
    }

    console.log('✅ User last login updated')

    // Return user data with session token
    const userWithSession = {
      ...userData,
      session_token: sessionToken,
      auth_type: authType
    }

    console.log('✅ Magic link verification successful:', {
      userId: userData.id,
      authType,
      email: userData.email
    })

    return { success: true, user: userWithSession }

  } catch (error) {
    console.error('❌ verifyMagicLinkForAuthType error:', error)
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return { success: false, error: 'Internal server error' }
  }
}

// New function to validate session for specific auth type
export async function validateSessionForAuthType(
  sessionToken: string, 
  authType: 'individual' | 'therapist' | 'partner' | 'admin'
): Promise<{ success: boolean; user?: any; error?: string }> {
  try {
    // Simple validation - just check if token exists and is valid format
    if (!sessionToken || sessionToken.length < 10) {
      return { success: false, error: 'Invalid session token' }
    }

    // For now, return success (you can add more validation later)
    return { success: true, user: { auth_type: authType } }
  } catch (error) {
    console.error('Error in validateSessionForAuthType:', error)
    return { success: false, error: 'Internal server error' }
  }
}

// New function to create session for specific auth type
export async function createSessionForAuthType(
  userId: string, 
  authType: 'individual' | 'therapist' | 'partner' | 'admin',
  userAgent?: string, 
  ipAddress?: string
): Promise<{ success: boolean; sessionToken?: string; error?: string }> {
  try {
    const sessionToken = randomUUID()
    console.log('✅ Simple session created for auth type:', authType)
    return { success: true, sessionToken }
  } catch (error) {
    console.error('Error in createSessionForAuthType:', error)
    return { success: false, error: 'Internal server error' }
  }
}

// New function to logout from specific auth type
export async function logoutFromAuthType(
  sessionToken: string, 
  authType: 'individual' | 'therapist' | 'partner' | 'admin'
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('✅ Simple logout for auth type:', authType)
    return { success: true }
  } catch (error) {
    console.error('Error in logoutFromAuthType:', error)
    return { success: false, error: 'Internal server error' }
  }
}

// Legacy functions for backward compatibility
export async function createMagicLink(email: string, type: 'login' | 'signup' | 'booking', metadata?: any) {
  const authType = type === 'booking' ? 'login' : type
  return createMagicLinkForAuthType(email, 'individual', authType, metadata)
}

export async function verifyMagicLink(token: string) {
  return verifyMagicLinkForAuthType(token, 'individual')
}

export async function createSession(userId: string, userAgent?: string, ipAddress?: string): Promise<{ success: boolean; sessionToken?: string; error?: string }> {
  return createSessionForAuthType(userId, 'individual', userAgent, ipAddress)
}

export async function validateSession(sessionToken: string): Promise<{ success: boolean; user?: any; error?: string }> {
  return validateSessionForAuthType(sessionToken, 'individual')
}

export async function logoutSession(sessionToken: string): Promise<{ success: boolean; error?: string }> {
  return logoutFromAuthType(sessionToken, 'individual')
}

export function setAuthCookie(sessionToken: string, response: Response): void {
  // TODO: Implement cookie setting when Next.js 15 cookies API is stable
  // response.cookies.set('trpi_session', sessionToken, {
  //   httpOnly: true,
  //   secure: process.env.NODE_ENV === 'production',
  //   sameSite: 'lax',
  //   maxAge: 30 * 24 * 60 * 60 // 30 days
  // });
}

export function clearAuthCookie(response: Response): void {
  // TODO: Implement cookie clearing when Next.js 15 cookies API is stable
}

