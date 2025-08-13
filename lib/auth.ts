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

export async function createMagicLink(data: MagicLinkData): Promise<{ success: boolean; error?: string }> {
  try {
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Insert magic link record
    const { error: insertError } = await supabase
      .from('magic_links')
      .insert({
        email: data.email,
        token: token,
        type: data.type,
        expires_at: expiresAt.toISOString(),
        metadata: data.metadata || {}
      });

    if (insertError) {
      console.error('Error creating magic link:', insertError);
      return { success: false, error: 'Failed to create magic link' };
    }

    // Send magic link email
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003'}/api/auth/verify-magic-link?token=${token}`;
    
    const emailResult = await sendMagicLinkEmail(data.email, verificationUrl, data.type, data.metadata);

    if (!emailResult.success) {
      console.warn('Failed to send magic link email:', emailResult.error);
      // Still return success since the magic link was created in the database
      return { success: true, error: 'Magic link created but email not sent' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in createMagicLink:', error);
    return { success: false, error: 'Internal server error' };
  }
}

export async function verifyMagicLink(token: string): Promise<{ success: boolean; user?: any; error?: string }> {
  try {
    // Find magic link
    const { data: magicLink, error: findError } = await supabase
      .from('magic_links')
      .select('*')
      .eq('token', token)
      .eq('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (findError || !magicLink) {
      return { success: false, error: 'Invalid or expired magic link' };
    }

    // Mark magic link as used
    await supabase
      .from('magic_links')
      .update({ used_at: new Date().toISOString() })
      .eq('id', magicLink.id);

    const userType = magicLink.metadata?.user_type || 'individual';
    let userData: any = null;

    // Handle different user types
    if (userType === 'therapist') {
      // Check for existing therapist enrollment
      const { data: enrollment, error: enrollmentError } = await supabase
        .from('therapist_enrollments')
        .select('*')
        .eq('email', magicLink.email)
        .single();

      if (enrollmentError || !enrollment) {
        return { success: false, error: 'No therapist enrollment found for this email' };
      }

      // Check if user already exists
      const { data: existingUser, error: userCheckError } = await supabase
        .from('users')
        .select('*')
        .eq('email', magicLink.email)
        .single();

          if (existingUser) {
      // Update existing user to be a therapist if they're not already
      if (existingUser.user_type !== 'therapist') {
        const { data: updatedUser, error: updateUserError } = await supabase
          .from('users')
          .update({
            user_type: 'therapist',
            is_verified: true,
            is_active: true
          })
          .eq('email', magicLink.email)
          .select()
          .single();

        if (updateUserError) {
          console.error('Error updating user type:', updateUserError);
          return { success: false, error: 'Failed to update user account' };
        }

        userData = updatedUser;
      } else {
        userData = existingUser;
      }
    } else {
      // Create new user account for therapist
      const { data: newUser, error: createUserError } = await supabase
        .from('users')
        .insert({
          email: magicLink.email,
          full_name: enrollment.full_name,
          user_type: 'therapist',
          is_verified: true,
          is_active: true
          // No credits for therapists - they are service providers
        })
        .select()
        .single();

      if (createUserError) {
        console.error('Error creating therapist user:', createUserError);
        return { success: false, error: 'Failed to create user account' };
      }

      userData = newUser;
    }

      // Update enrollment status to approved
      const { error: updateError } = await supabase
        .from('therapist_enrollments')
        .update({ 
          status: 'approved',
          updated_at: new Date().toISOString()
        })
        .eq('id', enrollment.id);

      if (updateError) {
        console.error('Error updating enrollment status:', updateError);
        // Don't fail the verification if status update fails
      }

    } else {
      // Handle regular users (individual, partner, admin)
      // Check if user already exists
      const { data: existingUser, error: userCheckError } = await supabase
        .from('users')
        .select('*')
        .eq('email', magicLink.email)
        .single();

      if (existingUser) {
        // Update existing user to be verified
        const { data: updatedUser, error: updateUserError } = await supabase
          .from('users')
          .update({
            is_verified: true,
            is_active: true
          })
          .eq('email', magicLink.email)
          .select()
          .single();

        if (updateUserError) {
          console.error('Error updating user verification status:', updateUserError);
          return { success: false, error: 'Failed to update user account' };
        }

        userData = updatedUser;
      } else {
        // Create new user account (this is the first time they're being created)
        const { data: newUser, error: createUserError } = await supabase
          .from('users')
          .insert({
            email: magicLink.email,
            full_name: magicLink.metadata?.first_name || magicLink.email.split('@')[0],
            user_type: userType,
            is_verified: true,
            is_active: true,
            credits: 1, // Give new users 1 free credit
            package_type: 'Basic'
          })
          .select()
          .single();

        if (createUserError) {
          console.error('Error creating user:', createUserError);
          return { success: false, error: 'Failed to create user account' };
        }

        userData = newUser;
      }
    }

    // Create session
    const sessionToken = randomUUID();
    const sessionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const { error: sessionError } = await supabase
      .from('user_sessions')
      .insert({
        user_id: userData.id,
        session_token: sessionToken,
        expires_at: sessionExpiresAt.toISOString()
      });

    if (sessionError) {
      console.error('Error creating session:', sessionError);
      return { success: false, error: 'Failed to create session' };
    }

    return { 
      success: true, 
      user: {
        ...userData,
        session_token: sessionToken
      }
    };
  } catch (error) {
    console.error('Error in verifyMagicLink:', error);
    return { success: false, error: 'Internal server error' };
  }
}

export async function createSession(userId: string, userAgent?: string, ipAddress?: string): Promise<{ success: boolean; sessionToken?: string; error?: string }> {
  try {
    const sessionToken = randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const { error } = await supabase
      .from('user_sessions')
      .insert({
        user_id: userId,
        session_token: sessionToken,
        expires_at: expiresAt.toISOString(),
        user_agent: userAgent,
        ip_address: ipAddress
      });

    if (error) {
      console.error('Error creating session:', error);
      return { success: false, error: 'Failed to create session' };
    }

    return { success: true, sessionToken };
  } catch (error) {
    console.error('Error in createSession:', error);
    return { success: false, error: 'Internal server error' };
  }
}

export async function validateSession(sessionToken: string): Promise<{ success: boolean; user?: any; error?: string }> {
  try {
    const { data: session, error: sessionError } = await supabase
      .from('user_sessions')
      .select(`
        *,
        users (*)
      `)
      .eq('session_token', sessionToken)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (sessionError || !session) {
      return { success: false, error: 'Invalid or expired session' };
    }

    // Update last accessed
    await supabase
      .from('user_sessions')
      .update({ last_accessed_at: new Date().toISOString() })
      .eq('id', session.id);

    return { success: true, user: session.users };
  } catch (error) {
    console.error('Error in validateSession:', error);
    return { success: false, error: 'Internal server error' };
  }
}

export async function logoutSession(sessionToken: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('user_sessions')
      .delete()
      .eq('session_token', sessionToken);

    if (error) {
      console.error('Error logging out session:', error);
      return { success: false, error: 'Failed to logout' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in logoutSession:', error);
    return { success: false, error: 'Internal server error' };
  }
}

export function setAuthCookie(sessionToken: string, response: Response): void {
  // response.cookies.set('trpi_session', sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 // 30 days
  });
}

export function clearAuthCookie(response: Response): void {
  // response.cookies.delete('trpi_session');
}
