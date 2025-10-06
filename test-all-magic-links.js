#!/usr/bin/env node

/**
 * Comprehensive Magic Link Testing Suite
 * Tests all magic link functionality for all user types
 * Handles rate limiting and provides detailed diagnostics
 */

const http = require('http');
const https = require('https');
const { randomBytes } = require('crypto');

// Configuration
const BASE_URL = process.env.APP_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 30000; // 30 seconds
const RATE_LIMIT_DELAY = 2000; // 2 seconds between requests

// Test results storage
const testResults = {
  server: { status: 'pending', details: {} },
  environment: { status: 'pending', details: {} },
  magicLinkGeneration: {},
  magicLinkVerification: {},
  dashboardRedirection: {},
  emailDelivery: {},
  overall: { passed: 0, failed: 0, total: 0, warnings: 0 }
};

// Generate unique test emails to avoid rate limiting
function generateTestEmail(userType) {
  const timestamp = Date.now();
  const random = randomBytes(4).toString('hex');
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'protonmail.com'];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  return `test.${userType}.${timestamp}.${random}@${domain}`;
}

// Utility function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;
    
    const req = client.request(url, {
      timeout: TEST_TIMEOUT,
      ...options
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({ 
            status: res.statusCode, 
            data: jsonData, 
            headers: res.headers,
            rawData: data
          });
        } catch (e) {
          resolve({ 
            status: res.statusCode, 
            data: data, 
            headers: res.headers,
            rawData: data,
            parseError: e.message
          });
        }
      });
    });
    
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Test server connectivity and basic functionality
async function testServerConnectivity() {
  console.log('\n🖥️  Testing server connectivity...');
  
  try {
    const response = await makeRequest(BASE_URL, { method: 'GET' });
    
    testResults.server = {
      status: response.status === 200 ? 'passed' : 'failed',
      details: {
        url: BASE_URL,
        statusCode: response.status,
        responseTime: Date.now(),
        accessible: response.status === 200
      }
    };
    
    if (response.status === 200) {
      console.log('✅ Server is running and accessible');
      testResults.overall.passed++;
    } else {
      console.log(`❌ Server returned status ${response.status}`);
      testResults.overall.failed++;
    }
    
    testResults.overall.total++;
    
  } catch (error) {
    testResults.server = {
      status: 'failed',
      details: {
        url: BASE_URL,
        error: error.message,
        accessible: false
      }
    };
    
    console.log(`❌ Server connectivity failed: ${error.message}`);
    testResults.overall.failed++;
    testResults.overall.total++;
  }
}

// Test environment configuration
async function testEnvironmentConfiguration() {
  console.log('\n🔧 Testing environment configuration...');
  
  const envTests = {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    appUrl: process.env.NEXT_PUBLIC_APP_URL || BASE_URL
  };
  
  const missingVars = Object.entries(envTests)
    .filter(([key, value]) => !value)
    .map(([key]) => key);
  
  if (missingVars.length === 0) {
    console.log('✅ All required environment variables are set');
    testResults.environment.status = 'passed';
    testResults.overall.passed++;
  } else {
    console.log(`⚠️  Missing environment variables: ${missingVars.join(', ')}`);
    testResults.environment.status = 'warning';
    testResults.overall.warnings++;
  }
  
  testResults.environment.details = envTests;
  testResults.overall.total++;
}

