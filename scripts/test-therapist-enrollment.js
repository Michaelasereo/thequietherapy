require('dotenv').config({ path: '.env.local' });

async function testTherapistEnrollment() {
  console.log('🧪 Testing Therapist Enrollment Flow...\n');

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const testEmail = 'test-enrollment@example.com';

  try {
    // Step 1: Simulate therapist enrollment by creating data directly
    console.log('1. Simulating therapist enrollment...');
    
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Create therapist enrollment
    const { data: therapistData, error: therapistError } = await supabase
      .from('therapist_enrollments')
      .insert({
        email: testEmail,
        full_name: 'Dr. Test Enrollment',
        phone: '+2348012345678',
        specialization: ['Anxiety', 'Depression'],
        languages: ['English', 'Yoruba'],
        status: 'pending',
        hourly_rate: 5000,
        bio: 'Test enrollment therapist'
      })
      .select()
      .single();

    if (therapistError) {
      console.log('❌ Error creating therapist enrollment:', therapistError.message);
      return;
    }

    console.log('✅ Therapist enrollment created:', therapistData.id);

    // Create user record
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        email: testEmail,
        full_name: 'Dr. Test Enrollment',
        user_type: 'therapist',
        is_verified: false,
        is_active: false
      })
      .select()
      .single();

    if (userError) {
      console.log('❌ Error creating user record:', userError.message);
      return;
    }

    console.log('✅ User record created:', userData.id);

    // Step 2: Check if magic link was created
    console.log('\n2. Checking for magic link in database...');

    const { data: magicLinks, error: magicLinksError } = await supabase
      .from('magic_links')
      .select('*')
      .eq('email', testEmail)
      .order('created_at', { ascending: false })
      .limit(1);

    if (magicLinksError) {
      console.error('❌ Error checking magic links:', magicLinksError);
      return;
    }

    if (magicLinks && magicLinks.length > 0) {
      const magicLink = magicLinks[0];
      console.log('✅ Magic link found:', {
        id: magicLink.id,
        type: magicLink.type,
        used: magicLink.used_at ? 'Yes' : 'No',
        expires: magicLink.expires_at,
        metadata: magicLink.metadata
      });

      // Step 3: Test magic link verification
      console.log('\n3. Testing magic link verification...');
      const verificationUrl = `${baseUrl}/api/auth/verify-magic-link?token=${magicLink.token}`;
      console.log('Verification URL:', verificationUrl);

      const verifyResponse = await fetch(verificationUrl, {
        method: 'GET',
        redirect: 'manual', // Don't follow redirects
      });

      console.log('Verification response status:', verifyResponse.status);
      console.log('Verification response headers:', Object.fromEntries(verifyResponse.headers.entries()));

      if (verifyResponse.status === 302 || verifyResponse.status === 307) {
        const location = verifyResponse.headers.get('location');
        console.log('✅ Verification successful, redirecting to:', location);
        
        if (location && location.includes('/therapist/dashboard')) {
          console.log('✅ Correctly redirected to therapist dashboard!');
        } else {
          console.log('❌ Incorrect redirect location:', location);
        }
      } else {
        console.log('❌ Verification failed or unexpected response');
      }

    } else {
      console.log('❌ No magic link found');
    }

    console.log('\n✅ Therapist enrollment flow test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testTherapistEnrollment();
