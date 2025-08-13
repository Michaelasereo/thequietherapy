require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function createTestUsers() {
  console.log('🔧 Creating test users for different roles...\n');

  try {
    // Create individual user (regular user)
    console.log('1️⃣ Creating individual user...');
    const { data: individualUser, error: individualError } = await supabaseAdmin
      .from('users')
      .upsert({
        email: 'asereope@gmail.com',
        full_name: 'Michael Asere',
        user_type: 'individual',
        is_verified: true,
        is_active: true,
        credits: 50,
        package_type: 'Premium'
      }, { onConflict: 'email' })
      .select()
      .single();

    if (individualError) {
      console.log('❌ Error creating individual user:', individualError);
    } else {
      console.log('✅ Individual user created/updated:', individualUser.id);
    }

    // Create partner user (different email)
    console.log('\n2️⃣ Creating partner user...');
    const { data: partnerUser, error: partnerError } = await supabaseAdmin
      .from('users')
      .upsert({
        email: 'asereope.partner@gmail.com',
        full_name: 'Michael Asere (Partner)',
        user_type: 'partner',
        is_verified: true,
        is_active: true,
        credits: 1000,
        package_type: 'Enterprise'
      }, { onConflict: 'email' })
      .select()
      .single();

    if (partnerError) {
      console.log('❌ Error creating partner user:', partnerError);
    } else {
      console.log('✅ Partner user created/updated:', partnerUser.id);
    }

    // Create therapist user (different email)
    console.log('\n3️⃣ Creating therapist user...');
    const { data: therapistUser, error: therapistError } = await supabaseAdmin
      .from('users')
      .upsert({
        email: 'asereope.therapist@gmail.com',
        full_name: 'Dr. Michael Asere',
        user_type: 'therapist',
        is_verified: true,
        is_active: true,
        credits: 500,
        package_type: 'Professional'
      }, { onConflict: 'email' })
      .select()
      .single();

    if (therapistError) {
      console.log('❌ Error creating therapist user:', therapistError);
    } else {
      console.log('✅ Therapist user created/updated:', therapistUser.id);
    }

    // Show all test users
    console.log('\n4️⃣ All test users created:');
    const { data: allUsers, error: allUsersError } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, user_type, is_verified, credits, package_type')
      .in('email', ['asereope@gmail.com', 'asereope.partner@gmail.com', 'asereope.therapist@gmail.com'])
      .order('user_type');

    if (allUsersError) {
      console.log('❌ Error fetching users:', allUsersError);
    } else {
      allUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email}`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Name: ${user.full_name}`);
        console.log(`   Type: ${user.user_type}`);
        console.log(`   Verified: ${user.is_verified}`);
        console.log(`   Credits: ${user.credits}`);
        console.log(`   Package: ${user.package_type}`);
        console.log('');
      });
    }

    console.log('🎉 Test users created successfully!');
    console.log('\n📋 Test URLs:');
    console.log('   Individual Dashboard: http://localhost:3001/dashboard');
    console.log('   Partner Dashboard: http://localhost:3001/partner/dashboard');
    console.log('   Therapist Dashboard: http://localhost:3001/therapist/dashboard');
    console.log('\n💡 Use these emails to test different areas:');
    console.log('   - asereope@gmail.com (Individual)');
    console.log('   - asereope.partner@gmail.com (Partner)');
    console.log('   - asereope.therapist@gmail.com (Therapist)');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createTestUsers();
