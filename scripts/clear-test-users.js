require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function clearTestUsers() {
  console.log('🧹 Clearing test users from database...\n');

  try {
    // First, show current users
    console.log('1️⃣ Current users before cleanup:');
    const { data: currentUsers, error: currentError } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, user_type, is_verified, created_at')
      .order('created_at', { ascending: false });

    if (currentError) {
      console.log('❌ Error fetching current users:', currentError);
      return;
    }

    console.log(`📊 Found ${currentUsers.length} users:\n`);
    currentUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.full_name}) - ${user.user_type}`);
    });

    // Delete test users
    console.log('\n2️⃣ Deleting test users...');
    const { error: deleteUsersError } = await supabaseAdmin
      .from('users')
      .delete()
      .or('email.like.%test%,email.like.%debug%,email.like.%@example.com,email.like.%@gmail.com,email.like.%@opportunedesignco.com');

    if (deleteUsersError) {
      console.log('❌ Error deleting users:', deleteUsersError);
      return;
    }

    console.log('✅ Test users deleted successfully!');

    // Delete related magic links
    console.log('\n3️⃣ Deleting related magic links...');
    const { error: deleteMagicLinksError } = await supabaseAdmin
      .from('magic_links')
      .delete()
      .or('email.like.%test%,email.like.%debug%,email.like.%@example.com,email.like.%@gmail.com,email.like.%@opportunedesignco.com');

    if (deleteMagicLinksError) {
      console.log('❌ Error deleting magic links:', deleteMagicLinksError);
    } else {
      console.log('✅ Magic links deleted successfully!');
    }

    // Show remaining users
    console.log('\n4️⃣ Remaining users after cleanup:');
    const { data: remainingUsers, error: remainingError } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, user_type, is_verified, created_at')
      .order('created_at', { ascending: false });

    if (remainingError) {
      console.log('❌ Error fetching remaining users:', remainingError);
      return;
    }

    console.log(`📊 Remaining users: ${remainingUsers.length}\n`);
    remainingUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.full_name}) - ${user.user_type}`);
    });

    // Show remaining magic links
    console.log('\n5️⃣ Remaining magic links:');
    const { data: remainingMagicLinks, error: magicLinksError } = await supabaseAdmin
      .from('magic_links')
      .select('email, type, created_at')
      .order('created_at', { ascending: false });

    if (magicLinksError) {
      console.log('❌ Error fetching magic links:', magicLinksError);
    } else {
      console.log(`📊 Remaining magic links: ${remainingMagicLinks.length}\n`);
      remainingMagicLinks.forEach((link, index) => {
        console.log(`${index + 1}. ${link.email} (${link.type})`);
      });
    }

    console.log('\n🎉 Database cleanup completed!');
    console.log('💡 You can now test registration with fresh data.');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

clearTestUsers();
