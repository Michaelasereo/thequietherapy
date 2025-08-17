require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function debugTherapistLogin() {
  console.log('🔍 Debugging therapist login flow...');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const testEmail = 'test-therapist@example.com';

  try {
    // 1. Check if therapist exists
    console.log('\n1. Checking if therapist exists...');
    const { data: therapist, error: therapistError } = await supabase
      .from('therapist_enrollments')
      .select('*')
      .eq('email', testEmail)
      .single();

    if (therapistError) {
      console.error('❌ Therapist error:', therapistError);
    } else {
      console.log('✅ Therapist found:', therapist);
    }

    // 2. Check if user exists
    console.log('\n2. Checking if user exists...');
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', testEmail)
      .single();

    if (userError) {
      console.error('❌ User error:', userError);
    } else {
      console.log('✅ User found:', user);
    }

    // 3. Check magic_links table structure
    console.log('\n3. Checking magic_links table...');
    const { data: magicLinks, error: magicError } = await supabase
      .from('magic_links')
      .select('*')
      .eq('email', testEmail)
      .order('created_at', { ascending: false })
      .limit(5);

    if (magicError) {
      console.error('❌ Magic links error:', magicError);
    } else {
      console.log('✅ Magic links found:', magicLinks.length);
      magicLinks.forEach((link, index) => {
        console.log(`   ${index + 1}. ${link.token} (${link.type}) - ${link.created_at}`);
      });
    }

    // 4. Try to create a magic link manually
    console.log('\n4. Testing magic link creation...');
    const { randomUUID } = require('crypto');
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const { data: newMagicLink, error: createError } = await supabase
      .from('magic_links')
      .insert({
        email: testEmail,
        token,
        type: 'login',
        expires_at: expiresAt.toISOString(),
        metadata: {
          user_type: 'therapist',
          therapist_id: therapist?.id
        }
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ Magic link creation error:', createError);
    } else {
      console.log('✅ Magic link created successfully:', newMagicLink);
    }

  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

debugTherapistLogin();
