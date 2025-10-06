#!/usr/bin/env node

/**
 * Fix Port Issues Script
 * Helps resolve port mismatch and connection issues
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';
const WRONG_URL = 'http://localhost:3001';

console.log('🔧 Port Issues Fix Script');
console.log('========================');

// Test if server is running on correct port
function testServer(port) {
  return new Promise((resolve) => {
    const req = http.request(`http://localhost:${port}`, { method: 'GET' }, (res) => {
      resolve({ port, status: res.statusCode, running: true });
    });
    
    req.on('error', () => {
      resolve({ port, status: 'error', running: false });
    });
    
    req.setTimeout(2000, () => {
      req.destroy();
      resolve({ port, status: 'timeout', running: false });
    });
    
    req.end();
  });
}

// Test API endpoint
function testAPI() {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      email: 'test@example.com',
      user_type: 'individual',
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
          resolve({ success: true, data: jsonData, status: res.statusCode });
        } catch (e) {
          resolve({ success: false, error: 'Invalid JSON response', status: res.statusCode });
        }
      });
    });
    
    req.on('error', (error) => {
      resolve({ success: false, error: error.message });
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({ success: false, error: 'Request timeout' });
    });
    
    req.write(postData);
    req.end();
  });
}

async function runDiagnostics() {
  console.log('\n🔍 Running Diagnostics...\n');
  
  // Test both ports
  console.log('Testing port 3000 (correct)...');
  const port3000 = await testServer(3000);
  console.log(`  Status: ${port3000.running ? '✅ Running' : '❌ Not running'}`);
  if (port3000.running) {
    console.log(`  Response: ${port3000.status}`);
  }
  
  console.log('\nTesting port 3001 (wrong)...');
  const port3001 = await testServer(3001);
  console.log(`  Status: ${port3001.running ? '⚠️  Something running' : '✅ Nothing running'}`);
  if (port3001.running) {
    console.log(`  Response: ${port3001.status}`);
  }
  
  // Test API endpoint
  console.log('\nTesting API endpoint...');
  const apiTest = await testAPI();
  if (apiTest.success) {
    console.log('  ✅ API endpoint working');
    console.log(`  Response: ${JSON.stringify(apiTest.data)}`);
  } else {
    console.log('  ❌ API endpoint not working');
    console.log(`  Error: ${apiTest.error}`);
  }
  
  // Generate recommendations
  console.log('\n📋 Recommendations:');
  
  if (!port3000.running) {
    console.log('  ❌ Server not running on port 3000');
    console.log('  🔧 Fix: Run `npm run dev`');
  }
  
  if (port3001.running) {
    console.log('  ⚠️  Something is running on port 3001');
    console.log('  🔧 Fix: Kill process on port 3001 or use different port');
    console.log('  Command: `lsof -i :3001` then `kill -9 <PID>`');
  }
  
  if (port3000.running && !apiTest.success) {
    console.log('  ❌ API endpoint not responding');
    console.log('  🔧 Fix: Check API route implementation');
  }
  
  if (port3000.running && apiTest.success) {
    console.log('  ✅ Server is working correctly');
    console.log('  🎯 Access your app at: http://localhost:3000');
    console.log('  🔧 Clear browser cache if still having issues');
  }
  
  console.log('\n🌐 Correct URLs to use:');
  console.log('  • Main app: http://localhost:3000');
  console.log('  • Login: http://localhost:3000/login');
  console.log('  • Therapist login: http://localhost:3000/therapist/login');
  console.log('  • Therapist dashboard: http://localhost:3000/therapist/dashboard');
  
  console.log('\n❌ Wrong URLs (avoid these):');
  console.log('  • http://localhost:3001 (wrong port)');
  console.log('  • https://localhost:3000 (wrong protocol)');
  
  console.log('\n🧹 Browser Cache Clear Steps:');
  console.log('  1. Open Chrome DevTools (F12)');
  console.log('  2. Right-click refresh button');
  console.log('  3. Select "Empty Cache and Hard Reload"');
  console.log('  4. Or use incognito mode for testing');
}

// Run the diagnostics
runDiagnostics().catch(error => {
  console.error('❌ Diagnostic failed:', error);
  process.exit(1);
});
