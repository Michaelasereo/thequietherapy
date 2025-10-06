import { createClient } from '@supabase/supabase-js';
import { createServerClient } from './supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export interface UserSyncData {
  id: string;
  email: string;
  full_name: string | null;
  user_type: 'individual' | 'therapist' | 'partner' | 'admin';
}

/**
 * Sync a single user with Supabase Auth
 */
export async function syncUserToSupabaseAuth(userData: UserSyncData) {
  try {
    console.log('🔄 Syncing user to Supabase Auth:', userData.email);

    // Check if user exists in Supabase Auth
    const { data: existingAuthUser, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(userData.id);

    if (getUserError && getUserError.message !== 'User not found') {
      console.error('❌ Error checking existing auth user:', getUserError);
      return { success: false, error: getUserError.message };
    }

    if (existingAuthUser?.user) {
      // User exists in Supabase Auth - update metadata
      console.log('✅ User exists in Supabase Auth, updating metadata');
      
      const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        userData.id,
        {
          email: userData.email,
          user_metadata: {
            full_name: userData.full_name,
            user_type: userData.user_type,
            custom_user_id: userData.id,
            synced_at: new Date().toISOString()
          }
        }
      );

      if (updateError) {
        console.error('❌ Error updating Supabase Auth user:', updateError);
        return { success: false, error: updateError.message };
      }

      return { 
        success: true, 
        action: 'updated',
        auth_user_id: updatedUser.user.id 
      };
    } else {
      // User doesn't exist in Supabase Auth - create them
      console.log('👤 Creating new user in Supabase Auth');
      
      const { data: newAuthUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        id: userData.id, // Use the same ID from your database
        email: userData.email,
        email_confirm: true, // Auto-confirm since you're using magic links
        user_metadata: {
          full_name: userData.full_name,
          user_type: userData.user_type,
          custom_user_id: userData.id,
          synced_at: new Date().toISOString()
        }
      });

      if (createError) {
        console.error('❌ Error creating Supabase Auth user:', createError);
        return { success: false, error: createError.message };
      }

      return { 
        success: true, 
        action: 'created',
        auth_user_id: newAuthUser.user.id 
      };
    }
  } catch (error) {
    console.error('❌ syncUserToSupabaseAuth error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Create a new user in both your database and Supabase Auth
 */
export async function createUserWithSupabaseAuth(userData: Omit<UserSyncData, 'id'>) {
  try {
    console.log('👤 Creating new user with Supabase Auth sync:', userData.email);

    // Create user in Supabase Auth first
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      email_confirm: true, // Auto-confirm since you're using magic links
      user_metadata: {
        full_name: userData.full_name,
        user_type: userData.user_type,
        created_at: new Date().toISOString()
      }
    });

    if (authError) {
      console.error('❌ Supabase Auth creation error:', authError);
      return { success: false, error: authError.message };
    }

    const userId = authUser.user.id;

    // Now create user in your database with the same ID
    const supabase = createServerClient();
    
    // Set verification and active status based on user type
    // Therapists need manual approval, others can be auto-verified
    const isVerified = userData.user_type !== 'therapist'
    const isActive = userData.user_type !== 'therapist'
    
    const { error: dbError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email: userData.email,
        full_name: userData.full_name,
        user_type: userData.user_type,
        is_verified: isVerified,
        is_active: isActive,
        credits: userData.user_type === 'partner' ? 100 : 0, // Give partners some initial credits
        package_type: userData.user_type === 'partner' ? 'starter' : 'free'
      });

    if (dbError) {
      console.error('❌ Database user creation error:', dbError);
      // Try to clean up the Supabase Auth user if database creation fails
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return { success: false, error: dbError.message };
    }

    console.log('✅ User created successfully in both systems:', userId);
    return { 
      success: true, 
      user_id: userId,
      auth_user_id: authUser.user.id 
    };

  } catch (error) {
    console.error('❌ createUserWithSupabaseAuth error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Sync all users from your database to Supabase Auth
 */
export async function syncAllUsersToSupabaseAuth() {
  try {
    console.log('🔄 Starting bulk user sync to Supabase Auth...');

    const supabase = createServerClient();
    
    // Get all users from your database
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('id, email, full_name, user_type');

    if (fetchError) {
      console.error('❌ Error fetching users:', fetchError);
      return { success: false, error: fetchError.message };
    }

    if (!users || users.length === 0) {
      return { success: true, message: 'No users found to sync', syncedCount: 0 };
    }

    console.log(`📊 Found ${users.length} users to sync`);

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (const user of users) {
      const result = await syncUserToSupabaseAuth({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        user_type: user.user_type
      });

      results.push({
        userId: user.id,
        email: user.email,
        ...result
      });

      if (result.success) {
        successCount++;
      } else {
        errorCount++;
      }

      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`✅ Sync completed: ${successCount} successful, ${errorCount} errors`);

    return {
      success: true,
      totalUsers: users.length,
      successCount,
      errorCount,
      results
    };

  } catch (error) {
    console.error('❌ syncAllUsersToSupabaseAuth error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Check if a user exists in Supabase Auth
 */
export async function checkUserInSupabaseAuth(userId: string) {
  try {
    const { data: authUser, error } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    if (error && error.message !== 'User not found') {
      return { success: false, error: error.message };
    }

    return { 
      success: true, 
      exists: !!authUser?.user,
      user: authUser?.user || null 
    };
  } catch (error) {
    console.error('❌ checkUserInSupabaseAuth error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get all users from Supabase Auth
 */
export async function getAllSupabaseAuthUsers() {
  try {
    const { data: users, error } = await supabaseAdmin.auth.admin.listUsers();
    
    if (error) {
      console.error('❌ getAllSupabaseAuthUsers error:', error);
      return { success: false, error: error.message };
    }

    return { 
      success: true, 
      users: users?.users || [] 
    };
  } catch (error) {
    console.error('❌ getAllSupabaseAuthUsers error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}