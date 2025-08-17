require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestTherapist() {
  console.log('🧪 Creating Test Therapist...\n');

  const testTherapist = {
    email: 'test-therapist@example.com',
    full_name: 'Dr. Test Therapist',
    phone: '+2348012345678',
    specialization: ['Anxiety', 'Depression'],
    languages: ['English', 'Yoruba'],
    status: 'pending', // Start with pending status
    hourly_rate: 5000,
    bio: 'Test therapist for authentication flow testing'
  };

  try {
    // Step 1: Create therapist enrollment
    console.log('1. Creating therapist enrollment...');
    const { data: therapistData, error: therapistError } = await supabase
      .from('therapist_enrollments')
      .insert(testTherapist)
      .select()
      .single();

    if (therapistError) {
      if (therapistError.code === '23505') {
        console.log('ℹ️  Therapist already exists, updating...');
        const { data: updatedTherapist, error: updateError } = await supabase
          .from('therapist_enrollments')
          .update(testTherapist)
          .eq('email', testTherapist.email)
          .select()
          .single();

        if (updateError) {
          console.error('❌ Error updating therapist:', updateError);
          return;
        }
        console.log('✅ Therapist updated:', updatedTherapist.id);
      } else {
        console.error('❌ Error creating therapist:', therapistError);
        return;
      }
    } else {
      console.log('✅ Therapist created:', therapistData.id);
    }

    // Step 2: Create user record
    console.log('\n2. Creating user record...');
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        email: testTherapist.email,
        full_name: testTherapist.full_name,
        user_type: 'therapist',
        is_verified: true,
        is_active: true
      })
      .select()
      .single();

    if (userError) {
      if (userError.code === '23505') {
        console.log('ℹ️  User already exists, updating...');
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update({
            user_type: 'therapist',
            is_verified: true,
            is_active: true
          })
          .eq('email', testTherapist.email)
          .select()
          .single();

        if (updateError) {
          console.error('❌ Error updating user:', updateError);
          return;
        }
        console.log('✅ User updated:', updatedUser.id);
      } else {
        console.error('❌ Error creating user:', userError);
        return;
      }
    } else {
      console.log('✅ User created:', userData.id);
    }

    console.log('\n✅ Test therapist setup completed successfully!');
    console.log('\n📋 Test Data:');
    console.log(`   Email: ${testTherapist.email}`);
    console.log(`   Name: ${testTherapist.full_name}`);
    console.log(`   Status: ${testTherapist.status}`);
    console.log(`   User Type: therapist`);
    console.log(`   Verified: true`);
    console.log(`   Active: true`);

  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

// Run the setup
createTestTherapist();
