#!/usr/bin/env node

/**
 * Final Magic Link Test Script
 * Tests the current state of magic links and provides diagnostics
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

// Test results
const results = {
  server: false,
  api: false,
  magicLink: false,
  errors: []
};

// Test server connectivity
function testServer() {
  return new Promise((resolve) => {
    const req = http.request(BASE_URL, { method: 'GET' }, (res) => {
      results.server = res.statusCode === 200;
      resolve({ status: res.statusCode, running: results.server });
    });
    
    req.on('error', (error) => {
      results.errors.push(`Server error: ${error.message}`);
      resolve({ status: 'error', running: false });
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      results.errors.push('Server timeout');
      resolve({ status: 'timeout', running: false });
    });
    
    req.end();
  });
}

// Test magic link API
function testMagicLinkAPI(email, userType) {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      email: email,
      user_type: userType,
      type: 'login'
    });
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/send-magic-link',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          results.api = res.statusCode === 200;
          results.magicLink = jsonData.success === true;
          
          if (!results.magicLink) {
            results.errors.push(`Magic link failed: ${jsonData.error}`);
          }
          
          resolve({
            status: res.statusCode,
            success: jsonData.success,
            error: jsonData.error,
            data: jsonData
          });
        } catch (e) {
          results.errors.push(`Invalid JSON response: ${e.message}`);
          resolve({
            status: res.statusCode,
            success: false,
            error: 'Invalid JSON response',
            data: data
          });
        }
      });
    });
    
    req.on('error', (error) => {
      results.errors.push(`API error: ${error.message}`);
      resolve({
        status: 'error',
        success: false,
        error: error.message
      });
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      results.errors.push('API timeout');
      resolve({
        status: 'timeout',
        success: false,
        error: 'Request timeout'
      });
    });
    
    req.write(postData);
    req.end();
  });
}

// Test different user types
async function testAllUserTypes() {
  const userTypes = ['individual', 'therapist', 'partner', 'admin'];
  const testResults = {};
  
  for (const userType of userTypes) {
    console.log(`\n🔑 Testing ${userType} user magic link...`);
    
    const email = `test.${userType}.${Date.now()}@gmail.com`;
    const result = await testMagicLinkAPI(email, userType);
    
    testResults[userType] = {
      email,
      status: result.status,
      success: result.success,
      error: result.error
    };
    
    if (result.success) {
      console.log(`✅ ${userType}: Magic link sent successfully`);
    } else {
      console.log(`❌ ${userType}: ${result.error}`);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return testResults;
}

// Generate comprehensive report
function generateReport(serverResult, apiResults) {
  console.log('\n' + '='.repeat(80));
  console.log('📊 MAGIC LINK TEST REPORT');
  console.log('='.repeat(80));
  
  console.log(`\n🖥️  Server Status:`);
  console.log(`   Status: ${serverResult.running ? '✅ Running' : '❌ Not running'}`);
  console.log(`   Response: ${serverResult.status}`);
  
  console.log(`\n🔗 API Status:`);
  console.log(`   Endpoint: ${BASE_URL}/api/auth/send-magic-link`);
  console.log(`   Responding: ${results.api ? '✅ Yes' : '❌ No'}`);
  
  console.log(`\n🔑 Magic Link Results:`);
  Object.entries(apiResults).forEach(([userType, result]) => {
    const status = result.success ? '✅' : '❌';
    console.log(`   ${status} ${userType}: ${result.status} - ${result.error || 'Success'}`);
  });
  
  if (results.errors.length > 0) {
    console.log(`\n❌ Errors Found:`);
    results.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });
  }
  
  console.log(`\n🔧 Troubleshooting Steps:`);
  
  if (!serverResult.running) {
    console.log(`   1. Start the server: npm run dev`);
    console.log(`   2. Check if port 3000 is available`);
    console.log(`   3. Verify no other processes are using the port`);
  }
  
  if (!results.api) {
    console.log(`   1. Check API route exists: /api/auth/send-magic-link`);
    console.log(`   2. Verify server is running on port 3000`);
    console.log(`   3. Check for compilation errors`);
  }
  
  if (!results.magicLink) {
    console.log(`   1. Check Supabase environment variables:`);
    console.log(`      - NEXT_PUBLIC_SUPABASE_URL`);
    console.log(`      - SUPABASE_SERVICE_ROLE_KEY`);
    console.log(`   2. Verify Supabase email configuration`);
    console.log(`   3. Check Supabase rate limits`);
    console.log(`   4. Verify email templates are set up`);
  }
  
  console.log(`\n🌐 Manual Testing:`);
  console.log(`   1. Open: ${BASE_URL}/login?user_type=individual`);
  console.log(`   2. Enter email: test.individual.${Date.now()}@gmail.com`);
  console.log(`   3. Click: "Send Magic Link"`);
  console.log(`   4. Check browser console for errors`);
  console.log(`   5. Check server logs for detailed error messages`);
  
  console.log(`\n📋 Expected Results:`);
  console.log(`   ✅ Server: Running on port 3000`);
  console.log(`   ✅ API: Responding with 200 status`);
  console.log(`   ✅ Magic Link: Success message returned`);
  console.log(`   ✅ Email: Magic link email received`);
  console.log(`   ✅ Redirect: Dashboard redirection working`);
  
  console.log('\n' + '='.repeat(80));
}

// Main test execution
async function runTests() {
  console.log('🚀 Starting Magic Link Tests');
  console.log(`📍 Testing against: ${BASE_URL}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
  
  // Test server
  console.log('\n🖥️  Testing server connectivity...');
  const serverResult = await testServer();
  
  if (!serverResult.running) {
    console.log('❌ Server not running. Please start with: npm run dev');
    process.exit(1);
  }
  
  // Test magic link API for all user types
  console.log('\n🔑 Testing magic link API for all user types...');
  const apiResults = await testAllUserTypes();
  
  // Generate comprehensive report
  generateReport(serverResult, apiResults);
  
  console.log(`\n⏰ Completed at: ${new Date().toISOString()}`);
  
  // Exit with appropriate code
  const hasFailures = Object.values(apiResults).some(result => !result.success);
  process.exit(hasFailures ? 1 : 0);
}

// Run the tests
runTests().catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});
