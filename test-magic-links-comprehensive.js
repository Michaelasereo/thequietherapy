#!/usr/bin/env node

/**
 * Comprehensive Magic Link Testing Script
 * Tests magic link generation and dashboard redirection for all user types
 */

const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = process.env.APP_URL || 'http://localhost:3000';
const TEST_EMAILS = {
  individual: 'test.individual@example.com',
  therapist: 'test.therapist@example.com', 
  partner: 'test.partner@example.com',
  admin: 'test.admin@example.com'
};

// Test results storage
const testResults = {
  magicLinkGeneration: {},
  dashboardRedirection: {},
  overall: { passed: 0, failed: 0, total: 0 }
};

// Utility function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;
    
    const req = client.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: jsonData, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Test magic link generation for a specific user type
async function testMagicLinkGeneration(userType) {
  console.log(`\n🔑 Testing magic link generation for ${userType}...`);
  
  const email = TEST_EMAILS[userType];
  const url = `${BASE_URL}/api/auth/send-magic-link`;
  
  const requestBody = JSON.stringify({
    email: email,
    user_type: userType,
    type: 'login'
  });
  
  try {
    const response = await makeRequest(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestBody)
      },
      body: requestBody
    });
    
    const result = {
      userType,
      email,
      status: response.status,
      success: response.status === 200 && response.data.success,
      message: response.data.message || response.data.error,
      timestamp: new Date().toISOString()
    };
    
    if (result.success) {
      console.log(`✅ Magic link sent successfully for ${userType}`);
      testResults.overall.passed++;
    } else {
      console.log(`❌ Magic link failed for ${userType}: ${result.message}`);
      testResults.overall.failed++;
    }
    
    testResults.magicLinkGeneration[userType] = result;
    testResults.overall.total++;
    
    return result;
  } catch (error) {
    console.log(`❌ Network error for ${userType}: ${error.message}`);
    const result = {
      userType,
      email,
      status: 'error',
      success: false,
      message: error.message,
      timestamp: new Date().toISOString()
    };
    
    testResults.magicLinkGeneration[userType] = result;
    testResults.overall.failed++;
    testResults.overall.total++;
    
    return result;
  }
}

// Test dashboard redirection for a specific user type
async function testDashboardRedirection(userType) {
  console.log(`\n🏠 Testing dashboard redirection for ${userType}...`);
  
  const expectedPaths = {
    individual: '/dashboard',
    therapist: '/therapist/dashboard', 
    partner: '/partner/dashboard',
    admin: '/admin/dashboard'
  };
  
  const expectedPath = expectedPaths[userType];
  
  try {
    // Test the dashboard endpoint
    const dashboardUrl = `${BASE_URL}${expectedPath}`;
    const response = await makeRequest(dashboardUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'MagicLinkTest/1.0'
      }
    });
    
    const result = {
      userType,
      expectedPath,
      status: response.status,
      success: response.status === 200,
      redirected: response.status >= 300 && response.status < 400,
      timestamp: new Date().toISOString()
    };
    
    if (result.success) {
      console.log(`✅ Dashboard accessible for ${userType} at ${expectedPath}`);
      testResults.overall.passed++;
    } else if (result.redirected) {
      console.log(`🔄 Dashboard redirected for ${userType} (status: ${response.status})`);
      testResults.overall.passed++;
    } else {
      console.log(`❌ Dashboard not accessible for ${userType}: ${response.status}`);
      testResults.overall.failed++;
    }
    
    testResults.dashboardRedirection[userType] = result;
    testResults.overall.total++;
    
    return result;
  } catch (error) {
    console.log(`❌ Network error testing dashboard for ${userType}: ${error.message}`);
    const result = {
      userType,
      expectedPath,
      status: 'error',
      success: false,
      message: error.message,
      timestamp: new Date().toISOString()
    };
    
    testResults.dashboardRedirection[userType] = result;
    testResults.overall.failed++;
    testResults.overall.total++;
    
    return result;
  }
}

