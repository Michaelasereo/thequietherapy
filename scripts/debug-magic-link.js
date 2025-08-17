require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugMagicLink() {
  console.log('🔍 Debugging Magic Link...\n');

  const testEmail = 'test-therapist@example.com';

  try {
    // Get the most recent magic link
    const { data: magicLinks, error } = await supabase
      .from('magic_links')
      .select('*')
      .eq('email', testEmail)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('❌ Error fetching magic links:', error);
      return;
    }

    if (!magicLinks || magicLinks.length === 0) {
      console.log('❌ No magic links found');
      return;
    }

    const magicLink = magicLinks[0];
    console.log('🔍 Magic Link Details:');
    console.log('  ID:', magicLink.id);
    console.log('  Token:', magicLink.token);
    console.log('  Type:', magicLink.type);
    console.log('  Email:', magicLink.email);
    console.log('  Created:', magicLink.created_at);
    console.log('  Expires:', magicLink.expires_at);
    console.log('  Used:', magicLink.used_at);
    console.log('  Metadata:', magicLink.metadata);

    // Check if it's expired
    const now = new Date();
    const expiresAt = new Date(magicLink.expires_at);
    console.log('\n⏰ Time Check:');
    console.log('  Now:', now.toISOString());
    console.log('  Expires:', expiresAt.toISOString());
    console.log('  Is Expired:', now > expiresAt);

    // Check if it's used
    console.log('  Is Used:', !!magicLink.used_at);

    // Try to find it with the same query as verifyMagicLink
    console.log('\n🔍 Testing verifyMagicLink query...');
    const { data: foundLink, error: findError } = await supabase
      .from('magic_links')
      .select('*')
      .eq('token', magicLink.token)
      .eq('used_at', null)
      .gt('expires_at', now.toISOString())
      .single();

    if (findError) {
      console.log('❌ Query failed:', findError.message);
    } else if (foundLink) {
      console.log('✅ Link found by verifyMagicLink query');
    } else {
      console.log('❌ Link not found by verifyMagicLink query');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugMagicLink();
