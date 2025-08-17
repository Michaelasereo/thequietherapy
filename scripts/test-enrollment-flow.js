require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testEnrollmentFlow() {
  console.log('🧪 Testing Therapist Enrollment Flow...');
  
  try {
    // Test data for enrollment
    const testEmail = 'test-enrollment-flow@example.com';
    
    // First, check if this email already exists
    console.log('\n1. Checking if email already exists...');
    const { data: existingUser, error: userCheckError } = await supabase
      .from('users')
      .select('*')
      .eq('email', testEmail)
      .single();

    if (existingUser) {
      console.log('⚠️  User already exists, deleting for fresh test...');
      await supabase.from('users').delete().eq('email', testEmail);
    }

    const { data: existingTherapist, error: therapistCheckError } = await supabase
      .from('therapist_enrollments')
      .select('*')
      .eq('email', testEmail)
      .single();

    if (existingTherapist) {
      console.log('⚠️  Therapist enrollment already exists, deleting for fresh test...');
      await supabase.from('therapist_enrollments').delete().eq('email', testEmail);
    }

    // Test the enrollment by directly calling the database operations
    console.log('\n2. Testing enrollment data insertion...');
    
    const enrollmentData = {
      full_name: 'Test Enrollment Flow',
      email: testEmail,
      phone: '+2348012345678',
      specialization: ['Anxiety', 'Depression'],
      languages: ['English', 'Yoruba'],
      status: 'pending',
      created_at: new Date().toISOString()
    };

    const { data: therapistData, error: therapistError } = await supabase
      .from('therapist_enrollments')
      .insert(enrollmentData)
      .select()
      .single();

    if (therapistError) {
      console.error('❌ Error creating therapist enrollment:', therapistError);
      return;
    }

    console.log('✅ Therapist enrollment created:', therapistData.id);

    // Create user record
    console.log('\n3. Creating user record...');
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        email: testEmail,
        full_name: 'Test Enrollment Flow',
        user_type: 'therapist',
        is_verified: false,
        is_active: true
      })
      .select()
      .single();

    if (userError) {
      console.error('❌ Error creating user record:', userError);
      return;
    }

    console.log('✅ User record created:', userData.id);

    // Test magic link creation
    console.log('\n4. Testing magic link creation...');
    const { createMagicLink } = require('../lib/auth.js');
    
    const magicLinkResult = await createMagicLink({
      email: testEmail,
      type: 'signup',
      metadata: {
        first_name: 'Test Enrollment Flow',
        user_type: 'therapist',
        therapist_id: therapistData.id,
        phone: '+2348012345678',
        specialization: ['Anxiety', 'Depression'],
        languages: ['English', 'Yoruba']
      }
    });

    console.log('Magic link result:', magicLinkResult);

    if (magicLinkResult.success) {
      console.log('✅ Magic link created successfully');
      
      // Check if magic link was saved in database
      console.log('\n5. Checking magic link in database...');
      const { data: magicLinks, error: magicLinkError } = await supabase
        .from('magic_links')
        .select('*')
        .eq('email', testEmail)
        .order('created_at', { ascending: false })
        .limit(1);

      if (magicLinkError) {
        console.error('❌ Error checking magic links:', magicLinkError);
      } else if (magicLinks && magicLinks.length > 0) {
        console.log('✅ Magic link found in database:', {
          id: magicLinks[0].id,
          type: magicLinks[0].type,
          expires: magicLinks[0].expires_at,
          used: magicLinks[0].used_at ? 'Yes' : 'No'
        });
      } else {
        console.log('❌ No magic link found in database');
      }
    } else {
      console.log('❌ Magic link creation failed:', magicLinkResult.error);
    }

    console.log('\n📋 Enrollment Flow Test Summary:');
    console.log('✅ Database operations working');
    console.log('✅ User and therapist records created');
    if (magicLinkResult.success) {
      console.log('✅ Magic link creation working');
      console.log('✅ Email should have been sent');
    } else {
      console.log('❌ Magic link creation failed');
      console.log('❌ Email not sent');
    }

  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testEnrollmentFlow();
