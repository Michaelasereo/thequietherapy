import { randomUUID } from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function appBaseUrl() {
  // NEXT_PUBLIC_APP_URL must be set to https://yourdomain.com in prod
  // and http://localhost:3000 locally
  const base = process.env.NEXT_PUBLIC_APP_URL;
  if (!base) throw new Error('NEXT_PUBLIC_APP_URL missing');
  return base.replace(/\/+$/, '');
}

export async function createMagicLink(email: string, userType: 'individual' | 'therapist' | 'partner' | 'admin' = 'individual') {
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min

  try {
    // Clean up previous unused magic links for this email
    await supabase
      .from('magic_links')
      .delete()
      .eq('email', email)
      .is('used_at', null);

    // Create new magic link
    const { error } = await supabase
      .from('magic_links')
      .insert({
        email,
        token,
        type: 'login',
        auth_type: userType,
        expires_at: expiresAt.toISOString(),
        metadata: { user_type: userType }
      });

    if (error) {
      console.error('Failed to create magic link:', error);
      throw new Error('Failed to create magic link');
    }

    const url = new URL('/api/auth/callback', appBaseUrl());
    url.searchParams.set('token', token);
    url.searchParams.set('userType', userType);
    
    return url.toString();
  } catch (error) {
    console.error('Magic link creation error:', error);
    throw error;
  }
}

export async function validateMagicLink(token: string): Promise<{
  email: string;
  userType: string;
  isValid: boolean;
}> {
  try {
    const { data: link, error } = await supabase
      .from('magic_links')
      .select('*')
      .eq('token', token)
      .single();

    if (error || !link) {
      return { email: '', userType: '', isValid: false };
    }

    const isExpired = new Date(link.expires_at) < new Date();
    const isUsed = link.used_at !== null;

    if (isExpired || isUsed) {
      return { email: '', userType: '', isValid: false };
    }

    return {
      email: link.email,
      userType: link.auth_type || 'individual',
      isValid: true
    };
  } catch (error) {
    console.error('Magic link validation error:', error);
    return { email: '', userType: '', isValid: false };
  }
}

export async function markMagicLinkUsed(token: string): Promise<void> {
  await supabase
    .from('magic_links')
    .update({ used_at: new Date().toISOString() })
    .eq('token', token);
}
