const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  'https://frzciymslvpohhyefmtr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyemNpeW1zbHZwb2hoeWVmbXRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDcwODQ4MiwiZXhwIjoyMDcwMjg0NDgyfQ.RTCdw-tk6pe0k-QpO0jngK64gEJOM2KU3sHS435myxM'
);

async function testFreshMagicLink() {
  console.log('🧪 Testing Fresh Magic Link...\n');
  
  const testEmail = 'fresh-test@example.com';
  const userType = 'individual';
  
  try {
    // Step 1: Create fresh user
    console.log('1️⃣ Creating fresh test user...');
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        email: testEmail,
        full_name: 'Fresh Test User',
        user_type: userType,
        is_verified: false,
        is_active: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (createError) {
      console.error('❌ Error creating user:', createError);
      return;
    }
    
    console.log('✅ Fresh user created:', newUser.email);
    
    // Step 2: Create fresh magic link
    console.log('\n2️⃣ Creating fresh magic link...');
    const magicLinkResponse = await fetch('http://localhost:3001/api/auth/magic-link', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testEmail,
        user_type: userType
      })
    });
    
    const magicLinkResult = await magicLinkResponse.json();
    console.log('Magic link creation result:', magicLinkResult);
    
    if (!magicLinkResult.success) {
      console.log('❌ Magic link creation failed:', magicLinkResult.error);
      return;
    }
    
    console.log('✅ Magic link created successfully!');
    
    // Step 3: Get the fresh magic link from database
    console.log('\n3️⃣ Getting fresh magic link from database...');
    const { data: magicLinks, error: magicLinkError } = await supabase
      .from('magic_links')
      .select('*')
      .eq('email', testEmail)
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
    console.log('✅ Fresh magic link found:');
    console.log('  - Email:', magicLink.email);
    console.log('  - Token:', magicLink.token.substring(0, 8) + '...');
    console.log('  - Type:', magicLink.type);
    console.log('  - Auth Type:', magicLink.auth_type);
    console.log('  - Expires:', magicLink.expires_at);
    console.log('  - Used:', magicLink.used_at);
    
    // Step 4: Test magic link verification immediately
    console.log('\n4️⃣ Testing magic link verification...');
    const verifyResponse = await fetch('http://localhost:3001/api/auth/verify-magic-link', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: magicLink.token,
        userType: magicLink.auth_type
      })
    });
    
    const verifyResult = await verifyResponse.json();
    console.log('Verification response:', verifyResult);
    
    if (verifyResult.success) {
      console.log('✅ Magic link verification successful!');
      console.log('User:', verifyResult.user);
    } else {
      console.log('❌ Magic link verification failed:', verifyResult.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testFreshMagicLink();