// Test magic link generation for a specific user type
async function testMagicLinkGeneration(userType) {
  console.log(`\n🔑 Testing magic link generation for ${userType}...`);
  
  const email = generateTestEmail(userType);
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
      timestamp: new Date().toISOString(),
      responseData: response.data
    };
    
    if (result.success) {
      console.log(`✅ Magic link sent successfully for ${userType} (${email})`);
      testResults.overall.passed++;
    } else if (response.status === 429) {
      console.log(`⚠️  Rate limit exceeded for ${userType} (${email}) - This is expected during testing`);
      testResults.overall.warnings++;
    } else {
      console.log(`❌ Magic link failed for ${userType} (${email}): ${result.message}`);
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

// Test magic link verification endpoint
async function testMagicLinkVerification() {
  console.log('\n🔍 Testing magic link verification endpoint...');
  
  const verificationUrl = `${BASE_URL}/api/auth/verify-magic-link`;
  
  try {
    // Test with invalid token to check endpoint response
    const response = await makeRequest(`${verificationUrl}?token=invalid_token&auth_type=individual`, {
      method: 'GET',
      headers: {
        'User-Agent': 'MagicLinkTest/1.0'
      }
    });
    
    const result = {
      endpoint: verificationUrl,
      status: response.status,
      success: response.status === 302 || response.status === 400 || response.status === 200,
      message: response.data.message || response.data.error || 'Endpoint responding',
      timestamp: new Date().toISOString()
    };
    
    if (result.success) {
      console.log(`✅ Magic link verification endpoint responding correctly (${response.status})`);
      testResults.overall.passed++;
    } else {
      console.log(`❌ Magic link verification endpoint issue: ${response.status}`);
      testResults.overall.failed++;
    }
    
    testResults.magicLinkVerification = result;
    testResults.overall.total++;
    
    return result;
  } catch (error) {
    console.log(`❌ Network error testing magic link verification: ${error.message}`);
    const result = {
      endpoint: verificationUrl,
      status: 'error',
      success: false,
      message: error.message,
      timestamp: new Date().toISOString()
    };
    
    testResults.magicLinkVerification = result;
    testResults.overall.failed++;
    testResults.overall.total++;
    
    return result;
  }
}

// Test dashboard redirection for all user types
async function testDashboardRedirection() {
  console.log('\n🏠 Testing dashboard redirection...');
  
  const dashboards = {
    individual: '/dashboard',
    therapist: '/therapist/dashboard',
    partner: '/partner/dashboard',
    admin: '/admin/dashboard'
  };
  
  for (const [userType, path] of Object.entries(dashboards)) {
    console.log(`   Testing ${userType} dashboard (${path})...`);
    
    try {
      const dashboardUrl = `${BASE_URL}${path}`;
      const response = await makeRequest(dashboardUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'MagicLinkTest/1.0'
        }
      });
      
      const result = {
        userType,
        path,
        status: response.status,
        success: response.status === 200 || response.status === 302,
        redirected: response.status >= 300 && response.status < 400,
        timestamp: new Date().toISOString()
      };
      
      if (result.success) {
        console.log(`   ✅ ${userType} dashboard accessible (${response.status})`);
        testResults.overall.passed++;
      } else {
        console.log(`   ❌ ${userType} dashboard not accessible (${response.status})`);
        testResults.overall.failed++;
      }
      
      testResults.dashboardRedirection[userType] = result;
      testResults.overall.total++;
      
      // Small delay between dashboard tests
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.log(`   ❌ Error testing ${userType} dashboard: ${error.message}`);
      const result = {
        userType,
        path,
        status: 'error',
        success: false,
        message: error.message,
        timestamp: new Date().toISOString()
      };
      
      testResults.dashboardRedirection[userType] = result;
      testResults.overall.failed++;
      testResults.overall.total++;
    }
  }
}

// Test login page accessibility for all user types
async function testLoginPageAccess() {
  console.log('\n🔐 Testing login page access...');
  
  const userTypes = ['individual', 'therapist', 'partner', 'admin'];
  
  for (const userType of userTypes) {
    console.log(`   Testing ${userType} login page...`);
    
    try {
      const loginUrl = `${BASE_URL}/login?user_type=${userType}`;
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
        console.log(`   ✅ ${userType} login page accessible`);
        testResults.overall.passed++;
      } else {
        console.log(`   ❌ ${userType} login page not accessible (${response.status})`);
        testResults.overall.failed++;
      }
      
      testResults.overall.total++;
      
      // Small delay between login page tests
      await new Promise(resolve => setTimeout(resolve, 300));
      
    } catch (error) {
      console.log(`   ❌ Error testing ${userType} login page: ${error.message}`);
      testResults.overall.failed++;
      testResults.overall.total++;
    }
  }
}

