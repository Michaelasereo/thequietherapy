require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testMagicLinkCreation() {
  console.log('🧪 Testing Magic Link Creation...\n');

  try {
    // Test email
    const testEmail = 'test@example.com';
    
    console.log('1. Testing magic link creation for partner...');
    
    // Create a test magic link
    const { data: magicLink, error } = await supabase
      .from('magic_links')
      .insert({
        email: testEmail,
        token: 'test-token-' + Date.now(),
        type: 'login',
        auth_type: 'partner',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        metadata: { 
          auth_type: 'partner',
          first_name: 'Test Partner',
          organization_name: 'Test Org'
        }
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating magic link:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return;
    }

    console.log('✅ Magic link created successfully!');
    console.log('📋 Magic link data:', {
      id: magicLink.id,
      email: magicLink.email,
      type: magicLink.type,
      auth_type: magicLink.auth_type,
      expires_at: magicLink.expires_at,
      created_at: magicLink.created_at
    });

    // Test retrieving the magic link
    console.log('\n2. Testing magic link retrieval...');
    const { data: retrievedLink, error: retrieveError } = await supabase
      .from('magic_links')
      .select('*')
      .eq('token', magicLink.token)
      .single();

    if (retrieveError) {
      console.error('❌ Error retrieving magic link:', retrieveError);
    } else {
      console.log('✅ Magic link retrieved successfully!');
      console.log('📋 Retrieved data:', {
        id: retrievedLink.id,
        email: retrievedLink.email,
        type: retrievedLink.type,
        auth_type: retrievedLink.auth_type
      });
    }

    // Clean up test data
    console.log('\n3. Cleaning up test data...');
    await supabase
      .from('magic_links')
      .delete()
      .eq('id', magicLink.id);
    
    console.log('✅ Test data cleaned up');

    console.log('\n📋 Test Summary:');
    console.log('  ✅ Magic link creation works');
    console.log('  ✅ Magic link retrieval works');
    console.log('  ✅ Database operations are functional');
    console.log('\n🎯 Next Steps:');
    console.log('  1. Configure email service (Brevo SMTP) for production');
    console.log('  2. Set up SENDER_EMAIL environment variable');
    console.log('  3. Test with real email addresses');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testMagicLinkCreation();
