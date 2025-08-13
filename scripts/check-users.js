require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkUsers() {
  console.log('🔍 Checking users in database...\n');

  try {
    // Get all users
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, user_type, is_verified, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.log('❌ Error fetching users:', error);
      return;
    }

    console.log(`📊 Found ${users.length} users in database:\n`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Name: ${user.full_name}`);
      console.log(`   Type: ${user.user_type}`);
      console.log(`   Verified: ${user.is_verified}`);
      console.log(`   Created: ${user.created_at}`);
      console.log('');
    });

    // Check for specific email
    const testEmail = 'asereope@gmail.com';
    const { data: specificUser } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', testEmail)
      .single();

    if (specificUser) {
      console.log(`✅ User with email ${testEmail} exists:`);
      console.log(JSON.stringify(specificUser, null, 2));
    } else {
      console.log(`❌ User with email ${testEmail} not found`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkUsers();
