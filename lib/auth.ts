import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { sendMagicLinkEmail } from './email';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
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

// Unified function to create magic link for any auth type
export async function createMagicLinkForAuthType(
  email: string, 
  authType: 'individual' | 'therapist' | 'partner' | 'admin',
  type: 'login' | 'signup' = 'login',
  metadata?: any
) {
  console.log('🔑 createMagicLinkForAuthType called:', { email, authType, type, metadata })
  
  try {
    const token = randomUUID()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    console.log('✅ Token created:', { 
      token: token.substring(0, 8) + '...', 
      expiresAt: expiresAt.toISOString(),
      now: new Date().toISOString()
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
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const verificationUrl = `${baseUrl}/api/auth/verify-magic-link?token=${token}&auth_type=${authType}`
    
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

// Unified function to verify magic link for any auth type
export async function verifyMagicLinkForAuthType(token: string, authType: 'individual' | 'therapist' | 'partner' | 'admin') {
  console.log('🔍 verifyMagicLinkForAuthType called with token:', token.substring(0, 8) + '...', 'authType:', authType)
  
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
      expiresAt: magicLink.expires_at
    })

    // Check if expired
    const now = new Date()
    const expiresAt = new Date(magicLink.expires_at)
    
    if (expiresAt < now) {
      console.log('❌ Magic link expired')
      return { success: false, error: 'Magic link has expired' }
    }

    // Mark magic link as used
    const { error: updateError } = await supabase
      .from('magic_links')
      .update({ used_at: now.toISOString() })
      .eq('id', magicLink.id)

    if (updateError) {
      console.error('❌ Error marking magic link as used:', updateError)
      // Don't fail the verification if this fails
    }

    // Get or create user
    console.log('🔍 Getting or creating user...')
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', magicLink.email)
      .single()

    if (userError && userError.code !== 'PGRST116') {
      console.error('❌ Error getting user:', userError)
      return { success: false, error: 'Error accessing user account' }
    }

    let finalUser = user

    // If user doesn't exist and this is a signup, create them
    if (!user && magicLink.type === 'signup') {
      console.log('👤 Creating new user...')
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          email: magicLink.email,
          full_name: magicLink.metadata?.first_name || magicLink.email.split('@')[0],
          user_type: authType,
          is_verified: true,
          is_active: true,
          credits: 0,
          package_type: 'free'
        })
        .select()
        .single()

      if (createError) {
        console.error('❌ Error creating user:', createError)
        return { success: false, error: 'Error creating user account' }
      }

      finalUser = newUser
      console.log('✅ New user created:', finalUser.id)
    } else if (!user) {
      console.log('❌ User not found and not a signup')
      return { success: false, error: 'User account not found' }
    }

    // Create session token and store in database
    console.log('🔑 Creating session token and storing in database...')
    const sessionToken = randomUUID()
    const sessionExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    // Clear any existing sessions for this user
    await supabase
      .from('user_sessions')
      .delete()
      .eq('user_id', finalUser.id)

    // Create new session in database
    const { error: sessionError } = await supabase
      .from('user_sessions')
      .insert({
        user_id: finalUser.id,
        session_token: sessionToken,
        expires_at: sessionExpiresAt.toISOString(),
        created_at: now.toISOString(),
        last_accessed_at: now.toISOString()
      })

    if (sessionError) {
      console.error('❌ Error creating session:', sessionError)
      return { success: false, error: 'Error creating session' }
    }

    console.log('✅ Session created and stored in database')

    // Update user's last login
    await supabase
      .from('users')
      .update({ last_login_at: now.toISOString() })
      .eq('id', finalUser.id)

    return {
      success: true,
      user: {
        ...finalUser,
        session_token: sessionToken
      }
    }

  } catch (error) {
    console.error('❌ verifyMagicLinkForAuthType error:', error)
    return { success: false, error: 'Internal server error' }
  }
}

// Legacy functions for backward compatibility
export async function createMagicLink(email: string, type: 'login' | 'signup', metadata?: any) {
  return createMagicLinkForAuthType(email, 'individual', type, metadata)
}

export async function verifyMagicLink(token: string) {
  return verifyMagicLinkForAuthType(token, 'individual')
}

