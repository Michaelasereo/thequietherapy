import { readSessionCookie, clearSessionCookie } from './cookies';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export type Session = {
  token: string;
  userId: string;
  email: string;
  userType: 'individual' | 'therapist' | 'partner' | 'admin';
  expiresAt: Date;
};

export async function getSession(): Promise<Session | null> {
  const token = await readSessionCookie();
  if (!token) return null;

  try {
    // Query the user_sessions table with user data
    const { data: sessionData, error } = await supabase
      .from('user_sessions')
      .select(`
        session_token,
        expires_at,
        users!inner (
          id,
          email,
          user_type
        )
      `)
      .eq('session_token', token)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !sessionData) {
      await clearSessionCookie();
      return null;
    }

    // Access the users object properly - it should be a single object, not an array
    const user = sessionData.users as any;
    
    return {
      token: sessionData.session_token,
      userId: user.id,
      email: user.email,
      userType: user.user_type as 'individual' | 'therapist' | 'partner' | 'admin',
      expiresAt: new Date(sessionData.expires_at),
    };
  } catch (error) {
    console.error('Session validation error:', error);
    await clearSessionCookie();
    return null;
  }
}

export async function createSession(userId: string, email: string, userType: string): Promise<string> {
  const { randomUUID } = await import('crypto');
  const sessionToken = randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const { error } = await supabase
    .from('user_sessions')
    .insert({
      user_id: userId,
      session_token: sessionToken,
      expires_at: expiresAt.toISOString(),
    });

  if (error) {
    throw new Error('Failed to create session');
  }

  return sessionToken;
}

export async function deleteSession(token: string): Promise<void> {
  await supabase
    .from('user_sessions')
    .delete()
    .eq('session_token', token);
}