// Test API endpoints for all user types
async function testAllMagicLinkAPIs() {
  console.log('\n🔑 Testing magic link APIs for all user types...');
  
  const userTypes = ['individual', 'therapist', 'partner', 'admin'];
  
  for (const userType of userTypes) {
    await testMagicLinkGeneration(userType);
    
    // Delay between requests to avoid rate limiting
    if (userType !== 'admin') {
      console.log(`   ⏳ Waiting ${RATE_LIMIT_DELAY}ms to avoid rate limiting...`);
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
    }
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
  console.log(`   ⚠️  Warnings: ${testResults.overall.warnings}`);
  console.log(`   📊 Total: ${testResults.overall.total}`);
  
  const successRate = testResults.overall.total > 0 
    ? ((testResults.overall.passed / testResults.overall.total) * 100).toFixed(1)
    : 0;
  console.log(`   📊 Success Rate: ${successRate}%`);
  
  console.log(`\n🖥️  Server Status:`);
  console.log(`   Status: ${testResults.server.status === 'passed' ? '✅ Running' : '❌ Not running'}`);
  if (testResults.server.details.statusCode) {
    console.log(`   Response Code: ${testResults.server.details.statusCode}`);
  }
  
  console.log(`\n🔧 Environment Configuration:`);
  console.log(`   Status: ${testResults.environment.status === 'passed' ? '✅ Complete' : '⚠️  Issues found'}`);
  if (testResults.environment.details) {
    Object.entries(testResults.environment.details).forEach(([key, value]) => {
      const status = value ? '✅' : '❌';
      console.log(`   ${status} ${key}: ${value ? 'Set' : 'Missing'}`);
    });
  }
  
  console.log(`\n🔑 Magic Link Generation Results:`);
  Object.entries(testResults.magicLinkGeneration).forEach(([userType, result]) => {
    const status = result.success ? '✅' : (result.status === 429 ? '⚠️' : '❌');
    const message = result.status === 429 ? 'Rate Limited' : (result.message || 'Success');
    console.log(`   ${status} ${userType}: ${result.status} - ${message}`);
  });
  
  console.log(`\n🔍 Magic Link Verification:`);
  if (testResults.magicLinkVerification) {
    const status = testResults.magicLinkVerification.success ? '✅' : '❌';
    console.log(`   ${status} Endpoint: ${testResults.magicLinkVerification.status} - ${testResults.magicLinkVerification.message}`);
  }
  
  console.log(`\n🏠 Dashboard Redirection Results:`);
  Object.entries(testResults.dashboardRedirection).forEach(([userType, result]) => {
    const status = result.success ? '✅' : '❌';
    console.log(`   ${status} ${userType}: ${result.path} (${result.status})`);
  });
  
  console.log(`\n📋 Test Summary:`);
  console.log(`   • Individual users: ${BASE_URL}/login?user_type=individual → ${BASE_URL}/dashboard`);
  console.log(`   • Therapist users: ${BASE_URL}/login?user_type=therapist → ${BASE_URL}/therapist/dashboard`);
  console.log(`   • Partner users: ${BASE_URL}/login?user_type=partner → ${BASE_URL}/partner/dashboard`);
  console.log(`   • Admin users: ${BASE_URL}/login?user_type=admin → ${BASE_URL}/admin/dashboard`);
  
  console.log(`\n🔧 Troubleshooting Guide:`);
  
  if (testResults.server.status !== 'passed') {
    console.log(`\n   🖥️  Server Issues:`);
    console.log(`   1. Start the server: npm run dev`);
    console.log(`   2. Check if port 3000 is available`);
    console.log(`   3. Verify no other processes are using the port`);
  }
  
  if (testResults.environment.status !== 'passed') {
    console.log(`\n   🔧 Environment Issues:`);
    console.log(`   1. Check .env.local file exists`);
    console.log(`   2. Verify NEXT_PUBLIC_SUPABASE_URL is set`);
    console.log(`   3. Verify SUPABASE_SERVICE_ROLE_KEY is set`);
    console.log(`   4. Restart the server after setting environment variables`);
  }
  
  const rateLimitedTests = Object.values(testResults.magicLinkGeneration)
    .filter(result => result.status === 429);
  
  if (rateLimitedTests.length > 0) {
    console.log(`\n   ⚠️  Rate Limiting Issues:`);
    console.log(`   1. Supabase free tier allows 3 emails per hour per email`);
    console.log(`   2. Use different email addresses for testing`);
    console.log(`   3. Wait 1 hour for rate limit to reset`);
    console.log(`   4. Consider upgrading to Supabase Pro for higher limits`);
  }
  
  const failedMagicLinks = Object.values(testResults.magicLinkGeneration)
    .filter(result => !result.success && result.status !== 429);
  
  if (failedMagicLinks.length > 0) {
    console.log(`\n   🔑 Magic Link Issues:`);
    console.log(`   1. Check Supabase email configuration`);
    console.log(`   2. Verify email templates are set up`);
    console.log(`   3. Check Supabase project settings`);
    console.log(`   4. Verify email service is working`);
  }
  
  console.log(`\n🌐 Manual Testing Steps:`);
  console.log(`   1. Open: ${BASE_URL}/login?user_type=individual`);
  console.log(`   2. Enter unique email: test.individual.${Date.now()}@gmail.com`);
  console.log(`   3. Click: "Send Magic Link"`);
  console.log(`   4. Check email and click the magic link`);
  console.log(`   5. Verify redirection to ${BASE_URL}/dashboard`);
  console.log(`   6. Repeat for therapist, partner, and admin user types`);
  
  console.log('\n' + '='.repeat(80));
}

// Main test execution
async function runAllTests() {
  console.log('🚀 Starting Comprehensive Magic Link Testing Suite');
  console.log(`📍 Testing against: ${BASE_URL}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
  console.log(`⏱️  Timeout: ${TEST_TIMEOUT}ms per request`);
  
  try {
    // Phase 1: Basic connectivity and environment
    await testServerConnectivity();
    await testEnvironmentConfiguration();
    
    // Phase 2: Magic link functionality
    await testAllMagicLinkAPIs();
    await testMagicLinkVerification();
    
    // Phase 3: Dashboard and login page accessibility
    await testDashboardRedirection();
    await testLoginPageAccess();
    
    // Generate comprehensive report
    generateTestReport();
    
    console.log(`\n⏰ Completed at: ${new Date().toISOString()}`);
    
    // Exit with appropriate code
    const hasFailures = testResults.overall.failed > 0;
    const hasWarnings = testResults.overall.warnings > 0;
    
    if (hasFailures) {
      console.log('\n❌ Some tests failed. Check the report above for details.');
      process.exit(1);
    } else if (hasWarnings) {
      console.log('\n⚠️  Tests completed with warnings. Check the report above for details.');
      process.exit(0);
    } else {
      console.log('\n✅ All tests passed successfully!');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('\n❌ Test execution failed:', error);
    process.exit(1);
  }
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Comprehensive Magic Link Testing Suite

Usage: node test-all-magic-links.js [options]

Options:
  --url <url>     Set the base URL to test against (default: http://localhost:3000)
  --help, -h      Show this help message

Environment Variables:
  APP_URL         Base URL for the application (overrides --url)

Features:
  - Tests server connectivity
  - Validates environment configuration
  - Tests magic link generation for all user types
  - Tests magic link verification endpoint
  - Tests dashboard redirection
  - Tests login page accessibility
  - Handles rate limiting gracefully
  - Generates comprehensive test report

Examples:
  node test-all-magic-links.js
  node test-all-magic-links.js --url http://localhost:3001
  APP_URL=https://myapp.com node test-all-magic-links.js
`);
  process.exit(0);
}

// Parse command line arguments
const urlIndex = process.argv.indexOf('--url');
if (urlIndex !== -1 && process.argv[urlIndex + 1]) {
  process.env.APP_URL = process.argv[urlIndex + 1];
}

// Run the tests
runAllTests();
