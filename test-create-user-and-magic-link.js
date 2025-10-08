const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  'https://frzciymslvpohhyefmtr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyemNpeW1zbHZwb2hoeWVmbXRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDcwODQ4MiwiZXhwIjoyMDcwMjg0NDgyfQ.RTCdw-tk6pe0k-QpO0jngK64gEJOM2KU3sHS435myxM'
);

async function createUserAndTestMagicLink() {
  console.log('🧪 Creating User and Testing Magic Link...\n');
  
  const testEmail = 'test@example.com';
  
  try {
    // Step 1: Create test user
    console.log('1️⃣ Creating test user...');
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        email: testEmail,
        full_name: 'Test User',
        user_type: 'individual',
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
    
    console.log('✅ Test user created:', newUser.email);
    
    // Step 2: Test magic link creation
    console.log('\n2️⃣ Testing magic link creation...');
    
    const response = await fetch('http://localhost:3000/api/auth/magic-link', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testEmail,
        user_type: 'individual'
      })
    });
    
    const result = await response.json();
    console.log('Magic link response:', result);
    
    if (result.success) {
      console.log('✅ Magic link created successfully!');
      
      // Step 3: Check magic link in database
      console.log('\n3️⃣ Checking magic link in database...');
      const { data: magicLinks, error: magicLinkError } = await supabase
        .from('magic_links')
        .select('*')
        .eq('email', testEmail)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (magicLinkError) {
        console.error('❌ Error fetching magic links:', magicLinkError);
      } else if (magicLinks && magicLinks.length > 0) {
        const magicLink = magicLinks[0];
        console.log('✅ Magic link found in database:');
        console.log('  - Token:', magicLink.token.substring(0, 8) + '...');
        console.log('  - Type:', magicLink.type);
        console.log('  - Auth Type:', magicLink.auth_type);
        console.log('  - Expires:', magicLink.expires_at);
        console.log('  - Used:', magicLink.used_at);
        
        // Step 4: Test magic link verification
        console.log('\n4️⃣ Testing magic link verification...');
        const verifyResponse = await fetch(`http://localhost:3000/api/auth/verify-magic-link?token=${magicLink.token}&auth_type=individual`);
        const verifyResult = await verifyResponse.json();
        console.log('Verification response:', verifyResult);
        
        if (verifyResult.success) {
          console.log('✅ Magic link verification successful!');
          console.log('User:', verifyResult.user.email);
        } else {
          console.log('❌ Magic link verification failed:', verifyResult.error);
        }
      } else {
        console.log('❌ No magic links found in database');
      }
    } else {
      console.log('❌ Magic link creation failed:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
createUserAndTestMagicLink();
