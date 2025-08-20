import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export interface UserSyncData {
  id?: string
  email: string
  full_name?: string
  user_type: 'individual' | 'therapist' | 'partner' | 'admin'
  phone?: string
  metadata?: Record<string, any>
}

/**
 * Sync a user to Supabase auth.users table
 * This allows you to see users in the Supabase dashboard
 */
export async function syncUserToSupabaseAuth(userData: UserSyncData) {
  try {
    console.log('🔄 Syncing user to Supabase auth:', { 
      email: userData.email, 
      user_type: userData.user_type 
    })

    // Check if user already exists in auth.users using the correct API
    const { data: existingAuthUser, error: checkError } = await supabase.auth.admin.listUsers()
    
    if (checkError) {
      console.error('❌ Error checking existing auth users:', checkError)
      return { success: false, error: 'Failed to check existing users' }
    }

    // Find user by email
    const existingUser = existingAuthUser.users.find(user => user.email === userData.email)

    if (existingUser) {
      console.log('✅ User already exists in Supabase auth:', existingUser.id)
      
      // Update user metadata if needed
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        existingUser.id,
        {
          user_metadata: {
            ...existingUser.user_metadata,
            user_type: userData.user_type,
            full_name: userData.full_name,
            phone: userData.phone,
            ...userData.metadata
          }
        }
      )

      if (updateError) {
        console.error('❌ Error updating auth user metadata:', updateError)
      } else {
        console.log('✅ Updated auth user metadata')
      }

      return { 
        success: true, 
        auth_user_id: existingUser.id,
        message: 'User already exists in Supabase auth'
      }
    }

    // Create new user in Supabase auth
    const { data: newAuthUser, error: createError } = await supabase.auth.admin.createUser({
      email: userData.email,
      email_confirm: true, // Auto-confirm email since we're using magic links
      user_metadata: {
        user_type: userData.user_type,
        full_name: userData.full_name,
        phone: userData.phone,
        ...userData.metadata
      },
      app_metadata: {
        user_type: userData.user_type,
        provider: 'custom_magic_link'
      }
    })

    if (createError) {
      console.error('❌ Error creating Supabase auth user:', createError)
      return { success: false, error: 'Failed to create Supabase auth user' }
    }

    console.log('✅ Successfully created Supabase auth user:', newAuthUser.user.id)

    return { 
      success: true, 
      auth_user_id: newAuthUser.user.id,
      message: 'User created in Supabase auth'
    }

  } catch (error) {
    console.error('❌ Error in syncUserToSupabaseAuth:', error)
    return { success: false, error: 'Internal server error' }
  }
}

/**
 * Update user in Supabase auth when custom user data changes
 */
export async function updateSupabaseAuthUser(email: string, updates: Partial<UserSyncData>) {
  try {
    console.log('🔄 Updating Supabase auth user:', { email, updates })

    // Get all auth users and find by email
    const { data: authUsers, error: getUserError } = await supabase.auth.admin.listUsers()
    
    if (getUserError) {
      console.error('❌ Error getting auth users:', getUserError)
      return { success: false, error: 'Failed to access Supabase auth users' }
    }

    const authUser = authUsers.users.find(user => user.email === email)

    if (!authUser) {
      console.log('❌ Auth user not found, creating new one...')
      return syncUserToSupabaseAuth({ email, ...updates } as UserSyncData)
    }

    // Update the auth user
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      authUser.id,
      {
        user_metadata: {
          ...authUser.user_metadata,
          ...updates,
          user_type: updates.user_type || authUser.user_metadata?.user_type
        }
      }
    )

    if (updateError) {
      console.error('❌ Error updating auth user:', updateError)
      return { success: false, error: 'Failed to update Supabase auth user' }
    }

    console.log('✅ Successfully updated Supabase auth user:', authUser.id)

    return { 
      success: true, 
      auth_user_id: authUser.id,
      message: 'User updated in Supabase auth'
    }

  } catch (error) {
    console.error('❌ Error in updateSupabaseAuthUser:', error)
    return { success: false, error: 'Internal server error' }
  }
}

/**
 * Delete user from Supabase auth when custom user is deleted
 */
export async function deleteSupabaseAuthUser(email: string) {
  try {
    console.log('🗑️ Deleting Supabase auth user:', email)

    // Get all auth users and find by email
    const { data: authUsers, error: getUserError } = await supabase.auth.admin.listUsers()
    
    if (getUserError) {
      console.error('❌ Error getting auth users:', getUserError)
      return { success: false, error: 'Failed to access Supabase auth users' }
    }

    const authUser = authUsers.users.find(user => user.email === email)

    if (!authUser) {
      console.log('✅ Auth user not found, nothing to delete')
      return { success: true, message: 'User not found in Supabase auth' }
    }

    // Delete the auth user
    const { error: deleteError } = await supabase.auth.admin.deleteUser(authUser.id)

    if (deleteError) {
      console.error('❌ Error deleting auth user:', deleteError)
      return { success: false, error: 'Failed to delete Supabase auth user' }
    }

    console.log('✅ Successfully deleted Supabase auth user:', authUser.id)

    return { 
      success: true, 
      auth_user_id: authUser.id,
      message: 'User deleted from Supabase auth'
    }

  } catch (error) {
    console.error('❌ Error in deleteSupabaseAuthUser:', error)
    return { success: false, error: 'Internal server error' }
  }
}

/**
 * Get all users from Supabase auth (for admin purposes)
 */
export async function getAllSupabaseAuthUsers() {
  try {
    console.log('📋 Getting all Supabase auth users...')

    const { data: users, error } = await supabase.auth.admin.listUsers()

    if (error) {
      console.error('❌ Error getting auth users:', error)
      return { success: false, error: 'Failed to get Supabase auth users' }
    }

    console.log(`✅ Found ${users.users.length} Supabase auth users`)

    return { 
      success: true, 
      users: users.users,
      count: users.users.length
    }

  } catch (error) {
    console.error('❌ Error in getAllSupabaseAuthUsers:', error)
    return { success: false, error: 'Internal server error' }
  }
}

/**
 * Sync all existing custom users to Supabase auth
 */
export async function syncAllUsersToSupabaseAuth() {
  try {
    console.log('🔄 Syncing all custom users to Supabase auth...')

    // Get all users from your custom users table
    const { data: customUsers, error: customUsersError } = await supabase
      .from('users')
      .select('*')

    if (customUsersError) {
      console.error('❌ Error getting custom users:', customUsersError)
      return { success: false, error: 'Failed to get custom users' }
    }

    console.log(`📋 Found ${customUsers.length} custom users to sync`)

    const results = []
    let successCount = 0
    let errorCount = 0

    for (const user of customUsers) {
      const result = await syncUserToSupabaseAuth({
        email: user.email,
        full_name: user.full_name,
        user_type: user.user_type,
        phone: user.phone,
        metadata: {
          custom_user_id: user.id,
          created_at: user.created_at,
          last_login_at: user.last_login_at
        }
      })

      results.push({ user_id: user.id, email: user.email, result })
      
      if (result.success) {
        successCount++
      } else {
        errorCount++
      }
    }

    console.log(`✅ Sync completed: ${successCount} successful, ${errorCount} failed`)

    return { 
      success: true, 
      total: customUsers.length,
      successful: successCount,
      failed: errorCount,
      results
    }

  } catch (error) {
    console.error('❌ Error in syncAllUsersToSupabaseAuth:', error)
    return { success: false, error: 'Internal server error' }
  }
}
