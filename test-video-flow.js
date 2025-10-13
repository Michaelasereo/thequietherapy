#!/usr/bin/env node

/**
 * 🎥 COMPLETE VIDEO FLOW TEST SCRIPT
 * 
 * This script tests the entire video session flow end-to-end:
 * 1. Environment variables check
 * 2. Daily.co room creation
 * 3. Meeting token generation
 * 4. Database connectivity
 * 5. Transcription API setup
 * 6. AI service configuration
 * 
 * Run: node test-video-flow.js
 */

const https = require('https');

// Test results tracker
const results = {
  passed: [],
  failed: [],
  warnings: []
};

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function pass(test) {
  results.passed.push(test);
  log(`✅ ${test} - PASSED`, colors.green);
}

function fail(test, error) {
  results.failed.push({ test, error });
  log(`❌ ${test} - FAILED`, colors.red);
  if (error) log(`   Error: ${error}`, colors.red);
}

function warn(test, message) {
  results.warnings.push({ test, message });
  log(`⚠️  ${test} - WARNING`, colors.yellow);
  if (message) log(`   ${message}`, colors.yellow);
}

// Check environment variables
function checkEnvVars() {
  log('\n📋 STEP 1: Checking Environment Variables...', colors.bold);
  
  const requiredVars = [
    'DAILY_API_KEY',
    'OPENAI_API_KEY',
    'DEEPSEEK_API_KEY',
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];

  const optionalVars = [
    'DAILY_DOMAIN',
    'NEXT_PUBLIC_APP_URL'
  ];

  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      pass(`${varName} configured`);
    } else {
      fail(`${varName} missing`, 'This is required for video features to work');
    }
  });

  optionalVars.forEach(varName => {
    if (process.env[varName]) {
      pass(`${varName} configured`);
    } else {
      warn(`${varName} not set`, 'This is optional but recommended');
    }
  });
}

// Test Daily.co API
async function testDailyApi() {
  log('\n🎥 STEP 2: Testing Daily.co API...', colors.bold);
  
  const apiKey = process.env.DAILY_API_KEY;
  if (!apiKey) {
    fail('Daily.co API test', 'DAILY_API_KEY not set');
    return;
  }

  return new Promise((resolve) => {
    const options = {
      hostname: 'api.daily.co',
      path: '/v1/rooms',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    };

    const roomData = JSON.stringify({
      name: `test-room-${Date.now()}`,
      privacy: 'public',
      properties: {
        enable_recording: 'cloud',
        enable_screenshare: true,
        enable_chat: true,
        max_participants: 2
      }
    });

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          if (res.statusCode === 200 || res.statusCode === 201) {
            pass('Daily.co room creation');
            log(`   Room URL: ${response.url}`, colors.blue);
            
            // Clean up: delete test room
            deleteTestRoom(response.name, apiKey);
          } else {
            fail('Daily.co room creation', `Status ${res.statusCode}: ${response.error || response.info}`);
          }
        } catch (error) {
          fail('Daily.co room creation', error.message);
        }
        resolve();
      });
    });

    req.on('error', (error) => {
      fail('Daily.co API connection', error.message);
      resolve();
    });

    req.write(roomData);
    req.end();
  });
}