// Test login page accessibility for each user type
async function testLoginPageAccess(userType) {
  console.log(`\n🔐 Testing login page access for ${userType}...`);
  
  const loginUrl = `${BASE_URL}/login?user_type=${userType}`;
  
  try {
    const response = await makeRequest(loginUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'MagicLinkTest/1.0'
      }
    });
    
    const result = {
      userType,
      url: loginUrl,
      status: response.status,
      success: response.status === 200,
      timestamp: new Date().toISOString()
    };
    
    if (result.success) {
      console.log(`✅ Login page accessible for ${userType}`);
    } else {
      console.log(`❌ Login page not accessible for ${userType}: ${response.status}`);
    }
    
    return result;
  } catch (error) {
    console.log(`❌ Network error testing login page for ${userType}: ${error.message}`);
    return {
      userType,
      url: loginUrl,
      status: 'error',
      success: false,
      message: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

// Test the magic link verification endpoint
async function testMagicLinkVerification() {
  console.log(`\n🔍 Testing magic link verification endpoint...`);
  
  const verificationUrl = `${BASE_URL}/api/auth/verify-magic-link`;
  
  try {
    // Test with invalid token
    const response = await makeRequest(`${verificationUrl}?token=invalid_token&auth_type=individual`, {
      method: 'GET',
      headers: {
        'User-Agent': 'MagicLinkTest/1.0'
      }
    });
    
    const result = {
      endpoint: verificationUrl,
      status: response.status,
      success: response.status === 302 || response.status === 400, // Should redirect or return error
      timestamp: new Date().toISOString()
    };
    
    if (result.success) {
      console.log(`✅ Magic link verification endpoint responding correctly`);
    } else {
      console.log(`❌ Magic link verification endpoint issue: ${response.status}`);
    }
    
    return result;
  } catch (error) {
    console.log(`❌ Network error testing magic link verification: ${error.message}`);
    return {
      endpoint: verificationUrl,
      status: 'error',
      success: false,
      message: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

// Generate comprehensive test report
function generateTestReport() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 COMPREHENSIVE MAGIC LINK TEST REPORT');
  console.log('='.repeat(80));
  
  console.log(`\n📈 Overall Results:`);
  console.log(`   ✅ Passed: ${testResults.overall.passed}`);
  console.log(`   ❌ Failed: ${testResults.overall.failed}`);
  console.log(`   📊 Total: ${testResults.overall.total}`);
  console.log(`   📊 Success Rate: ${((testResults.overall.passed / testResults.overall.total) * 100).toFixed(1)}%`);
  
  console.log(`\n🔑 Magic Link Generation Results:`);
  Object.entries(testResults.magicLinkGeneration).forEach(([userType, result]) => {
    const status = result.success ? '✅' : '❌';
    console.log(`   ${status} ${userType}: ${result.status} - ${result.message}`);
  });
  
  console.log(`\n🏠 Dashboard Redirection Results:`);
  Object.entries(testResults.dashboardRedirection).forEach(([userType, result]) => {
    const status = result.success ? '✅' : '❌';
    console.log(`   ${status} ${userType}: ${result.expectedPath} (${result.status})`);
  });
  
  console.log(`\n📋 Test Summary:`);
  console.log(`   • Individual users: ${BASE_URL}/login?user_type=individual → ${BASE_URL}/dashboard`);
  console.log(`   • Therapist users: ${BASE_URL}/login?user_type=therapist → ${BASE_URL}/therapist/dashboard`);
  console.log(`   • Partner users: ${BASE_URL}/login?user_type=partner → ${BASE_URL}/partner/dashboard`);
  console.log(`   • Admin users: ${BASE_URL}/login?user_type=admin → ${BASE_URL}/admin/dashboard`);
  
  console.log(`\n🔧 Manual Testing Steps:`);
  console.log(`   1. Open ${BASE_URL}/login?user_type=individual`);
  console.log(`   2. Enter email: ${TEST_EMAILS.individual}`);
  console.log(`   3. Click "Send Magic Link"`);
  console.log(`   4. Check email and click the magic link`);
  console.log(`   5. Verify redirection to ${BASE_URL}/dashboard`);
  console.log(`   6. Repeat for therapist, partner, and admin user types`);
  
  console.log('\n' + '='.repeat(80));
}

// Main test execution
async function runComprehensiveTests() {
  console.log('🚀 Starting Comprehensive Magic Link Testing');
  console.log(`📍 Testing against: ${BASE_URL}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
  
  // Test magic link generation for all user types
  console.log('\n🔑 PHASE 1: Testing Magic Link Generation');
  for (const userType of ['individual', 'therapist', 'partner', 'admin']) {
    await testMagicLinkGeneration(userType);
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Test dashboard redirection for all user types
  console.log('\n🏠 PHASE 2: Testing Dashboard Redirection');
  for (const userType of ['individual', 'therapist', 'partner', 'admin']) {
    await testDashboardRedirection(userType);
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Test login page access for all user types
  console.log('\n🔐 PHASE 3: Testing Login Page Access');
  for (const userType of ['individual', 'therapist', 'partner', 'admin']) {
    await testLoginPageAccess(userType);
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Test magic link verification endpoint
  console.log('\n🔍 PHASE 4: Testing Magic Link Verification');
  await testMagicLinkVerification();
  
  // Generate comprehensive report
  generateTestReport();
  
  console.log(`\n⏰ Completed at: ${new Date().toISOString()}`);
  
  // Exit with appropriate code
  process.exit(testResults.overall.failed > 0 ? 1 : 0);
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Magic Link Testing Script

Usage: node test-magic-links-comprehensive.js [options]

Options:
  --url <url>     Set the base URL to test against (default: http://localhost:3000)
  --help, -h      Show this help message

Environment Variables:
  APP_URL         Base URL for the application (overrides --url)

Examples:
  node test-magic-links-comprehensive.js
  node test-magic-links-comprehensive.js --url http://localhost:3001
  APP_URL=https://myapp.com node test-magic-links-comprehensive.js
`);
  process.exit(0);
}

// Parse command line arguments
const urlIndex = process.argv.indexOf('--url');
if (urlIndex !== -1 && process.argv[urlIndex + 1]) {
  process.env.APP_URL = process.argv[urlIndex + 1];
}

// Run the tests
runComprehensiveTests().catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});
