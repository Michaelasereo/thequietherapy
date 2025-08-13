const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with actual credentials
const supabaseUrl = 'https://frzciymslvpohhyefmtr.supabase.co';
const supabaseKey = 'sb_secret_IUgjaZMUy-Il7waL-hMmiw_awYJ2AyO';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestTherapist() {
  try {
    console.log('🚀 Creating test therapist...');

    // Check if therapist already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('global_users')
      .select('id')
      .eq('email', 'test.therapist@trpi.com')
      .single();

    let therapistId;

    if (existingUser) {
      console.log('✅ Therapist already exists, using existing ID:', existingUser.id);
      therapistId = existingUser.id;
    } else {
      // 1. Create therapist user in auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: 'test.therapist@trpi.com',
        password: 'test123456',
        email_confirm: true,
        user_metadata: {
          full_name: 'Dr. Sarah Johnson',
          role: 'therapist'
        }
      });

      if (authError) {
        console.error('❌ Error creating therapist user:', authError);
        return;
      }

      therapistId = authData.user.id;
      console.log('✅ Therapist user created:', therapistId);

      // 2. Add therapist to global_users table
      const { error: userError } = await supabase
        .from('global_users')
        .insert({
          id: therapistId,
          full_name: 'Dr. Sarah Johnson',
          email: 'test.therapist@trpi.com',
          role: 'therapist',
          avatar_url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&crop=face',
          is_verified: true,
          is_active: true
        });

      if (userError) {
        console.error('❌ Error adding therapist to global_users:', userError);
        return;
      }

      console.log('✅ Therapist added to global_users');
    }

    // 3. Check if therapist exists in therapists table
    const { data: existingTherapist, error: therapistCheckError } = await supabase
      .from('therapists')
      .select('user_id')
      .eq('user_id', therapistId)
      .single();

    if (!existingTherapist) {
      // Add therapist to therapists table
      const { error: therapistError } = await supabase
        .from('therapists')
        .insert({
          user_id: therapistId,
          specialization: 'Cognitive Behavioral Therapy, Anxiety, Depression',
          experience_years: 8,
          license_number: 'THR-2024-001',
          is_verified: true,
          hourly_rate: 50,
          bio: 'Experienced therapist specializing in CBT for anxiety and depression. Committed to providing compassionate, evidence-based therapy.',
          languages: ['English', 'Yoruba'],
          education: 'PhD in Clinical Psychology, University of Lagos',
          certifications: ['Licensed Clinical Psychologist', 'CBT Specialist']
        });

      if (therapistError) {
        console.error('❌ Error adding therapist to therapists table:', therapistError);
        return;
      }

      console.log('✅ Therapist added to therapists table');
    } else {
      console.log('✅ Therapist already exists in therapists table');
    }

    // 4. Check if availability slots exist
    const { data: existingSlots, error: slotsCheckError } = await supabase
      .from('therapist_availability')
      .select('id')
      .eq('therapist_id', therapistId)
      .limit(1);

    if (!existingSlots || existingSlots.length === 0) {
      // Create availability slots for the next 7 days
      const availabilitySlots = [];
      const today = new Date();
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        
        // Create slots from 9 AM to 5 PM, every hour
        for (let hour = 9; hour < 17; hour++) {
          const startTime = new Date(date);
          startTime.setHours(hour, 0, 0, 0);
          
          const endTime = new Date(date);
          endTime.setHours(hour + 1, 0, 0, 0);
          
          availabilitySlots.push({
            therapist_id: therapistId,
            date: date.toISOString().split('T')[0],
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            is_available: true,
            session_duration: 60
          });
        }
      }

      const { error: availabilityError } = await supabase
        .from('therapist_availability')
        .insert(availabilitySlots);

      if (availabilityError) {
        console.error('❌ Error creating availability slots:', availabilityError);
        return;
      }

      console.log('✅ Availability slots created');
    } else {
      console.log('✅ Availability slots already exist');
    }

    // 5. Update user credits to 3 (for testing)
    const { error: creditsError } = await supabase
      .from('global_users')
      .update({ credits: 3 })
      .eq('email', 'test.user@trpi.com'); // Update test user credits

    if (creditsError) {
      console.error('❌ Error updating user credits:', creditsError);
    } else {
      console.log('✅ Test user credits updated to 3');
    }

    console.log('🎉 Test therapist setup complete!');
    console.log('📧 Email: test.therapist@trpi.com');
    console.log('🔑 Password: test123456');
    console.log('🆔 Therapist ID:', therapistId);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the script
createTestTherapist();
