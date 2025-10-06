#!/usr/bin/env node

/**
 * Cleanup Orphaned Users Script
 * 
 * This script helps identify and clean up users that exist in your database
 * but not in Supabase Auth, or vice versa.
 * 
 * Usage:
 * node scripts/cleanup-orphaned-users.js [--dry-run] [--fix-database] [--fix-auth]
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function getDatabaseUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, full_name, user_type, is_active, created_at');
  
  if (error) {
    throw new Error(`Error fetching database users: ${error.message}`);
  }
  
  return data || [];
}

async function getSupabaseAuthUsers() {
  const { data, error } = await supabaseAdmin.auth.admin.listUsers();
  
  if (error) {
    throw new Error(`Error fetching Supabase Auth users: ${error.message}`);
  }
  
  return data.users || [];
}

async function findOrphanedUsers() {
  console.log('🔍 Analyzing user synchronization...\n');
  
  const dbUsers = await getDatabaseUsers();
  const authUsers = await getSupabaseAuthUsers();
  
  console.log(`📊 Database users: ${dbUsers.length}`);
  console.log(`📊 Supabase Auth users: ${authUsers.length}\n`);
  
  // Create maps for easier lookup
  const dbUserMap = new Map(dbUsers.map(user => [user.id, user]));
  const authUserMap = new Map(authUsers.map(user => [user.id, user]));
  
  // Find users in database but not in Supabase Auth
  const orphanedInDatabase = dbUsers.filter(user => !authUserMap.has(user.id));
  
  // Find users in Supabase Auth but not in database
  const orphanedInAuth = authUsers.filter(user => !dbUserMap.has(user.id));
  
  // Find users with mismatched emails
  const emailMismatches = dbUsers.filter(dbUser => {
    const authUser = authUserMap.get(dbUser.id);
    return authUser && authUser.email !== dbUser.email;
  });
  
  console.log('🔍 ANALYSIS RESULTS:\n');
  
  if (orphanedInDatabase.length > 0) {
    console.log(`❌ Users in database but NOT in Supabase Auth (${orphanedInDatabase.length}):`);
    orphanedInDatabase.forEach(user => {
      console.log(`   - ${user.email} (${user.full_name}) - ${user.user_type} - Created: ${user.created_at}`);
    });
    console.log('');
  }
  
  if (orphanedInAuth.length > 0) {
    console.log(`❌ Users in Supabase Auth but NOT in database (${orphanedInAuth.length}):`);
    orphanedInAuth.forEach(user => {
      console.log(`   - ${user.email} - Created: ${user.created_at}`);
    });
    console.log('');
  }
  
  if (emailMismatches.length > 0) {
    console.log(`⚠️  Users with email mismatches (${emailMismatches.length}):`);
    emailMismatches.forEach(dbUser => {
      const authUser = authUserMap.get(dbUser.id);
      console.log(`   - DB: ${dbUser.email} vs Auth: ${authUser.email} (${dbUser.full_name})`);
    });
    console.log('');
  }
  
  if (orphanedInDatabase.length === 0 && orphanedInAuth.length === 0 && emailMismatches.length === 0) {
    console.log('✅ All users are properly synchronized!');
  }
  
  return {
    orphanedInDatabase,
    orphanedInAuth,
    emailMismatches,
    dbUsers,
    authUsers
  };
}

async function fixOrphanedUsers(options = {}) {
  const { dryRun = true, fixDatabase = false, fixAuth = false } = options;
  
  const analysis = await findOrphanedUsers();
  
  if (dryRun) {
    console.log('\n🔍 DRY RUN MODE - No changes will be made');
    console.log('Use --fix-database or --fix-auth to actually make changes\n');
    return;
  }
  
  console.log('\n🔧 FIXING ORPHANED USERS...\n');
  
  // Fix users in database but not in Supabase Auth
  if (fixAuth && analysis.orphanedInDatabase.length > 0) {
    console.log('🔧 Creating missing users in Supabase Auth...');
    
    for (const user of analysis.orphanedInDatabase) {
      try {
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
          id: user.id,
          email: user.email,
          email_confirm: true,
          user_metadata: {
            full_name: user.full_name,
            user_type: user.user_type,
            synced_at: new Date().toISOString()
          }
        });
        
        if (error) {
          console.error(`❌ Failed to create ${user.email} in Supabase Auth:`, error.message);
        } else {
          console.log(`✅ Created ${user.email} in Supabase Auth`);
        }
      } catch (error) {
        console.error(`❌ Error creating ${user.email}:`, error.message);
      }
    }
  }
  
  // Fix users in Supabase Auth but not in database
  if (fixDatabase && analysis.orphanedInAuth.length > 0) {
    console.log('\n🔧 Removing orphaned users from Supabase Auth...');
    
    for (const user of analysis.orphanedInAuth) {
      try {
        const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);
        
        if (error) {
          console.error(`❌ Failed to delete ${user.email} from Supabase Auth:`, error.message);
        } else {
          console.log(`✅ Deleted ${user.email} from Supabase Auth`);
        }
      } catch (error) {
        console.error(`❌ Error deleting ${user.email}:`, error.message);
      }
    }
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--fix-database') && !args.includes('--fix-auth');
  const fixDatabase = args.includes('--fix-database');
  const fixAuth = args.includes('--fix-auth');
  
  console.log('🧹 Orphaned Users Cleanup Script\n');
  
  try {
    await fixOrphanedUsers({
      dryRun,
      fixDatabase,
      fixAuth
    });
    
    console.log('\n✅ Cleanup completed!');
  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  findOrphanedUsers,
  fixOrphanedUsers
};
