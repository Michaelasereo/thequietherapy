#!/usr/bin/env node

/**
 * Test Supabase Magic Links (Original Implementation)
 * Tests the restored Supabase magic link system
 */

const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = process.env.APP_URL || 'http://localhost:3000';

// Test results storage
const testResults = {
  magicLinkGeneration: {},
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
async function testSupabaseMagicLink(userType) {
  console.log(`\n🔑 Testing Supabase magic link for ${userType}...`);
  
  const email = `test.${userType}@example.com`;
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
      console.log(`✅ Supabase magic link sent successfully for ${userType}`);
      testResults.overall.passed++;
    } else {
      console.log(`❌ Supabase magic link failed for ${userType}: ${result.message}`);
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

// Test login page accessibility
async function testLoginPage(userType) {
  console.log(`\n🔐 Testing login page for ${userType}...`);
  
  const loginUrl = `${BASE_URL}/login?user_type=${userType}`;
  
  try {
    const response = await makeRequest(loginUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'SupabaseMagicLinkTest/1.0'
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
      testResults.overall.passed++;
    } else {
      console.log(`❌ Login page not accessible for ${userType}: ${response.status}`);
      testResults.overall.failed++;
    }
    
    testResults.overall.total++;
    
    return result;
  } catch (error) {
    console.log(`❌ Network error testing login page for ${userType}: ${error.message}`);
    const result = {
      userType,
      url: loginUrl,
      status: 'error',
      success: false,
      message: error.message,
      timestamp: new Date().toISOString()
    };
    
    testResults.overall.failed++;
    testResults.overall.total++;
    
    return result;
  }
}

// Generate test report
function generateTestReport() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 SUPABASE MAGIC LINK TEST REPORT');
  console.log('='.repeat(80));
  
  console.log(`\n📈 Overall Results:`);
  console.log(`   ✅ Passed: ${testResults.overall.passed}`);
  console.log(`   ❌ Failed: ${testResults.overall.failed}`);
  console.log(`   📊 Total: ${testResults.overall.total}`);
  console.log(`   📊 Success Rate: ${((testResults.overall.passed / testResults.overall.total) * 100).toFixed(1)}%`);
  
  console.log(`\n🔑 Supabase Magic Link Generation Results:`);
  Object.entries(testResults.magicLinkGeneration).forEach(([userType, result]) => {
    const status = result.success ? '✅' : '❌';
    console.log(`   ${status} ${userType}: ${result.status} - ${result.message}`);
  });
  
  console.log(`\n📋 Manual Testing Steps:`);
  console.log(`   1. Open ${BASE_URL}/login?user_type=individual`);
  console.log(`   2. Enter email: test.individual@example.com`);
  console.log(`   3. Click "Send Magic Link"`);
  console.log(`   4. Check email and click the Supabase magic link`);
  console.log(`   5. Verify redirection to ${BASE_URL}/dashboard`);
  console.log(`   6. Repeat for therapist, partner, and admin user types`);
  
  console.log(`\n🔧 Supabase Configuration Check:`);
  console.log(`   • Ensure NEXT_PUBLIC_SUPABASE_URL is set`);
  console.log(`   • Ensure SUPABASE_SERVICE_ROLE_KEY is set`);
  console.log(`   • Check Supabase email settings in dashboard`);
  console.log(`   • Verify email templates are configured`);
  
  console.log('\n' + '='.repeat(80));
}

// Main test execution
async function runSupabaseTests() {
  console.log('🚀 Starting Supabase Magic Link Testing');
  console.log(`📍 Testing against: ${BASE_URL}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
  
  // Test magic link generation for all user types
  console.log('\n🔑 PHASE 1: Testing Supabase Magic Link Generation');
  for (const userType of ['individual', 'therapist', 'partner', 'admin']) {
    await testSupabaseMagicLink(userType);
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Test login page access for all user types
  console.log('\n🔐 PHASE 2: Testing Login Page Access');
  for (const userType of ['individual', 'therapist', 'partner', 'admin']) {
    await testLoginPage(userType);
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Generate comprehensive report
  generateTestReport();
  
  console.log(`\n⏰ Completed at: ${new Date().toISOString()}`);
  
  // Exit with appropriate code
  process.exit(testResults.overall.failed > 0 ? 1 : 0);
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Supabase Magic Link Testing Script

Usage: node test-supabase-magic-links.js [options]

Options:
  --url <url>     Set the base URL to test against (default: http://localhost:3000)
  --help, -h      Show this help message

Environment Variables:
  APP_URL         Base URL for the application (overrides --url)

Examples:
  node test-supabase-magic-links.js
  node test-supabase-magic-links.js --url http://localhost:3001
  APP_URL=https://myapp.com node test-supabase-magic-links.js
`);
  process.exit(0);
}

// Parse command line arguments
const urlIndex = process.argv.indexOf('--url');
if (urlIndex !== -1 && process.argv[urlIndex + 1]) {
  process.env.APP_URL = process.argv[urlIndex + 1];
}

// Run the tests
runSupabaseTests().catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});
