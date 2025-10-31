/**
 * Clear All Supabase Auth Users
 * 
 * This script deletes ALL users from Supabase Auth using the Admin API.
 * ⚠️  WARNING: This action is IRREVERSIBLE
 * 
 * Usage:
 *   node scripts/clear-all-auth-users.js
 * 
 * Requires:
 *   - NEXT_PUBLIC_SUPABASE_URL in .env.local
 *   - SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  console.error('Make sure your .env.local file exists and has these values');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function clearAllAuthUsers() {
  console.log('🧹 Clearing all Supabase Auth users...\n');

  try {
    // Step 1: List all users
    console.log('📊 Fetching all users from Supabase Auth...');
    let allUsers = [];
    let page = 1;
    const perPage = 1000; // Supabase allows up to 1000 per page
    
    while (true) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({
        page: page,
        perPage: perPage
      });

      if (error) {
        console.error('❌ Error listing users:', error);
        throw error;
      }

      if (!data?.users || data.users.length === 0) {
        break;
      }

      allUsers = allUsers.concat(data.users);
      console.log(`   Fetched ${data.users.length} users (Total: ${allUsers.length})`);

      if (data.users.length < perPage) {
        break; // No more users
      }

      page++;
    }

    const totalUsers = allUsers.length;
    console.log(`\n📊 Found ${totalUsers} user(s) to delete:\n`);

    if (totalUsers === 0) {
      console.log('✅ No users to clear');
      return;
    }

    // Show first 10 users as preview
    const previewCount = Math.min(10, totalUsers);
    allUsers.slice(0, previewCount).forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email || user.id} (${user.id})`);
    });
    if (totalUsers > previewCount) {
      console.log(`   ... and ${totalUsers - previewCount} more`);
    }

    console.log('\n🗑️  Starting deletion...\n');

    // Step 2: Delete all users
    let deletedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < allUsers.length; i++) {
      const user = allUsers[i];
      
      try {
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

        if (deleteError) {
          console.error(`   ❌ Error deleting ${user.email || user.id}:`, deleteError.message);
          errorCount++;
        } else {
          deletedCount++;
          if ((i + 1) % 10 === 0 || i === allUsers.length - 1) {
            console.log(`   ✅ Deleted ${i + 1}/${totalUsers} users...`);
          }
        }

        // Add small delay to avoid rate limiting
        if (i < allUsers.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error(`   ❌ Error deleting ${user.email || user.id}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📊 Deletion Summary:');
    console.log(`   ✅ Successfully deleted: ${deletedCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📦 Total processed: ${totalUsers}`);

    // Step 3: Verify deletion
    console.log('\n🔍 Verifying deletion...');
    const { data: verifyData, error: verifyError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1
    });

    if (verifyError) {
      console.error('⚠️  Error verifying deletion:', verifyError.message);
    } else {
      const remainingCount = verifyData?.users?.length || 0;
      if (remainingCount === 0) {
        console.log('✅ All Supabase Auth users cleared successfully!');
      } else {
        console.warn(`⚠️  ${remainingCount} user(s) still remain (may need another run)`);
      }
    }

  } catch (error) {
    console.error('❌ Error clearing auth users:', error);
    process.exit(1);
  }
}

// Confirm before running
console.log('⚠️  WARNING: This will delete ALL users from Supabase Auth!');
console.log('⚠️  This action is IRREVERSIBLE!\n');

// For safety, require confirmation (uncomment to enable)
// const readline = require('readline');
// const rl = readline.createInterface({
//   input: process.stdin,
//   output: process.stdout
// });

// rl.question('Type "DELETE ALL" to confirm: ', (answer) => {
//   if (answer === 'DELETE ALL') {
//     rl.close();
//     clearAllAuthUsers()
//       .then(() => {
//         console.log('\n✅ Script completed!');
//         process.exit(0);
//       })
//       .catch((error) => {
//         console.error('❌ Script failed:', error);
//         process.exit(1);
//       });
//   } else {
//     console.log('❌ Cancelled - deletion aborted');
//     rl.close();
//     process.exit(0);
//   }
// });

// Run immediately (for automation)
clearAllAuthUsers()
  .then(() => {
    console.log('\n✅ Script completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

