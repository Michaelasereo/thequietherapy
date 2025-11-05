#!/usr/bin/env node

/**
 * Find Orphaned Supabase Auth Users
 * 
 * This script finds users that exist in Supabase Auth but NOT in the database.
 * These users block signup attempts even though they don't exist in the database.
 * 
 * Usage:
 * node find-orphaned-auth-users.js [--delete]
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('   Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function findOrphanedAuthUsers() {
  console.log('🔍 Finding orphaned Supabase Auth users...\n');
  
  // Get all users from database
  const { data: dbUsers, error: dbError } = await supabase
    .from('users')
    .select('id, email, full_name, user_type');
  
  if (dbError) {
    console.error('❌ Error fetching database users:', dbError.message);
    process.exit(1);
  }
  
  // Get all users from Supabase Auth
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
  
  if (authError) {
    console.error('❌ Error fetching Supabase Auth users:', authError.message);
    process.exit(1);
  }
  
  const authUsers = authData.users || [];
  
  console.log(`📊 Database users: ${dbUsers.length}`);
  console.log(`📊 Supabase Auth users: ${authUsers.length}\n`);
  
  // Create a set of database user IDs and emails for quick lookup
  const dbUserIds = new Set(dbUsers.map(u => u.id));
  const dbUserEmails = new Set(dbUsers.map(u => u.email?.toLowerCase()));
  
  // Find users in Supabase Auth but NOT in database
  const orphanedAuthUsers = authUsers.filter(authUser => {
    // Check by ID first
    if (!dbUserIds.has(authUser.id)) {
      // Also check by email (in case ID doesn't match)
      if (!authUser.email || !dbUserEmails.has(authUser.email.toLowerCase())) {
        return true;
      }
    }
    return false;
  });
  
  if (orphanedAuthUsers.length === 0) {
    console.log('✅ No orphaned Supabase Auth users found!');
    console.log('   All users are properly synchronized.\n');
    return [];
  }
  
  console.log(`❌ Found ${orphanedAuthUsers.length} orphaned Supabase Auth users:\n`);
  console.log('These users exist in Supabase Auth but NOT in your database.');
  console.log('They are blocking signup attempts with these emails.\n');
  
  orphanedAuthUsers.forEach((user, index) => {
    console.log(`${index + 1}. ${user.email || '(no email)'}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Created: ${user.created_at || 'unknown'}`);
    console.log(`   Last Sign In: ${user.last_sign_in_at || 'never'}`);
    console.log(`   Email Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`);
    console.log('');
  });
  
  return orphanedAuthUsers;
}

async function deleteOrphanedAuthUsers(orphanedUsers) {
  console.log(`\n🗑️  Deleting ${orphanedUsers.length} orphaned Supabase Auth users...\n`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const user of orphanedUsers) {
    try {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);
      
      if (error) {
        console.error(`❌ Failed to delete ${user.email}: ${error.message}`);
        errorCount++;
      } else {
        console.log(`✅ Deleted ${user.email}`);
        successCount++;
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`❌ Error deleting ${user.email}:`, error.message);
      errorCount++;
    }
  }
  
  console.log(`\n📊 Deletion Summary:`);
  console.log(`   ✅ Successfully deleted: ${successCount}`);
  console.log(`   ❌ Failed: ${errorCount}`);
  console.log(`   📝 Total: ${orphanedUsers.length}\n`);
}

async function main() {
  const args = process.argv.slice(2);
  const shouldDelete = args.includes('--delete');
  
  console.log('🧹 Orphaned Supabase Auth Users Finder\n');
  
  try {
    const orphanedUsers = await findOrphanedAuthUsers();
    
    if (orphanedUsers.length > 0) {
      if (shouldDelete) {
        console.log('⚠️  WARNING: This will permanently delete these users from Supabase Auth.');
        console.log('   They will be able to sign up again after deletion.\n');
        
        await deleteOrphanedAuthUsers(orphanedUsers);
        
        console.log('✅ Cleanup completed!');
        console.log('   Users can now sign up with these emails again.\n');
      } else {
        console.log('💡 To delete these orphaned users, run:');
        console.log(`   node find-orphaned-auth-users.js --delete\n`);
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { findOrphanedAuthUsers };

