import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { sendMagicLinkEmail } from './email';
import { syncUserToSupabaseAuth, createUserWithSupabaseAuth } from './supabase-auth-sync';
import { RateLimiter } from './rate-limit';
import { AuditLogger } from './audit-logger';
import { authConfig } from './auth-config';

// Create Supabase client with lazy initialization for serverless
function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );
}

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

/**
 * Get magic link expiry based on user email domain
 * Healthcare workers get 15 minutes for security
 * Regular users get 24 hours for convenience
 */
function getMagicLinkExpiry(email: string): number {
  const healthcareDomains = ['@clinic.', '@hospital.', '@health.', '@medical.', '.med', '.health']
  const isHealthcareUser = healthcareDomains.some(domain => email.toLowerCase().includes(domain))
  
  if (isHealthcareUser) {
    console.log('🏥 Healthcare user detected, using 15-minute magic link expiry')
    return 15 * 60 * 1000 // 15 minutes for healthcare workers
  }
  
  console.log('👤 Regular user, using 24-hour magic link expiry')
  return 24 * 60 * 60 * 1000 // 24 hours for regular users
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
    const supabase = getSupabaseClient();
    
    // Rate limiting check - 10 magic links per hour per email
    const rateLimitAllowed = await RateLimiter.checkMagicLinkRequest(email)
    if (!rateLimitAllowed) {
      console.warn('⚠️ Rate limit exceeded for magic link request:', email)
      await AuditLogger.logRateLimitExceeded(email, 'magic_link_request', {
        email,
        authType,
        type
      })
      return { success: false, error: 'Too many requests. Please try again in an hour.' }
    }

    // Check if user exists - regardless of login or signup
    console.log('🔍 Checking if user exists with this email...')
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('id, email, user_type, is_verified, is_active')
      .eq('email', email)
      .single()

    if (userError && userError.code !== 'PGRST116') {
      console.error('❌ Error checking user existence:', userError)
      return { success: false, error: 'Error checking user account' }
    }

    // For LOGIN attempts
    if (type === 'login') {
      if (!existingUser) {
        console.log('❌ User not found for login attempt')
        return { 
          success: false, 
          error: 'User account not found. Please sign up first.',
          redirectTo: `/register?user_type=${authType}&error=account_not_found&email=${encodeURIComponent(email)}`
        }
      }

      // Verify user type matches
      if (existingUser.user_type !== authType) {
        console.log('❌ User type mismatch for login:', existingUser.user_type, 'vs', authType)
        
        return { 
          success: false, 
          error: `This email is registered with a different account type. Please use the correct login portal.`
        }
      }

      console.log('✅ User found and verified for login:', existingUser.email)
    }

    // For SIGNUP attempts - prevent duplicate emails (check both database and Supabase Auth)
    if (type === 'signup') {
      if (existingUser) {
        console.log('❌ Email already exists in database with user_type:', existingUser.user_type)
        
        return {
          success: false,
          error: `This email is already registered. Please login instead or use a different email.`,
          redirectTo: `/login?user_type=${authType}&error=account_exists&email=${encodeURIComponent(email)}`
        }
      }

      // Also check if user exists in Supabase Auth (even if not in database)
      const { checkUserExistsInSupabaseAuth } = await import('./supabase-auth-sync')
      const authCheck = await checkUserExistsInSupabaseAuth(email)
      
      if (authCheck.exists) {
        console.log('❌ Email already exists in Supabase Auth - user should login instead')
        
        return {
          success: false,
          error: `This email is already registered. Please use the login link instead.`,
          redirectTo: `/login?user_type=${authType}&error=account_exists&email=${encodeURIComponent(email)}`
        }
      }
      
      console.log('✅ Email available for new signup')
    }

    const token = randomUUID()
    const expiryDuration = getMagicLinkExpiry(email)
    const expiresAt = new Date(Date.now() + expiryDuration)

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

    // Send the magic link email using centralized config
    const verificationUrl = `${authConfig.appUrl}/api/auth/verify-magic-link?token=${token}&auth_type=${authType}`
    
    console.log('📧 Sending magic link email...')
    const emailResult = await sendMagicLinkEmail(email, verificationUrl, type, { ...metadata, auth_type: authType })
    
    if (!emailResult.success) {
      console.error('❌ Failed to send magic link email:', emailResult.error)
      // Don't fail the entire request if email fails, just log it
      console.log('⚠️ Magic link created but email failed to send. Token:', token.substring(0, 8) + '...')
    } else {
      console.log('✅ Magic link email sent successfully')
      
      // Audit log: Magic link sent (non-blocking - fire and forget)
      AuditLogger.logMagicLinkSent(email, {
        email,
        authType,
        type,
        expiryDuration: expiryDuration / 1000 / 60, // minutes
        expiresAt: expiresAt.toISOString()
      }).catch(err => {
        console.error('⚠️ Audit logging failed (non-critical):', err)
      })
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
    const supabase = getSupabaseClient();
    // Rate limiting check - 3 attempts per token
    const rateLimitAllowed = await RateLimiter.checkMagicLinkVerification(token)
    if (!rateLimitAllowed) {
      console.warn('⚠️ Rate limit exceeded for magic link verification')
      await AuditLogger.logRateLimitExceeded(token, 'magic_link_verify', {
        token: token.substring(0, 8) + '...',
        authType
      })
      return { success: false, error: 'Too many verification attempts. Please request a new magic link.' }
    }

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
      await AuditLogger.logMagicLinkVerification(null, false, {
        token: token.substring(0, 8) + '...',
        authType,
        error_message: 'Database lookup error'
      })
      return { success: false, error: 'Invalid or expired magic link' }
    }

    if (!magicLink) {
      console.log('❌ Magic link not found or already used')
      await AuditLogger.logMagicLinkVerification(null, false, {
        token: token.substring(0, 8) + '...',
        authType,
        error_message: 'Magic link not found or already used'
      })
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
      return { success: false, error: 'Magic link has expired. Please request a new one.' }
    }

    // Mark magic link as used with atomic update to prevent race condition
    // This ensures only ONE request can mark it as used
    const { data: updatedLink, error: updateError } = await supabase
      .from('magic_links')
      .update({ 
        used_at: now.toISOString(),
        updated_at: now.toISOString()
      })
      .eq('id', magicLink.id)
      .is('used_at', null) // Critical: Only update if still unused
      .select()
      .single()

    if (updateError || !updatedLink) {
      console.error('❌ Magic link already used or update failed:', updateError)
      return { success: false, error: 'Magic link already used or expired. Please request a new one.' }
    }
    
    console.log('✅ Magic link marked as used atomically')

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

    // Handle user existence based on magic link type
    if (!user && magicLink.type === 'signup') {
      // Before creating, double-check user doesn't exist in Supabase Auth
      // (they shouldn't get here due to the check in createMagicLinkForAuthType, but just in case)
      const { checkUserExistsInSupabaseAuth } = await import('./supabase-auth-sync')
      const authCheck = await checkUserExistsInSupabaseAuth(magicLink.email)
      
      if (authCheck.exists && authCheck.user) {
        console.log('⚠️ User exists in Supabase Auth - they should login instead')
        return {
          success: false,
          error: 'This email is already registered. Please use the login link instead.',
          redirectTo: `/login?user_type=${authType}&error=account_exists&email=${encodeURIComponent(magicLink.email)}`
        }
      }

      // Create new user for signup
      console.log('👤 Creating new user with Supabase Auth sync...')
      
      const createResult = await createUserWithSupabaseAuth({
        email: magicLink.email,
        full_name: magicLink.metadata?.fullName || magicLink.metadata?.first_name || magicLink.email.split('@')[0],
        user_type: authType
      })

      if (!createResult.success) {
        console.error('❌ Error creating user with Supabase Auth sync:', createResult.error)
        return { success: false, error: 'Error creating user account' }
      }

      // Get the created user from database
      const { data: newUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', createResult.user_id)
        .single()

      if (fetchError || !newUser) {
        console.error('❌ Error fetching newly created user:', fetchError)
        return { success: false, error: 'Error accessing new user account' }
      }

      finalUser = newUser
      console.log('✅ New user created with Supabase Auth sync:', finalUser.id)
    } else if (!user && magicLink.type === 'login') {
      // User doesn't exist for login - redirect to signup
      console.log('❌ User not found for login')
      return { 
        success: false, 
        error: 'User account not found. Please sign up first.',
        redirectTo: `/register?user_type=${authType}&error=account_not_found&email=${encodeURIComponent(magicLink.email)}`
      }
    } else if (user && magicLink.type === 'login') {
      // User exists for login - verify user type
      console.log('✅ Existing user found for login:', user.email)
      if (user.user_type !== authType) {
        console.log('❌ User type mismatch:', user.user_type, 'vs', authType)
        return { 
          success: false, 
          error: `This email is registered with a different account type. Please use the correct login portal.`
        }
      }
    } else if (user && magicLink.type === 'signup') {
      // User already exists - prevent duplicate signup
      console.log('❌ User already exists, cannot signup again')
      return {
        success: false,
        error: `This email is already registered. Please login instead or use a different email.`
      }
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

    // Update user's last login and mark as verified
    await supabase
      .from('users')
      .update({ 
        last_login_at: now.toISOString(),
        is_verified: true  // Mark user as verified after successful magic link verification
      })
      .eq('id', finalUser.id)

    // Audit log: Successful magic link verification
    await AuditLogger.logMagicLinkVerification(finalUser.id, true, {
      email: finalUser.email,
      authType,
      magicLinkType: magicLink.type
    })

    // Audit log: Login success
    await AuditLogger.logLoginSuccess(finalUser.id, {
      email: finalUser.email,
      authType,
      loginMethod: 'magic_link'
    })

    return {
      success: true,
      user: {
        ...finalUser,
        is_verified: true,  // Ensure the returned user object reflects verified status
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

