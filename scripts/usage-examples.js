// User Authentication & Dashboard Usage Examples

require('dotenv').config({ path: '.env.local' });
const { AuthManager } = require('./auth-manager.js');
const { UserDashboard } = require('./user-dashboard.js');

// Example 1: User Registration
async function exampleUserRegistration() {
  console.log('📝 Example 1: User Registration');
  
  const authManager = new AuthManager();
  
  const userData = {
    email: 'newuser@example.com',
    password: 'SecurePassword123',
    full_name: 'John Doe',
    user_type: 'individual'
  };

  const result = await authManager.register(userData);
  
  if (result.success) {
    console.log('✅ Registration successful!');
    console.log('   User ID:', result.user.id);
    console.log('   Email:', result.user.email);
    console.log('   Credits:', result.user.credits);
  } else {
    console.log('❌ Registration failed:', result.error);
  }
}

// Example 2: User Login
async function exampleUserLogin() {
  console.log('\n📝 Example 2: User Login');
  
  const authManager = new AuthManager();
  
  const result = await authManager.signIn('newuser@example.com', 'SecurePassword123');
  
  if (result.success) {
    console.log('✅ Login successful!');
    console.log('   Welcome back,', result.user.full_name);
    console.log('   User type:', result.user.user_type);
  } else {
    console.log('❌ Login failed:', result.error);
  }
}

// Example 3: Dashboard Operations
async function exampleDashboardOperations() {
  console.log('\n📝 Example 3: Dashboard Operations');
  
  const dashboard = new UserDashboard();
  
  // Initialize dashboard (requires authentication)
  const initialized = await dashboard.init();
  
  if (!initialized) {
    console.log('❌ Dashboard requires authentication');
    return;
  }

  // Get user profile
  const profileResult = await dashboard.getUserProfile();
  if (profileResult.success) {
    console.log('✅ Profile loaded:', profileResult.profile.full_name);
  }

  // Get credits
  const creditsResult = await dashboard.getCredits();
  if (creditsResult.success) {
    console.log('✅ Credits:', creditsResult.credits);
    console.log('✅ Package:', creditsResult.packageType);
  }

  // Get dashboard summary
  const summaryResult = await dashboard.getDashboardSummary();
  if (summaryResult.success) {
    console.log('✅ Dashboard summary loaded');
    console.log('   User:', summaryResult.summary.user.full_name);
    console.log('   Credits:', summaryResult.summary.credits);
    console.log('   Package:', summaryResult.summary.packageType);
  }
}

// Example 4: Credit Management
async function exampleCreditManagement() {
  console.log('\n📝 Example 4: Credit Management');
  
  const dashboard = new UserDashboard();
  await dashboard.init();

  // Add credits
  const addResult = await dashboard.addCredits(10);
  if (addResult.success) {
    console.log('✅ Credits added! New balance:', addResult.newCredits);
  }

  // Check if user has enough credits
  const hasEnough = await dashboard.hasEnoughCredits(5);
  console.log('✅ Has enough credits for 5:', hasEnough);

  // Deduct credits
  const deductResult = await dashboard.deductCredits(3);
  if (deductResult.success) {
    console.log('✅ Credits deducted! New balance:', deductResult.newCredits);
  }
}

// Example 5: Profile Management
async function exampleProfileManagement() {
  console.log('\n📝 Example 5: Profile Management');
  
  const dashboard = new UserDashboard();
  await dashboard.init();

  // Update profile
  const updateResult = await dashboard.updateProfile({
    full_name: 'John Updated Doe',
    package_type: 'Standard'
  });

  if (updateResult.success) {
    console.log('✅ Profile updated!');
    console.log('   New name:', updateResult.user.full_name);
    console.log('   New package:', updateResult.user.package_type);
  }
}

// Example 6: Package Information
async function examplePackageInfo() {
  console.log('\n📝 Example 6: Package Information');
  
  const dashboard = new UserDashboard();
  await dashboard.init();

  const packageResult = await dashboard.getPackageInfo();
  
  if (packageResult.success) {
    console.log('✅ Package info loaded');
    console.log('   Type:', packageResult.packageInfo.type);
    console.log('   Credits:', packageResult.packageInfo.credits);
    console.log('   Features:', packageResult.packageInfo.features.features.join(', '));
  }
}

// Example 7: User Logout
async function exampleUserLogout() {
  console.log('\n📝 Example 7: User Logout');
  
  const dashboard = new UserDashboard();
  
  const result = await dashboard.signOut();
  
  if (result.success) {
    console.log('✅ User logged out successfully!');
  } else {
    console.log('❌ Logout failed:', result.error);
  }
}

// Run examples (commented out to avoid actual operations)
console.log('🚀 User Authentication & Dashboard Usage Examples\n');

console.log('📋 Available Examples:');
console.log('1. exampleUserRegistration() - Register a new user');
console.log('2. exampleUserLogin() - Login with credentials');
console.log('3. exampleDashboardOperations() - Access dashboard features');
console.log('4. exampleCreditManagement() - Manage user credits');
console.log('5. exampleProfileManagement() - Update user profile');
console.log('6. examplePackageInfo() - Get package information');
console.log('7. exampleUserLogout() - Logout user');
console.log('\n💡 To run examples, uncomment the function calls below:');

// Uncomment these lines to run the examples:
// exampleUserRegistration();
// exampleUserLogin();
// exampleDashboardOperations();
// exampleCreditManagement();
// exampleProfileManagement();
// examplePackageInfo();
// exampleUserLogout();
