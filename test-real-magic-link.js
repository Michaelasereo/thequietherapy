const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  'https://frzciymslvpohhyefmtr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyemNpeW1zbHZwb2hoeWVmbXRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDcwODQ4MiwiZXhwIjoyMDcwMjg0NDgyfQ.RTCdw-tk6pe0k-QpO0jngK64gEJOM2KU3sHS435myxM'
);

async function testRealMagicLink() {
  console.log('🧪 Testing Real Magic Link...\n');
  
  try {
    // Get the latest magic link from database
    const { data: magicLinks, error: magicLinkError } = await supabase
      .from('magic_links')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (magicLinkError) {
      console.error('❌ Error fetching magic links:', magicLinkError);
      return;
    }
    
    if (!magicLinks || magicLinks.length === 0) {
      console.log('❌ No magic links found in database');
      return;
    }
    
    const magicLink = magicLinks[0];
    console.log('✅ Found magic link:');
    console.log('  - Email:', magicLink.email);
    console.log('  - Token:', magicLink.token.substring(0, 8) + '...');
    console.log('  - Type:', magicLink.type);
    console.log('  - Auth Type:', magicLink.auth_type);
    console.log('  - Expires:', magicLink.expires_at);
    console.log('  - Used:', magicLink.used_at);
    
    // Test magic link verification using POST endpoint
    console.log('\n🔍 Testing magic link verification...');
    const response = await fetch('http://localhost:3001/api/auth/verify-magic-link', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: magicLink.token,
        userType: magicLink.auth_type
      })
    });
    
    const result = await response.json();
    console.log('Verification response:', result);
    
    if (result.success) {
      console.log('✅ Magic link verification successful!');
      console.log('User:', result.user);
    } else {
      console.log('❌ Magic link verification failed:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testRealMagicLink();
