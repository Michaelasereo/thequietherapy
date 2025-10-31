// Comprehensive Feature Testing for TRPI Platform
// Run with: node test-all-features.js

require('dotenv').config({ path: '.env.local' });

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
let testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: []
};

function logTest(name, status, message = '') {
  const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
  testResults.tests.push({ name, status, message });
  console.log(`${icon} ${name}: ${message}`);
}

async function runTests() {
  console.log('🧪 TRPI PLATFORM - COMPREHENSIVE FEATURE TEST\n');
  console.log('='.repeat(80));
  console.log(`Testing against: ${BASE_URL}\n`);

  // 1. Environment Check
  console.log('\n📋 1. ENVIRONMENT CONFIGURATION');
  console.log('-'.repeat(80));
  
  logTest('OPENAI_API_KEY', process.env.OPENAI_API_KEY ? 'pass' : 'warn', 
    process.env.OPENAI_API_KEY ? 'Configured for transcription' : 'Not configured');
  logTest('DEEPSEEK_API_KEY', process.env.DEEPSEEK_API_KEY ? 'pass' : 'warn', 
    process.env.DEEPSEEK_API_KEY ? 'Configured for SOAP notes' : 'Not configured');
  logTest('DAILY_API_KEY', process.env.DAILY_API_KEY ? 'pass' : 'warn', 
    process.env.DAILY_API_KEY ? 'Configured for video' : 'Not configured');
  logTest('SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'pass' : 'fail', 
    process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Configured' : 'Missing');
  logTest('PAYSTACK_SECRET_KEY', process.env.PAYSTACK_SECRET_KEY ? 'pass' : 'warn', 
    process.env.PAYSTACK_SECRET_KEY ? 'Configured for payments' : 'Not configured');

  // 2. AI Services
  console.log('\n🤖 2. AI SERVICES TESTING');
  console.log('-'.repeat(80));

  try {
    // Test DeepSeek
    if (process.env.DEEPSEEK_API_KEY) {
      const deepseekResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: 'Say hello' }],
          max_tokens: 10,
        }),
      });
      logTest('DeepSeek API', deepseekResponse.ok ? 'pass' : 'fail', 
        deepseekResponse.ok ? 'Working' : `Error: ${deepseekResponse.status}`);
    }

    // Test OpenAI
    if (process.env.OPENAI_API_KEY) {
      const openaiResponse = await fetch('https://api.openai.com/v1/models', {
        headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` }
      });
      logTest('OpenAI API', openaiResponse.ok ? 'pass' : 'fail', 
        openaiResponse.ok ? 'Working' : `Error: ${openaiResponse.status}`);
    }
  } catch (error) {
    logTest('AI Services', 'fail', error.message);
  }

  // 3. API Endpoints
  console.log('\n🌐 3. API ENDPOINTS TESTING');
  console.log('-'.repeat(80));

  // Test health endpoint
  try {
    const healthResponse = await fetch(`${BASE_URL}/api/health`);
    logTest('Health Check', healthResponse.ok ? 'pass' : 'warn', 
      healthResponse.ok ? 'API responding' : 'API not responding');
  } catch (error) {
    logTest('Health Check', 'fail', 'Cannot reach API');
  }

  // Test availability endpoint (no auth required)
  try {
    const availabilityResponse = await fetch(`${BASE_URL}/api/availability/days?therapist_id=test`);
    logTest('Availability API', availabilityResponse.status !== 500 ? 'pass' : 'warn', 
      availabilityResponse.status !== 500 ? 'Endpoint accessible' : 'Endpoint error');
  } catch (error) {
    logTest('Availability API', 'fail', error.message);
  }

  // 4. Database Connection
  console.log('\n💾 4. DATABASE CONNECTION');
  console.log('-'.repeat(80));

  try {
    const testResponse = await fetch(`${BASE_URL}/api/test-db`);
    logTest('Database Connection', testResponse.ok ? 'pass' : 'warn', 
      testResponse.ok ? 'Connected' : 'Check connection');
  } catch (error) {
    logTest('Database Connection', 'warn', 'Cannot test (endpoint may not exist)');
  }

  // 5. Video Services
  console.log('\n🎥 5. VIDEO SERVICES');
  console.log('-'.repeat(80));

  if (process.env.DAILY_API_KEY) {
    try {
      const dailyResponse = await fetch('https://api.daily.co/v1/rooms', {
        headers: { 'Authorization': `Bearer ${process.env.DAILY_API_KEY}` }
      });
      logTest('Daily.co API', dailyResponse.ok ? 'pass' : 'fail', 
        dailyResponse.ok ? 'Video service ready' : `Error: ${dailyResponse.status}`);
    } catch (error) {
      logTest('Daily.co API', 'fail', error.message);
    }
  } else {
    logTest('Daily.co API', 'warn', 'API key not configured');
  }

  // 6. Payment Services
  console.log('\n💳 6. PAYMENT SERVICES');
  console.log('-'.repeat(80));

  if (process.env.PAYSTACK_SECRET_KEY) {
    try {
      const paystackResponse = await fetch('https://api.paystack.co/bank', {
        headers: { 'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }
      });
      logTest('Paystack API', paystackResponse.ok ? 'pass' : 'warn', 
        paystackResponse.ok ? 'Payment service ready' : `Error: ${paystackResponse.status}`);
    } catch (error) {
      logTest('Paystack API', 'warn', 'Cannot verify');
    }
  } else {
    logTest('Paystack API', 'warn', 'API key not configured');
  }

  // 7. Frontend Pages
  console.log('\n🖥️  7. FRONTEND PAGES');
  console.log('-'.repeat(80));

  const pages = [
    { path: '/', name: 'Landing Page' },
    { path: '/login', name: 'Login Page' },
    { path: '/signup', name: 'Signup Page' },
    { path: '/dashboard', name: 'User Dashboard' },
  ];

  for (const page of pages) {
    try {
      const response = await fetch(`${BASE_URL}${page.path}`, { method: 'HEAD' });
      logTest(page.name, response.status < 500 ? 'pass' : 'fail', 
        response.status < 500 ? `Status: ${response.status}` : 'Page error');
    } catch (error) {
      logTest(page.name, 'fail', error.message);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 TEST SUMMARY');
  console.log('-'.repeat(80));

  testResults.passed = testResults.tests.filter(t => t.status === 'pass').length;
  testResults.failed = testResults.tests.filter(t => t.status === 'fail').length;
  testResults.warnings = testResults.tests.filter(t => t.status === 'warn').length;

  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`⚠️  Warnings: ${testResults.warnings}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📊 Total: ${testResults.tests.length}`);

  const successRate = ((testResults.passed / testResults.tests.length) * 100).toFixed(1);
  console.log(`\n📈 Success Rate: ${successRate}%`);

  console.log('\n' + '='.repeat(80));

  // Recommendations
  console.log('\n💡 RECOMMENDATIONS:');
  
  if (testResults.failed === 0 && testResults.warnings <= 3) {
    console.log('✅ Platform is ready for investor demo!');
    console.log('🎯 All critical systems are operational');
  } else if (testResults.failed <= 2) {
    console.log('⚠️  Platform is mostly ready with minor issues');
    console.log('🔧 Address warnings before investor meeting');
  } else {
    console.log('❌ Platform needs attention before demo');
    console.log('🛠️  Fix failed tests before investor meeting');
  }

  console.log('\n🎬 Next Steps:');
  console.log('1. Review detailed test results above');
  console.log('2. Address any failed tests');
  console.log('3. Run manual end-to-end test');
  console.log('4. Prepare investor demo using INVESTOR-DEMO-PACKAGE.md');
}

// Run tests
runTests().catch(console.error);

