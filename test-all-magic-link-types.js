const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  'https://frzciymslvpohhyefmtr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyemNpeW1zbHZwb2hoeWVmbXRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDcwODQ4MiwiZXhwIjoyMDcwMjg0NDgyfQ.RTCdw-tk6pe0k-QpO0jngK64gEJOM2KU3sHS435myxM'
);

async function testAllMagicLinkTypes() {
  console.log('🧪 Testing Magic Links for All User Types...\n');
  
  const userTypes = ['individual', 'therapist', 'partner', 'admin'];
  const baseEmail = 'test';
  
  for (const userType of userTypes) {
    const email = `${baseEmail}-${userType}@example.com`;
    console.log(`\n🔍 Testing ${userType} user: ${email}`);
    
    try {
      // Step 1: Check if user exists
      const { data: existingUser, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
      
      if (userError && userError.code !== 'PGRST116') {
        console.error(`❌ Error checking ${userType} user:`, userError);
        continue;
      }
      
      let user = existingUser;
      
      // Create user if doesn't exist
      if (!user) {
        console.log(`📝 Creating ${userType} user...`);
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            email: email,
            full_name: `Test ${userType.charAt(0).toUpperCase() + userType.slice(1)}`,
            user_type: userType,
            is_verified: false,
            is_active: true,
            created_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (createError) {
          console.error(`❌ Error creating ${userType} user:`, createError);
          continue;
        }
        
        user = newUser;
        console.log(`✅ ${userType} user created:`, user.email);
      } else {
        console.log(`✅ ${userType} user exists:`, user.email);
      }
      
      // Step 2: Test magic link creation
      console.log(`🔗 Creating magic link for ${userType}...`);
      
      const response = await fetch('http://localhost:3001/api/auth/magic-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          user_type: userType
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ Magic link created successfully for ${userType}!`);
        
        // Step 3: Check magic link in database
        const { data: magicLinks, error: magicLinkError } = await supabase
          .from('magic_links')
          .select('*')
          .eq('email', email)
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (magicLinkError) {
          console.error(`❌ Error fetching magic links for ${userType}:`, magicLinkError);
        } else if (magicLinks && magicLinks.length > 0) {
          const magicLink = magicLinks[0];
          console.log(`✅ Magic link found for ${userType}:`);
          console.log(`  - Token: ${magicLink.token.substring(0, 8)}...`);
          console.log(`  - Type: ${magicLink.type}`);
          console.log(`  - Auth Type: ${magicLink.auth_type}`);
          console.log(`  - Expires: ${magicLink.expires_at}`);
          
          // Step 4: Test magic link verification
          console.log(`🔍 Testing magic link verification for ${userType}...`);
          const verifyResponse = await fetch(`http://localhost:3001/api/auth/verify-magic-link?token=${magicLink.token}&auth_type=${userType}`);
          const verifyResult = await verifyResponse.json();
          
          if (verifyResult.success) {
            console.log(`✅ Magic link verification successful for ${userType}!`);
            console.log(`  - User: ${verifyResult.user.email}`);
            console.log(`  - User Type: ${verifyResult.user.user_type}`);
          } else {
            console.log(`❌ Magic link verification failed for ${userType}:`, verifyResult.error);
          }
        } else {
          console.log(`❌ No magic links found for ${userType}`);
        }
      } else {
        console.log(`❌ Magic link creation failed for ${userType}:`, result.error);
      }
      
    } catch (error) {
      console.error(`❌ Test failed for ${userType}:`, error);
    }
  }
  
  console.log('\n🎉 Magic link testing completed for all user types!');
}

// Run the test
testAllMagicLinkTypes();
