/**
 * E2E Video Session Test Suite
 * Tests video session creation, joining, recording, and AI features
 * 
 * Run: node tests/e2e-video-test.js
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

class VideoTestRunner {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.testSessionId = null;
    this.testUserId = null;
    this.testTherapistId = null;
  }

  async test(name, fn) {
    try {
      process.stdout.write(`${colors.cyan}Testing: ${name}...${colors.reset} `);
      await fn();
      console.log(`${colors.green}✅ PASS${colors.reset}`);
      this.passed++;
    } catch (error) {
      console.log(`${colors.red}❌ FAIL${colors.reset}`);
      console.log(`${colors.red}   Error: ${error.message}${colors.reset}`);
      this.failed++;
    }
  }

  async assertTrue(value, message = 'Expected true') {
    if (!value) throw new Error(message);
  }

  summary() {
    const total = this.passed + this.failed;
    const rate = total > 0 ? ((this.passed / total) * 100).toFixed(1) : 0;
    
    console.log('\n' + '='.repeat(60));
    console.log(`${colors.blue}VIDEO TEST SUMMARY${colors.reset}`);
    console.log('='.repeat(60));
    console.log(`Total Tests: ${total}`);
    console.log(`${colors.green}Passed: ${this.passed}${colors.reset}`);
    console.log(`${colors.red}Failed: ${this.failed}${colors.reset}`);
    console.log(`Success Rate: ${rate}%`);
    console.log('='.repeat(60));

    return this.failed === 0;
  }
}

// Test Suite 1: Test User Creation
async function setupTestData(runner) {
  console.log(`\n${colors.blue}=== SETUP: Creating Test Data ===${colors.reset}\n`);

  await runner.test('Create test patient user', async () => {
    const email = `video.patient.${Date.now()}@test.com`;
    
    const { data, error } = await supabase
      .from('users')
      .insert({
        email,
        full_name: 'Video Test Patient',
        user_type: 'individual',
        is_active: true,
        is_verified: true,
        credits: 5,
      })
      .select()
      .single();

    runner.assertTrue(!error, `Failed to create test user: ${error?.message}`);
    runner.testUserId = data.id;
    console.log(`      Created user ID: ${data.id}`);
  });

  await runner.test('Get or create test therapist', async () => {
    // Try to find existing test therapist
    const { data: existingTherapist } = await supabase
      .from('users')
      .select('id')
      .eq('user_type', 'therapist')
      .eq('is_verified', true)
      .limit(1)
      .single();

    if (existingTherapist) {
      runner.testTherapistId = existingTherapist.id;
      console.log(`      Using existing therapist: ${existingTherapist.id}`);
    } else {
      // Create test therapist
      const email = `video.therapist.${Date.now()}@test.com`;
      
      const { data, error } = await supabase
        .from('users')
        .insert({
          email,
          full_name: 'Video Test Therapist',
          user_type: 'therapist',
          is_active: true,
          is_verified: true,
        })
        .select()
        .single();

      runner.assertTrue(!error, `Failed to create therapist: ${error?.message}`);
      runner.testTherapistId = data.id;
      console.log(`      Created therapist ID: ${data.id}`);
    }
  });
}

// Test Suite 2: Session Creation via API
async function testSessionCreation(runner) {
  console.log(`\n${colors.blue}=== TEST SUITE 1: SESSION CREATION ===${colors.reset}\n`);

  await runner.test('Create test video session via API', async () => {
    const now = new Date();
    const startTime = new Date(now.getTime() - 5 * 60 * 1000); // 5 min ago
    const endTime = new Date(now.getTime() + 35 * 60 * 1000); // 35 min from now

    const { data, error } = await supabase
      .from('sessions')
      .insert({
        user_id: runner.testUserId,
        therapist_id: runner.testTherapistId,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        duration: 30,
        session_type: 'video',
        status: 'scheduled',
        notes: '🧪 TEST SESSION - Automated E2E Test',
        payment_status: 'paid',
      })
      .select()
      .single();

    runner.assertTrue(!error, `Failed to create session: ${error?.message}`);
    runner.testSessionId = data.id;
    console.log(`      Created session ID: ${data.id}`);
  });

  await runner.test('Verify session is joinable', async () => {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', runner.testSessionId)
      .single();

    runner.assertTrue(!error, 'Failed to fetch session');
    runner.assertTrue(data.status === 'scheduled', 'Session should be scheduled');
    runner.assertTrue(data.session_type === 'video', 'Session should be video type');
  });
}

// Test Suite 3: Daily.co Room Creation
async function testDailyRoomCreation(runner) {
  console.log(`\n${colors.blue}=== TEST SUITE 2: DAILY.CO INTEGRATION ===${colors.reset}\n`);

  await runner.test('Daily.co API configuration', async () => {
    const apiKey = process.env.DAILY_API_KEY;
    const domain = process.env.DAILY_DOMAIN;

    runner.assertTrue(!!apiKey, 'DAILY_API_KEY not configured');
    runner.assertTrue(!!domain, 'DAILY_DOMAIN not configured');
    console.log(`      Domain: ${domain}`);
  });

  await runner.test('Create Daily.co room for session', async () => {
    const roomName = `test-session-${runner.testSessionId}`.toLowerCase();
    
    const response = await fetch(`${BASE_URL}/api/daily/create-room`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomName,
        properties: {
          exp: Math.round(Date.now() / 1000) + (30 * 60),
          max_participants: 2,
        },
      }),
    });

    runner.assertTrue(response.ok, 'Failed to create Daily.co room');
    
    const data = await response.json();
    runner.assertTrue(!!data.room, 'Response should contain room object');
    runner.assertTrue(!!data.room.url, 'Room should have URL');
    
    console.log(`      Room URL: ${data.room.url}`);

    // Update session with room URL
    await supabase
      .from('sessions')
      .update({
        daily_room_url: data.room.url,
        daily_room_name: data.room.name,
      })
      .eq('id', runner.testSessionId);
  });
}

// Test Suite 4: Session Data Validation
async function testSessionData(runner) {
  console.log(`\n${colors.blue}=== TEST SUITE 3: SESSION DATA VALIDATION ===${colors.reset}\n`);

  await runner.test('Session has valid Daily.co room', async () => {
    const { data, error } = await supabase
      .from('sessions')
      .select('daily_room_url, daily_room_name')
      .eq('id', runner.testSessionId)
      .single();

    runner.assertTrue(!error, 'Failed to fetch session');
    runner.assertTrue(!!data.daily_room_url, 'Session should have room URL');
    runner.assertTrue(!!data.daily_room_name, 'Session should have room name');
  });

  await runner.test('Session timer calculation', async () => {
    const { data } = await supabase
      .from('sessions')
      .select('start_time, end_time, duration')
      .eq('id', runner.testSessionId)
      .single();

    const start = new Date(data.start_time);
    const end = new Date(data.end_time);
    const diffMinutes = (end - start) / (1000 * 60);

    runner.assertTrue(
      diffMinutes === 40,
      `Session window should be 40 min (30 + 10 buffer), got ${diffMinutes}`
    );
  });
}

// Test Suite 5: Recording & Transcription (Mock)
async function testRecordingFlow(runner) {
  console.log(`\n${colors.blue}=== TEST SUITE 4: RECORDING FLOW ===${colors.reset}\n`);

  await runner.test('Transcription API endpoint exists', async () => {
    // Test that endpoint exists (will fail without audio file, but should not 404)
    const response = await fetch(`${BASE_URL}/api/transcribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: runner.testSessionId,
      }),
    });

    // Should get 400 (missing file) not 404 (endpoint not found)
    runner.assertTrue(
      response.status === 400 || response.status === 500,
      `Transcribe endpoint should exist. Got: ${response.status}`
    );
  });

  await runner.test('Session notes table structure', async () => {
    // Verify table exists and can be queried
    const { error } = await supabase
      .from('session_notes')
      .select('id')
      .limit(1);

    runner.assertTrue(
      !error || error.message.includes('no rows'),
      'Session notes table should be accessible'
    );
  });

  await runner.test('Mock transcript creation', async () => {
    // Create a mock transcript for testing
    const { error } = await supabase
      .from('session_notes')
      .insert({
        session_id: runner.testSessionId,
        therapist_id: runner.testTherapistId,
        user_id: runner.testUserId,
        notes: 'Mock session transcript for E2E testing',
        transcript: 'Patient: I am feeling anxious. Therapist: Let us explore that.',
        ai_generated: true,
      });

    runner.assertTrue(!error, `Failed to create mock transcript: ${error?.message}`);
  });
}

// Test Suite 6: Session Completion
async function testSessionCompletion(runner) {
  console.log(`\n${colors.blue}=== TEST SUITE 5: SESSION COMPLETION ===${colors.reset}\n`);

  await runner.test('Mark session as completed', async () => {
    const { error } = await supabase
      .from('sessions')
      .update({
        status: 'completed',
        soap_notes: 'S: Patient reports anxiety\nO: Patient appears tense\nA: Generalized anxiety\nP: Continue therapy',
      })
      .eq('id', runner.testSessionId);

    runner.assertTrue(!error, 'Failed to complete session');
  });

  await runner.test('Verify session completion', async () => {
    const { data, error } = await supabase
      .from('sessions')
      .select('status, soap_notes')
      .eq('id', runner.testSessionId)
      .single();

    runner.assertTrue(!error, 'Failed to fetch session');
    runner.assertTrue(data.status === 'completed', 'Session should be completed');
    runner.assertTrue(!!data.soap_notes, 'Session should have SOAP notes');
  });
}

// Cleanup
async function cleanup(runner) {
  console.log(`\n${colors.yellow}=== CLEANUP: Removing Test Data ===${colors.reset}\n`);

  if (runner.testSessionId) {
    await supabase.from('session_notes').delete().eq('session_id', runner.testSessionId);
    await supabase.from('sessions').delete().eq('id', runner.testSessionId);
    console.log(`   Removed test session: ${runner.testSessionId}`);
  }

  if (runner.testUserId) {
    await supabase.from('users').delete().eq('id', runner.testUserId);
    console.log(`   Removed test user: ${runner.testUserId}`);
  }

  // Don't delete therapist (might be real)
}

// Main
async function main() {
  console.log(`${colors.cyan}
╔═══════════════════════════════════════════════════════════╗
║            QUIET THERAPY - E2E VIDEO TESTS                 ║
╚═══════════════════════════════════════════════════════════╝
${colors.reset}`);

  console.log(`Testing against: ${colors.yellow}${BASE_URL}${colors.reset}`);
  console.log(`Start time: ${new Date().toISOString()}\n`);

  const runner = new VideoTestRunner();

  try {
    await setupTestData(runner);
    await testSessionCreation(runner);
    await testDailyRoomCreation(runner);
    await testSessionData(runner);
    await testRecordingFlow(runner);
    await testSessionCompletion(runner);
    
    await cleanup(runner);

    const allPassed = runner.summary();
    process.exit(allPassed ? 0 : 1);

  } catch (error) {
    console.error(`${colors.red}\nFatal error: ${error.message}${colors.reset}`);
    console.error(error.stack);
    await cleanup(runner);
    process.exit(1);
  }
}

main();

