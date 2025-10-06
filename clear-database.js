// Clear all data from the database
// This script will remove all users and related data

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function clearAllData() {
  try {
    console.log('🧹 Starting complete database cleanup...');
    
    // List of tables to clear in dependency order
    const tablesToClear = [
      'session_notes',
      'sessions', 
      'user_sessions',
      'magic_links',
      'therapist_enrollments',
      'therapist_profiles',
      'therapist_availability',
      'user_credits',
      'user_packages',
      'payments',
      'credits',
      'partner_members',
      'partners',
      'content',
      'admin_logs',
      'users'
    ];
    
    // Clear each table
    for (const table of tablesToClear) {
      console.log(`🗑️  Clearing table: ${table}`);
      
      const { error } = await supabase
        .from(table)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records
      
      if (error) {
        console.log(`⚠️  Table ${table} might not exist or is already empty:`, error.message);
      } else {
        console.log(`✅ Cleared table: ${table}`);
      }
    }
    
    // Clear Supabase Auth users
    console.log('🔍 Clearing Supabase Auth users...');
    const { data: authUsers, error: fetchError } = await supabase.auth.admin.listUsers();
    
    if (!fetchError && authUsers.users.length > 0) {
      console.log(`📊 Found ${authUsers.users.length} users in Supabase Auth`);
      
      for (const user of authUsers.users) {
        console.log(`🗑️  Deleting auth user: ${user.email}`);
        const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
        
        if (deleteError) {
          console.error(`❌ Error deleting auth user ${user.email}:`, deleteError);
        } else {
          console.log(`✅ Deleted auth user: ${user.email}`);
        }
      }
    } else {
      console.log('✅ No Supabase Auth users to delete');
    }
    
    // Verify cleanup
    console.log('\n📊 Verifying cleanup...');
    const verificationTables = ['users', 'sessions', 'therapist_profiles', 'magic_links'];
    
    for (const table of verificationTables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`⚠️  Could not verify ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: ${count} records remaining`);
      }
    }
    
    console.log('\n🎉 Database cleanup completed successfully!');
    console.log('You can now start fresh with your testing.');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

// Run the cleanup
clearAllData();
