require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { AuthManager } = require('./auth-manager.js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

class UserDashboard {
  constructor() {
    this.authManager = new AuthManager();
    this.userId = null;
  }

  // Initialize dashboard
  async init() {
    console.log('📊 Initializing User Dashboard...');
    
    try {
      // Initialize auth manager
      await this.authManager.init();
      
      if (!this.authManager.getAuthStatus()) {
        console.log('❌ User not authenticated');
        return false;
      }

      const user = this.authManager.getCurrentUser();
      this.userId = user.id;
      
      console.log('✅ Dashboard initialized for user:', user.full_name);
      return true;
    } catch (error) {
      console.error('❌ Dashboard initialization failed:', error);
      return false;
    }
  }

  // Get user profile
  async getUserProfile() {
    if (!this.userId) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', this.userId)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, profile };
    } catch (error) {
      return { success: false, error: 'Failed to fetch profile' };
    }
  }

  // Update user profile
  async updateProfile(updates) {
    return await this.authManager.updateProfile(updates);
  }

  // Get user credits
  async getCredits() {
    if (!this.userId) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      const { data: profile, error } = await supabase
        .from('users')
        .select('credits, package_type')
        .eq('id', this.userId)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { 
        success: true, 
        credits: profile.credits,
        packageType: profile.package_type
      };
    } catch (error) {
      return { success: false, error: 'Failed to fetch credits' };
    }
  }

  // Add credits to user
  async addCredits(amount) {
    if (!this.userId) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      const { data: updatedProfile, error } = await supabase
        .from('users')
        .update({ 
          credits: supabase.rpc('increment_credits', { amount }) 
        })
        .eq('id', this.userId)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      // Update local user data
      this.authManager.currentUser = updatedProfile;

      return { 
        success: true, 
        newCredits: updatedProfile.credits 
      };
    } catch (error) {
      return { success: false, error: 'Failed to add credits' };
    }
  }

  // Deduct credits from user
  async deductCredits(amount) {
    if (!this.userId) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      const { data: updatedProfile, error } = await supabase
        .from('users')
        .update({ 
          credits: supabase.rpc('decrement_credits', { amount }) 
        })
        .eq('id', this.userId)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      // Update local user data
      this.authManager.currentUser = updatedProfile;

      return { 
        success: true, 
        newCredits: updatedProfile.credits 
      };
    } catch (error) {
      return { success: false, error: 'Failed to deduct credits' };
    }
  }

  // Get user statistics
  async getUserStats() {
    if (!this.userId) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', this.userId)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      // Calculate some basic stats
      const stats = {
        totalCredits: profile.credits,
        packageType: profile.package_type,
        isVerified: profile.is_verified,
        isActive: profile.is_active,
        userType: profile.user_type,
        memberSince: profile.created_at,
        lastUpdated: profile.updated_at
      };

      return { success: true, stats };
    } catch (error) {
      return { success: false, error: 'Failed to fetch user stats' };
    }
  }

  // Get dashboard summary
  async getDashboardSummary() {
    if (!this.userId) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      const [profileResult, creditsResult, statsResult] = await Promise.all([
        this.getUserProfile(),
        this.getCredits(),
        this.getUserStats()
      ]);

      if (!profileResult.success || !creditsResult.success || !statsResult.success) {
        return { success: false, error: 'Failed to fetch dashboard data' };
      }

      const summary = {
        user: profileResult.profile,
        credits: creditsResult.credits,
        packageType: creditsResult.packageType,
        stats: statsResult.stats,
        lastUpdated: new Date().toISOString()
      };

      return { success: true, summary };
    } catch (error) {
      return { success: false, error: 'Failed to generate dashboard summary' };
    }
  }

  // Check if user has enough credits
  async hasEnoughCredits(requiredAmount) {
    const creditsResult = await this.getCredits();
    
    if (!creditsResult.success) {
      return false;
    }

    return creditsResult.credits >= requiredAmount;
  }

  // Get user's package information
  async getPackageInfo() {
    const creditsResult = await this.getCredits();
    
    if (!creditsResult.success) {
      return { success: false, error: 'Failed to fetch package info' };
    }

    const packageInfo = {
      type: creditsResult.packageType,
      credits: creditsResult.credits,
      features: this.getPackageFeatures(creditsResult.packageType)
    };

    return { success: true, packageInfo };
  }

  // Get package features based on type
  getPackageFeatures(packageType) {
    const features = {
      'Basic': {
        maxCredits: 10,
        features: ['Basic therapy sessions', 'Email support']
      },
      'Standard': {
        maxCredits: 20,
        features: ['Standard therapy sessions', 'Priority support', 'Session notes']
      },
      'Pro': {
        maxCredits: -1, // Unlimited
        features: ['Unlimited sessions', 'Premium support', 'Advanced features', 'Priority booking']
      }
    };

    return features[packageType] || features['Basic'];
  }

  // Sign out user
  async signOut() {
    return await this.authManager.signOut();
  }

  // Get current user
  getCurrentUser() {
    return this.authManager.getCurrentUser();
  }

  // Check authentication status
  isAuthenticated() {
    return this.authManager.getAuthStatus();
  }
}

// Export the UserDashboard class
module.exports = { UserDashboard };

// Test function
async function testUserDashboard() {
  console.log('🧪 Testing User Dashboard...\n');

  const dashboard = new UserDashboard();
  
  // Initialize dashboard
  const initialized = await dashboard.init();
  
  if (!initialized) {
    console.log('❌ Dashboard initialization failed - user not authenticated');
    console.log('📋 To test with authentication, you need to sign in first');
    return;
  }

  // Test dashboard functions
  console.log('\n1️⃣ Testing user profile...');
  const profileResult = await dashboard.getUserProfile();
  console.log('Profile result:', profileResult.success ? '✅ Success' : '❌ Failed');

  console.log('\n2️⃣ Testing credits...');
  const creditsResult = await dashboard.getCredits();
  console.log('Credits result:', creditsResult.success ? '✅ Success' : '❌ Failed');

  console.log('\n3️⃣ Testing user stats...');
  const statsResult = await dashboard.getUserStats();
  console.log('Stats result:', statsResult.success ? '✅ Success' : '❌ Failed');

  console.log('\n4️⃣ Testing dashboard summary...');
  const summaryResult = await dashboard.getDashboardSummary();
  console.log('Summary result:', summaryResult.success ? '✅ Success' : '❌ Failed');

  console.log('\n🎉 User Dashboard test completed!');
}

// Run test if this file is executed directly
if (require.main === module) {
  testUserDashboard();
}
