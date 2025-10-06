// Simple database cleanup - only clears tables that exist
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function clearDatabase() {
  try {
    console.log('🧹 Starting database cleanup...');
    
    // First, let's see what tables exist by trying to query them
    const tablesToTry = [
      'users',
      'sessions', 
      'session_notes',
      'therapist_profiles',
      'therapist_enrollments',
      'therapist_availability',
      'magic_links',
      'user_sessions',
      'payments',
      'credits',
      'partners',
      'partner_members',
      'content',
      'admin_logs'
    ];
    
    const existingTables = [];
    
    // Check which tables exist
    for (const table of tablesToTry) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (!error) {
          existingTables.push(table);
          console.log(`✅ Found table: ${table}`);
        }
      } catch (err) {
        console.log(`❌ Table ${table} does not exist`);
      }
    }
    
    console.log(`\n📊 Found ${existingTables.length} tables to clear`);
    
    // Clear existing tables in reverse order (to handle dependencies)
    const clearOrder = [
      'session_notes',
      'sessions', 
      'user_sessions',
      'magic_links',
      'therapist_enrollments',
      'therapist_profiles',
      'therapist_availability',
      'payments',
      'credits',
      'partner_members',
      'partners',
      'content',
      'admin_logs',
      'users'
    ];
    
    for (const table of clearOrder) {
      if (existingTables.includes(table)) {
        console.log(`🗑️  Clearing table: ${table}`);
        
        const { error } = await supabase
          .from(table)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records
        
        if (error) {
          console.log(`⚠️  Error clearing ${table}:`, error.message);
        } else {
          console.log(`✅ Cleared table: ${table}`);
        }
      }
    }
    
    // Clear Supabase Auth users
    console.log('\n🔍 Clearing Supabase Auth users...');
    try {
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
    } catch (authError) {
      console.log('⚠️  Could not clear Supabase Auth users:', authError.message);
    }
    
    // Verify cleanup
    console.log('\n📊 Verifying cleanup...');
    for (const table of ['users', 'sessions', 'therapist_profiles', 'magic_links']) {
      if (existingTables.includes(table)) {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.log(`⚠️  Could not verify ${table}: ${error.message}`);
        } else {
          console.log(`✅ ${table}: ${count} records remaining`);
        }
      }
    }
    
    console.log('\n🎉 Database cleanup completed!');
    console.log('You can now start fresh with your testing.');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

// Run the cleanup
clearDatabase();
