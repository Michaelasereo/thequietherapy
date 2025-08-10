require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

class AuthManager {
  constructor() {
    this.currentUser = null;
    this.isAuthenticated = false;
  }

  // Initialize auth manager
  async init() {
    console.log('🔐 Initializing Auth Manager...');
    
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.log('ℹ️  No authenticated user found');
        this.isAuthenticated = false;
        this.currentUser = null;
        return false;
      }

      if (user) {
        await this.loadUserProfile(user.id);
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Auth initialization failed:', error);
      return false;
    }
  }

  // Load user profile from users table
  async loadUserProfile(userId) {
    try {
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ Failed to load user profile:', error.message);
        return null;
      }

      this.currentUser = profile;
      this.isAuthenticated = true;
      console.log('✅ User profile loaded:', profile.full_name);
      return profile;
    } catch (error) {
      console.error('❌ Profile loading failed:', error);
      return null;
    }
  }

  // Register new user
  async register(userData) {
    console.log('🔐 Registering new user...');
    
    try {
      // Validate input
      const validation = this.validateRegistrationData(userData);
      if (!validation.isValid) {
        return { success: false, error: validation.errors.join(', ') };
      }

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.full_name,
            user_type: userData.user_type || 'individual'
          }
        }
      });

      if (authError) {
        return { success: false, error: authError.message };
      }

      if (!authData.user) {
        return { success: false, error: 'Failed to create user account' };
      }

      // Create user profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: userData.email,
          full_name: userData.full_name,
          user_type: userData.user_type || 'individual',
          is_verified: false,
          is_active: true,
          credits: 0,
          package_type: 'Basic'
        })
        .select()
        .single();

      if (profileError) {
        return { success: false, error: profileError.message };
      }

      this.currentUser = profile;
      this.isAuthenticated = true;

      console.log('✅ User registered successfully!');
      return { success: true, user: profile };
    } catch (error) {
      console.error('❌ Registration failed:', error);
      return { success: false, error: 'Registration failed' };
    }
  }

  // Sign in user
  async signIn(email, password) {
    console.log('🔐 Signing in user...');
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data.user) {
        return { success: false, error: 'Invalid credentials' };
      }

      // Load user profile
      const profile = await this.loadUserProfile(data.user.id);
      if (!profile) {
        return { success: false, error: 'Failed to load user profile' };
      }

      console.log('✅ User signed in successfully!');
      return { success: true, user: profile };
    } catch (error) {
      console.error('❌ Sign in failed:', error);
      return { success: false, error: 'Sign in failed' };
    }
  }

  // Sign out user
  async signOut() {
    console.log('🔐 Signing out user...');
    
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        return { success: false, error: error.message };
      }

      this.currentUser = null;
      this.isAuthenticated = false;

      console.log('✅ User signed out successfully!');
      return { success: true };
    } catch (error) {
      console.error('❌ Sign out failed:', error);
      return { success: false, error: 'Sign out failed' };
    }
  }

  // Update user profile
  async updateProfile(updates) {
    if (!this.isAuthenticated || !this.currentUser) {
      return { success: false, error: 'No authenticated user' };
    }

    console.log('🔐 Updating user profile...');
    
    try {
      const { data: updatedProfile, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', this.currentUser.id)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      this.currentUser = updatedProfile;
      console.log('✅ Profile updated successfully!');
      return { success: true, user: updatedProfile };
    } catch (error) {
      console.error('❌ Profile update failed:', error);
      return { success: false, error: 'Profile update failed' };
    }
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Check if user is authenticated
  getAuthStatus() {
    return this.isAuthenticated;
  }

  // Validate registration data
  validateRegistrationData(userData) {
    const errors = [];

    if (!userData.email || !this.isValidEmail(userData.email)) {
      errors.push('Valid email is required');
    }

    if (!userData.password || !this.isValidPassword(userData.password)) {
      errors.push('Password must be at least 8 characters with uppercase, lowercase, and number');
    }

    if (!userData.full_name || userData.full_name.trim().length < 2) {
      errors.push('Full name is required (minimum 2 characters)');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Validate email format
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validate password strength
  isValidPassword(password) {
    return password.length >= 8 && 
           /[A-Z]/.test(password) && 
           /[a-z]/.test(password) && 
           /\d/.test(password);
  }
}

// Export the AuthManager class
module.exports = { AuthManager };

// Test function
async function testAuthManager() {
  console.log('🧪 Testing Auth Manager...\n');

  const authManager = new AuthManager();
  
  // Initialize
  await authManager.init();

  // Test sign out
  const signOutResult = await authManager.signOut();
  console.log('Sign out result:', signOutResult);

  console.log('\n🎉 Auth Manager test completed!');
}

// Run test if this file is executed directly
if (require.main === module) {
  testAuthManager();
}
