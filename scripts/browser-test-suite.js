/**
 * 🌐 BROWSER TESTING SUITE
 * 
 * Copy and paste this script into your browser console to test
 * the platform functionality directly in the browser.
 * 
 * Usage:
 * 1. Open your app in browser (http://localhost:3001)
 * 2. Open Developer Tools (F12) → Console tab
 * 3. Copy and paste this entire script
 * 4. Run: testPlatform()
 */

// Test configuration
const TEST_CONFIG = {
  baseUrl: window.location.origin,
  testEmail: `test-${Date.now()}@example.com`,
  therapistEmail: `therapist-${Date.now()}@example.com`,
  testCard: '4084084084084081'
};

// Test results tracking
let testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : '🔍';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function recordTest(name, passed, error = null) {
  if (passed) {
    testResults.passed++;
    log(`PASSED: ${name}`, 'success');
  } else {
    testResults.failed++;
    testResults.errors.push({ name, error });
    log(`FAILED: ${name} - ${error}`, 'error');
  }
}

async function makeRequest(endpoint, options = {}) {
  try {
    const url = `${TEST_CONFIG.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    const data = await response.json().catch(() => ({}));
    return { response, data };
  } catch (error) {
    return { response: null, data: null, error: error.message };
  }
}

// Test 1: Page Loading
async function testPageLoading() {
  log('Testing page loading...');
  
  const pages = [
    '/',
    '/login',
    '/signup',
    '/therapist/enroll',
    '/admin/login',
    '/dashboard',
    '/therapist/dashboard'
  ];
  
  for (const page of pages) {
    try {
      const response = await fetch(`${TEST_CONFIG.baseUrl}${page}`);
      if (response.ok) {
        recordTest(`Page Load: ${page}`, true);
      } else {
        recordTest(`Page Load: ${page}`, false, `HTTP ${response.status}`);
      }
    } catch (error) {
      recordTest(`Page Load: ${page}`, false, error.message);
    }
  }
}

// Test 2: Authentication Flow
async function testAuthenticationFlow() {
  log('Testing authentication flow...');
  
  // Test magic link creation
  const { response, data } = await makeRequest('/api/auth/magic-link', {
    method: 'POST',
    body: JSON.stringify({
      email: TEST_CONFIG.testEmail,
      user_type: 'individual'
    })
  });
  
  if (response?.ok) {
    recordTest('Magic Link Creation', true);
  } else {
    recordTest('Magic Link Creation', false, data?.error || 'Failed to create magic link');
  }
  
  // Test therapist magic link
  const { response: therapistResponse, data: therapistData } = await makeRequest('/api/therapist/magic-link', {
    method: 'POST',
    body: JSON.stringify({
      email: TEST_CONFIG.therapistEmail
    })
  });
  
  if (therapistResponse?.ok) {
    recordTest('Therapist Magic Link', true);
  } else {
    recordTest('Therapist Magic Link', false, therapistData?.error || 'Failed to create therapist magic link');
  }
}

// Test 3: Payment System
async function testPaymentSystem() {
  log('Testing payment system...');
  
  // Test payment initialization
  const { response, data } = await makeRequest('/api/payments/initiate', {
    method: 'POST',
    body: JSON.stringify({
      package_type: 'bronze'
    })
  });
  
  if (response?.ok && data.payment_url) {
    recordTest('Payment Initialization', true);
  } else {
    recordTest('Payment Initialization', false, data?.error || 'Failed to initialize payment');
  }
}

// Test 4: Video Integration
async function testVideoIntegration() {
  log('Testing video integration...');
  
  // Test Daily.co room creation
  const { response, data } = await makeRequest('/api/daily/create-room', {
    method: 'POST',
    body: JSON.stringify({
      roomName: `test-room-${Date.now()}`,
      properties: {
        max_participants: 2,
        enable_chat: true
      }
    })
  });
  
  if (response?.ok && data.room?.url) {
    recordTest('Daily.co Room Creation', true);
  } else {
    recordTest('Daily.co Room Creation', false, data?.error || 'Failed to create video room');
  }
}

// Test 5: AI Service
async function testAIService() {
  log('Testing AI service...');
  
  // Test DeepSeek connection
  const { response, data } = await makeRequest('/api/test-deepseek-direct', {
    method: 'POST',
    body: JSON.stringify({
      message: 'Test message for DeepSeek API'
    })
  });
  
  if (response?.ok && data.success) {
    recordTest('DeepSeek AI Service', true);
  } else {
    recordTest('DeepSeek AI Service', false, data?.error || 'DeepSeek API not working');
  }
}

// Test 6: Session Management
async function testSessionManagement() {
  log('Testing session management...');
  
  // Test session booking endpoint
  const { response, data } = await makeRequest('/api/sessions/book', {
    method: 'POST',
    body: JSON.stringify({
      therapist_id: 'test-therapist-id',
      session_date: '2024-12-31',
      start_time: '10:00',
      duration: 60,
      session_type: 'video',
      notes: 'Test session booking'
    })
  });
  
  // This might fail without proper auth, but endpoint should exist
  if (response?.status !== 404) {
    recordTest('Session Booking Endpoint', true);
  } else {
    recordTest('Session Booking Endpoint', false, 'Session booking endpoint not found');
  }
}

// Test 7: Credit System
async function testCreditSystem() {
  log('Testing credit system...');
  
  const { response, data } = await makeRequest('/api/credits/user');
  
  if (response?.status !== 404) {
    recordTest('Credit System Endpoint', true);
  } else {
    recordTest('Credit System Endpoint', false, 'Credit system endpoint not found');
  }
}

// Test 8: Therapist System
async function testTherapistSystem() {
  log('Testing therapist system...');
  
  // Test therapist enrollment
  const { response, data } = await makeRequest('/api/therapist/enroll', {
    method: 'POST',
    body: JSON.stringify({
      full_name: 'Test Therapist',
      email: TEST_CONFIG.therapistEmail,
      phone: '+2348012345678',
      specialization: 'Anxiety & Stress Management',
      experience_years: 5,
      education: 'PhD in Clinical Psychology',
      mdcn_code: 'MDCN12345',
      bio: 'Experienced therapist specializing in anxiety management.'
    })
  });
  
  if (response?.status !== 404) {
    recordTest('Therapist Enrollment', true);
  } else {
    recordTest('Therapist Enrollment', false, 'Therapist enrollment endpoint not found');
  }
}

// Test 9: UI Components
function testUIComponents() {
  log('Testing UI components...');
  
  // Test if key elements exist
  const elements = [
    { selector: 'body', name: 'Page Body' },
    { selector: 'nav', name: 'Navigation' },
    { selector: 'main', name: 'Main Content' },
    { selector: 'footer', name: 'Footer' }
  ];
  
  elements.forEach(({ selector, name }) => {
    const element = document.querySelector(selector);
    if (element) {
      recordTest(`UI Component: ${name}`, true);
    } else {
      recordTest(`UI Component: ${name}`, false, 'Element not found');
    }
  });
}

// Test 10: Local Storage
function testLocalStorage() {
  log('Testing local storage...');
  
  try {
    // Test localStorage availability
    localStorage.setItem('test-key', 'test-value');
    const value = localStorage.getItem('test-key');
    localStorage.removeItem('test-key');
    
    if (value === 'test-value') {
      recordTest('Local Storage', true);
    } else {
      recordTest('Local Storage', false, 'Local storage not working');
    }
  } catch (error) {
    recordTest('Local Storage', false, error.message);
  }
}

// Main test runner
async function testPlatform() {
  console.log('🚀 STARTING BROWSER TESTING SUITE');
  console.log('==================================');
  console.log(`Base URL: ${TEST_CONFIG.baseUrl}`);
  console.log(`Test Email: ${TEST_CONFIG.testEmail}`);
  console.log(`Therapist Email: ${TEST_CONFIG.therapistEmail}`);
  console.log('');
  
  const startTime = Date.now();
  
  try {
    // Run all tests
    await testPageLoading();
    await testAuthenticationFlow();
    await testPaymentSystem();
    await testVideoIntegration();
    await testAIService();
    await testSessionManagement();
    await testCreditSystem();
    await testTherapistSystem();
    testUIComponents();
    testLocalStorage();
    
  } catch (error) {
    log(`Critical error during testing: ${error.message}`, 'error');
  }
  
  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;
  
  // Print results
  console.log('');
  console.log('🏁 BROWSER TEST RESULTS');
  console.log('=======================');
  console.log(`Total Tests: ${testResults.passed + testResults.failed}`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`⏱️  Duration: ${duration}s`);
  console.log('');
  
  if (testResults.failed > 0) {
    console.log('❌ FAILED TESTS:');
    testResults.errors.forEach(({ name, error }) => {
      console.log(`   • ${name}: ${error}`);
    });
    console.log('');
  }
  
  // Overall assessment
  const successRate = (testResults.passed / (testResults.passed + testResults.failed)) * 100;
  
  if (successRate >= 90) {
    console.log('🎉 BROWSER TESTS PASSED!');
    console.log(`Success rate: ${successRate.toFixed(1)}%`);
    console.log('Your platform is working well in the browser!');
  } else if (successRate >= 70) {
    console.log('⚠️  MOSTLY WORKING');
    console.log(`Success rate: ${successRate.toFixed(1)}%`);
    console.log('Some issues need attention.');
  } else {
    console.log('🚨 BROWSER ISSUES DETECTED');
    console.log(`Success rate: ${successRate.toFixed(1)}%`);
    console.log('Multiple issues need to be resolved.');
  }
  
  console.log('');
  console.log('📋 NEXT STEPS:');
  console.log('1. Fix any failed tests above');
  console.log('2. Test user registration flow manually');
  console.log('3. Test payment with real test data');
  console.log('4. Test video calls with another person');
  
  return testResults;
}

// Quick test functions for individual testing
window.testAuth = testAuthenticationFlow;
window.testPayment = testPaymentSystem;
window.testVideo = testVideoIntegration;
window.testAI = testAIService;
window.testSession = testSessionManagement;
window.testCredit = testCreditSystem;
window.testTherapist = testTherapistSystem;

// Export for use
window.testPlatform = testPlatform;
window.testResults = testResults;

console.log('🌐 Browser Testing Suite Loaded!');
console.log('Run: testPlatform() to start comprehensive testing');
console.log('Or run individual tests: testAuth(), testPayment(), testVideo(), etc.');
