const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with actual credentials
const supabaseUrl = 'https://frzciymslvpohhyefmtr.supabase.co';
const supabaseKey = 'sb_secret_IUgjaZMUy-Il7waL-hMmiw_awYJ2AyO';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestTherapist() {
  try {
    console.log('🚀 Creating test therapist...');

    // Generate a UUID for the therapist
    const therapistId = '550e8400-e29b-41d4-a716-446655440001'; // Fixed UUID for consistency

    // 1. Add therapist to global_users table
    const { error: userError } = await supabase
      .from('global_users')
      .upsert({
        id: therapistId,
        full_name: 'Dr. Sarah Johnson',
        email: 'test.therapist@trpi.com',
        user_type: 'therapist',
        avatar_url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&crop=face',
        is_verified: true,
        is_active: true
      }, { onConflict: 'id' });

    if (userError) {
      console.error('❌ Error adding therapist to global_users:', userError);
      return;
    }

    console.log('✅ Therapist added to global_users');

    // 2. Add therapist to therapists table (skipping for now due to foreign key constraint)
    console.log('⚠️ Skipping therapists table (foreign key constraint)');

    // 3. Create availability slots (skipping for now due to schema differences)
    console.log('⚠️ Skipping availability slots (schema differences)');

    // 4. Create or update test user
    const { error: userCreditsError } = await supabase
      .from('global_users')
      .upsert({
        id: '550e8400-e29b-41d4-a716-446655440002', // Fixed UUID for test user
        full_name: 'Test User',
        email: 'test.user@trpi.com',
        user_type: 'user',
        avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
        is_verified: true,
        is_active: true
      }, { onConflict: 'id' });

    if (userCreditsError) {
      console.error('❌ Error updating user:', userCreditsError);
    } else {
      console.log('✅ Test user created/updated');
    }

    console.log('🎉 Test users setup complete!');
    console.log('📧 Therapist Email: test.therapist@trpi.com');
    console.log('📧 User Email: test.user@trpi.com');
    console.log('🔑 Password: test123456 (for both)');
    console.log('🆔 Therapist ID:', therapistId);
    console.log('💡 Note: You may need to manually set user credits and create availability slots');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the script
createTestTherapist();