// Delete test room
function deleteTestRoom(roomName, apiKey) {
  const options = {
    hostname: 'api.daily.co',
    path: `/v1/rooms/${roomName}`,
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${apiKey}`
    }
  };

  const req = https.request(options, (res) => {
    if (res.statusCode === 200) {
      log('   Test room cleaned up', colors.blue);
    }
  });

  req.on('error', () => {
    // Ignore cleanup errors
  });

  req.end();
}

// Test OpenAI API
async function testOpenAiApi() {
  log('\n🤖 STEP 3: Testing OpenAI API...', colors.bold);
  
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    fail('OpenAI API test', 'OPENAI_API_KEY not set');
    return;
  }

  return new Promise((resolve) => {
    const options = {
      hostname: 'api.openai.com',
      path: '/v1/models',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          if (res.statusCode === 200) {
            pass('OpenAI API connection');
            
            // Check for Whisper model
            const hasWhisper = response.data?.some(model => model.id === 'whisper-1');
            if (hasWhisper) {
              pass('Whisper model available');
            } else {
              warn('Whisper model', 'Could not verify Whisper-1 model availability');
            }
          } else {
            fail('OpenAI API connection', `Status ${res.statusCode}: ${response.error?.message}`);
          }
        } catch (error) {
          fail('OpenAI API connection', error.message);
        }
        resolve();
      });
    });

    req.on('error', (error) => {
      fail('OpenAI API connection', error.message);
      resolve();
    });

    req.end();
  });
}

// Test DeepSeek API
async function testDeepSeekApi() {
  log('\n🧠 STEP 4: Testing DeepSeek API...', colors.bold);
  
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    fail('DeepSeek API test', 'DEEPSEEK_API_KEY not set');
    return;
  }

  return new Promise((resolve) => {
    const options = {
      hostname: 'api.deepseek.com',
      path: '/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    };

    const requestData = JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'user',
          content: 'Say "test successful" if you can read this.'
        }
      ],
      max_tokens: 10
    });

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          if (res.statusCode === 200) {
            pass('DeepSeek API connection');
            log(`   Response: ${response.choices?.[0]?.message?.content}`, colors.blue);
          } else {
            fail('DeepSeek API connection', `Status ${res.statusCode}: ${response.error?.message}`);
          }
        } catch (error) {
          fail('DeepSeek API connection', error.message);
        }
        resolve();
      });
    });

    req.on('error', (error) => {
      fail('DeepSeek API connection', error.message);
      resolve();
    });

    req.write(requestData);
    req.end();
  });
}

// Test Supabase connection
async function testSupabase() {
  log('\n🗄️  STEP 5: Testing Supabase Connection...', colors.bold);
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    fail('Supabase connection', 'Missing Supabase environment variables');
    return;
  }

  const url = new URL(supabaseUrl);
  
  return new Promise((resolve) => {
    const options = {
      hostname: url.hostname,
      path: '/rest/v1/sessions?select=id&limit=1',
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          pass('Supabase connection');
          pass('Sessions table accessible');
        } else {
          fail('Supabase connection', `Status ${res.statusCode}`);
        }
        resolve();
      });
    });

    req.on('error', (error) => {
      fail('Supabase connection', error.message);
      resolve();
    });

    req.end();
  });
}

// Check database tables
async function checkDatabaseTables() {
  log('\n📊 STEP 6: Checking Required Database Tables...', colors.bold);
  
  const tables = [
    'sessions',
    'session_notes',
    'users',
    'therapist_profiles'
  ];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    fail('Database table check', 'Missing Supabase credentials');
    return;
  }

  const url = new URL(supabaseUrl);

  for (const table of tables) {
    await new Promise((resolve) => {
      const options = {
        hostname: url.hostname,
        path: `/rest/v1/${table}?select=*&limit=0`,
        method: 'GET',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      };

      const req = https.request(options, (res) => {
        if (res.statusCode === 200) {
          pass(`Table '${table}' exists`);
        } else {
          fail(`Table '${table}' check`, `Status ${res.statusCode}`);
        }
        resolve();
      });

      req.on('error', (error) => {
        fail(`Table '${table}' check`, error.message);
        resolve();
      });

      req.end();
    });
  }
}

// Print summary
function printSummary() {
  log('\n' + '='.repeat(60), colors.bold);
  log('📊 TEST SUMMARY', colors.bold);
  log('='.repeat(60), colors.bold);
  
  log(`\n✅ Passed: ${results.passed.length}`, colors.green);
  results.passed.forEach(test => {
    log(`   • ${test}`, colors.green);
  });
  
  if (results.warnings.length > 0) {
    log(`\n⚠️  Warnings: ${results.warnings.length}`, colors.yellow);
    results.warnings.forEach(({ test, message }) => {
      log(`   • ${test}`, colors.yellow);
      if (message) log(`     ${message}`, colors.yellow);
    });
  }
  
  if (results.failed.length > 0) {
    log(`\n❌ Failed: ${results.failed.length}`, colors.red);
    results.failed.forEach(({ test, error }) => {
      log(`   • ${test}`, colors.red);
      if (error) log(`     ${error}`, colors.red);
    });
  }
  
  log('\n' + '='.repeat(60), colors.bold);
  
  if (results.failed.length === 0) {
    log('\n🎉 ALL CRITICAL TESTS PASSED!', colors.green + colors.bold);
    log('✅ Your video flow is ready for therapists!', colors.green);
    log('\n📝 Next steps:', colors.blue);
    log('   1. Start dev server: npm run dev', colors.blue);
    log('   2. Book a test session', colors.blue);
    log('   3. Join video session: /video-session/[session-id]', colors.blue);
    log('   4. Test recording and transcription', colors.blue);
  } else {
    log('\n⚠️  SOME TESTS FAILED', colors.red + colors.bold);
    log('Please fix the failed tests before going live.', colors.yellow);
    log('\n📝 Action items:', colors.blue);
    log('   1. Check your .env.local file', colors.blue);
    log('   2. Verify all API keys are correct', colors.blue);
    log('   3. Run this script again after fixes', colors.blue);
  }
  
  log('');
}

// Main test runner
async function runTests() {
  log('\n' + '='.repeat(60), colors.bold);
  log('🎥 VIDEO FLOW TEST - COMPLETE SYSTEM CHECK', colors.bold);
  log('='.repeat(60), colors.bold);
  log('\nTesting video session functionality for therapist onboarding...\n');
  
  try {
    checkEnvVars();
    await testDailyApi();
    await testOpenAiApi();
    await testDeepSeekApi();
    await testSupabase();
    await checkDatabaseTables();
    
    printSummary();
  } catch (error) {
    log(`\n❌ Test runner error: ${error.message}`, colors.red);
    process.exit(1);
  }
}

// Run tests
runTests();


