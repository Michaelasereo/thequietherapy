import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createSampleUsers() {
  console.log('🚀 Creating sample users for testing...\n');

  try {
    // 1. Create Sample User (Individual)
    console.log('📝 Creating sample user...');
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([
        {
          email: 'testuser@example.com',
          full_name: 'John Doe',
          user_type: 'individual',
          is_verified: true,
          is_active: true,
          credits: 50,
          package_type: 'basic'
        }
      ])
      .select()
      .single();

    if (userError) {
      console.error('❌ Error creating user:', userError);
    } else {
      console.log('✅ Sample user created:', userData.email);
    }

    // 2. Create Sample Therapist
    console.log('\n👨‍⚕️ Creating sample therapist...');
    const { data: therapistData, error: therapistError } = await supabase
      .from('users')
      .insert([
        {
          email: 'testtherapist@example.com',
          full_name: 'Dr. Sarah Johnson',
          user_type: 'therapist',
          is_verified: true,
          is_active: true,
          credits: 0,
          package_type: 'professional'
        }
      ])
      .select()
      .single();

    if (therapistError) {
      console.error('❌ Error creating therapist:', therapistError);
    } else {
      console.log('✅ Sample therapist created:', therapistData.email);
    }

    // 3. Create Sample Partner
    console.log('\n🏢 Creating sample partner...');
    const { data: partnerData, error: partnerError } = await supabase
      .from('users')
      .insert([
        {
          email: 'testpartner@example.com',
          full_name: 'TechCorp Solutions',
          user_type: 'partner',
          is_verified: true,
          is_active: true,
          credits: 1000,
          package_type: 'enterprise'
        }
      ])
      .select()
      .single();

    if (partnerError) {
      console.error('❌ Error creating partner:', partnerError);
    } else {
      console.log('✅ Sample partner created:', partnerData.email);
    }

    // 4. Create Sample Admin
    console.log('\n👑 Creating sample admin...');
    const { data: adminData, error: adminError } = await supabase
      .from('users')
      .insert([
        {
          email: 'testadmin@example.com',
          full_name: 'System Administrator',
          user_type: 'admin',
          is_verified: true,
          is_active: true,
          credits: 0,
          package_type: 'admin'
        }
      ])
      .select()
      .single();

    if (adminError) {
      console.error('❌ Error creating admin:', adminError);
    } else {
      console.log('✅ Sample admin created:', adminData.email);
    }

    // 5. Create sample sessions table entries
    console.log('\n📅 Creating sample sessions...');
    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .insert([
        {
          therapist_id: therapistData?.id,
          title: 'Initial Consultation',
          description: 'First session to understand your needs',
          duration_minutes: 60,
          price: 5000,
          status: 'available'
        },
        {
          therapist_id: therapistData?.id,
          title: 'Follow-up Session',
          description: 'Regular therapy session',
          duration_minutes: 45,
          price: 4000,
          status: 'available'
        }
      ])
      .select();

    if (sessionError) {
      console.error('❌ Error creating sessions:', sessionError);
    } else {
      console.log('✅ Sample sessions created:', sessionData.length, 'sessions');
    }

    // 6. Create global user records for cross-dashboard functionality
    console.log('\n🌐 Creating global user records...');
    const globalUsers = [
      { user_id: userData?.id, user_type: 'individual', dashboard_type: 'user' },
      { user_id: therapistData?.id, user_type: 'therapist', dashboard_type: 'therapist' },
      { user_id: partnerData?.id, user_type: 'partner', dashboard_type: 'partner' },
      { user_id: adminData?.id, user_type: 'admin', dashboard_type: 'admin' }
    ];

    for (const globalUser of globalUsers) {
      if (globalUser.user_id) {
        const { error: globalError } = await supabase
          .from('global_users')
          .insert([globalUser]);

        if (globalError) {
          console.error('❌ Error creating global user record:', globalError);
        } else {
          console.log('✅ Global user record created for:', globalUser.user_type);
        }
      }
    }

    console.log('\n🎉 Sample users created successfully!');
    console.log('\n📋 Test Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👤 User: testuser@example.com');
    console.log('👨‍⚕️ Therapist: testtherapist@example.com');
    console.log('🏢 Partner: testpartner@example.com');
    console.log('👑 Admin: testadmin@example.com');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n💡 Use the dev-login page to authenticate: http://localhost:3001/test-login');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

createSampleUsers();
