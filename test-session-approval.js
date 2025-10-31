/**
 * Session Approval System Test Script
 * Tests the complete flow: Create → Approve → Verify
 * 
 * Usage:
 *   Node: node test-session-approval.js
 *   Browser: Copy/paste into console (after logging in as therapist and user)
 */

const BASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('localhost') 
  ? 'http://localhost:3000' 
  : (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000');

// Test configuration (supports env vars and CLI args)
const TEST_CONFIG = {
  // These should be actual user IDs from your database
  therapist_id: process.env.TEST_THERAPIST_ID || null,
  patient_id: process.env.TEST_PATIENT_ID || null,
  session_id: null, // Set after creating session
};

// Parse simple CLI args: --therapist <id> --patient <id>
try {
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--therapist' && argv[i + 1]) {
      TEST_CONFIG.therapist_id = argv[i + 1];
      i++;
    } else if (argv[i] === '--patient' && argv[i + 1]) {
      TEST_CONFIG.patient_id = argv[i + 1];
      i++;
    }
  }
} catch {}

// Color logging
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[33m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, type = 'info') {
  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    warning: '⚠️',
    test: '🧪',
  };
  
  const color = type === 'success' ? colors.green :
                type === 'error' ? colors.red :
                type === 'warning' ? colors.yellow :
                type === 'test' ? colors.cyan : colors.blue;
  
  const icon = icons[type] || icons.info;
  console.log(`${color}${icon} ${message}${colors.reset}`);
}

function logSection(title) {
  console.log(`\n${colors.bright}${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}${title}${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
}

// Test result tracking
const testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
};

function logTest(name, status, message = '') {
  if (status === 'pass') {
    log(`${name}: ${message || 'PASSED'}`, 'success');
    testResults.passed++;
  } else if (status === 'fail') {
    log(`${name}: ${message || 'FAILED'}`, 'error');
    testResults.failed++;
  } else {
    log(`${name}: ${message || 'WARNING'}`, 'warning');
    testResults.warnings++;
  }
}

/**
 * TEST 1: Get Test Users
 * Fetches a therapist and patient for testing
 */
async function getTestUsers() {
  logSection('TEST 1: Get Test Users');
  
  try {
    // 1) Therapist: fetch any therapist if not provided
    if (!TEST_CONFIG.therapist_id) {
      const response = await fetch(`${BASE_URL}/api/therapists?limit=1`);
      const data = await response.json();
      if (data.success && data.therapists?.length > 0) {
        TEST_CONFIG.therapist_id = data.therapists[0].id;
        logTest('Get Therapist', 'pass', `Found therapist: ${data.therapists[0].full_name}`);
      } else {
        logTest('Get Therapist', 'warning', 'No therapists found. You may need to create test users manually.');
      }
    } else {
      logTest('Get Therapist (from input)', 'pass', `Therapist ID: ${TEST_CONFIG.therapist_id}`);
    }

    // 2) Patient: try to infer a patient from the therapist's recent sessions if not provided
    if (!TEST_CONFIG.patient_id && TEST_CONFIG.therapist_id) {
      try {
        const sessResp = await fetch(`${BASE_URL}/api/sessions?therapist_id=${TEST_CONFIG.therapist_id}&order=created_at.desc&limit=25`, {
          credentials: 'include',
        });
        const sessData = await sessResp.json();
        if (sessResp.ok && sessData.success && Array.isArray(sessData.sessions) && sessData.sessions.length > 0) {
          const withUser = sessData.sessions.find(s => s.user_id);
          if (withUser?.user_id) {
            TEST_CONFIG.patient_id = withUser.user_id;
            logTest('Infer Patient', 'pass', `Using patient from recent session: ${withUser.user_id}`);
          }
        }
      } catch {}
    }

    // 3) Final check
    if (!TEST_CONFIG.patient_id) {
      logTest('Get Patient', 'warning', 'Could not auto-detect a patient. Provide TEST_PATIENT_ID, --patient, or login in browser and run from console.');
    }
  } catch (error) {
    logTest('Get Test Users', 'fail', error.message);
    log('You may need to set TEST_THERAPIST_ID/TEST_PATIENT_ID env vars or CLI args.', 'warning');
  }
}

/**
 * TEST 2: Create Custom Scheduled Session
 * Therapist creates a session requiring approval
 */
async function createCustomScheduledSession() {
  logSection('TEST 2: Create Custom Scheduled Session');
  
  if (!TEST_CONFIG.therapist_id || !TEST_CONFIG.patient_id) {
    logTest('Create Custom Session', 'warning', 'Skipped - Missing test user IDs. Set TEST_CONFIG.therapist_id and TEST_CONFIG.patient_id first.');
    return;
  }
  
  try {
    const sessionDate = new Date();
    sessionDate.setDate(sessionDate.getDate() + 2); // 2 days from now
    const dateStr = sessionDate.toISOString().split('T')[0];
    const timeStr = '14:00';
    
    log(`Creating custom session for ${dateStr} at ${timeStr}`, 'info');
    
    const response = await fetch(`${BASE_URL}/api/therapist/create-custom-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Important for cookies/auth
      body: JSON.stringify({
        patient_id: TEST_CONFIG.patient_id,
        session_date: dateStr,
        session_time: timeStr,
        duration_minutes: 30,
        session_type: 'video',
        notes: 'Test custom session - please approve',
        title: 'Test Custom Session',
        is_instant: false,
      }),
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      TEST_CONFIG.session_id = data.session.id;
      logTest('Create Custom Session', 'pass', `Session created: ${data.session.id}`);
      log(`Session Status: ${data.session.status}`, 'info');
      log(`Requires Approval: ${data.session.requires_approval}`, 'info');
      log(`Is Instant: ${data.session.is_instant}`, 'info');
      return data.session;
    } else {
      logTest('Create Custom Session', 'fail', data.error || 'Unknown error');
      if (data.details) log(`Details: ${data.details}`, 'error');
      return null;
    }
  } catch (error) {
    logTest('Create Custom Session', 'fail', error.message);
    return null;
  }
}

/**
 * TEST 3: Create Instant Session
 * Therapist creates an instant session requiring approval
 */
async function createInstantSession() {
  logSection('TEST 3: Create Instant Session');
  
  if (!TEST_CONFIG.therapist_id || !TEST_CONFIG.patient_id) {
    logTest('Create Instant Session', 'warning', 'Skipped - Missing test user IDs');
    return;
  }
  
  try {
    log('Creating instant session...', 'info');
    
    const response = await fetch(`${BASE_URL}/api/therapist/create-custom-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        patient_id: TEST_CONFIG.patient_id,
        duration_minutes: 30,
        session_type: 'video',
        notes: 'Test instant session - approve and join now!',
        title: 'Test Instant Session',
        is_instant: true,
      }),
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      const instantSessionId = data.session.id;
      logTest('Create Instant Session', 'pass', `Instant session created: ${instantSessionId}`);
      log(`Session Status: ${data.session.status}`, 'info');
      log(`Is Instant: ${data.session.is_instant}`, 'info');
      log(`Room Created: ${data.session.session_url ? 'Yes' : 'No'}`, 'info');
      return data.session;
    } else {
      logTest('Create Instant Session', 'fail', data.error || 'Unknown error');
      if (data.details) log(`Details: ${data.details}`, 'error');
      return null;
    }
  } catch (error) {
    logTest('Create Instant Session', 'fail', error.message);
    return null;
  }
}

/**
 * TEST 4: Get Pending Sessions
 * User fetches their pending sessions
 */
async function getPendingSessions() {
  logSection('TEST 4: Get Pending Sessions');
  
  try {
    log('Fetching pending sessions...', 'info');
    
    const response = await fetch(`${BASE_URL}/api/sessions/pending`, {
      method: 'GET',
      credentials: 'include',
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      const pendingCount = data.sessions?.length || 0;
      logTest('Get Pending Sessions', 'pass', `Found ${pendingCount} pending session(s)`);
      
      if (pendingCount > 0) {
        data.sessions.forEach((session, idx) => {
          log(`  ${idx + 1}. ${session.title} (${session.id.substring(0, 8)}...)`, 'info');
          log(`     Status: ${session.status} | Instant: ${session.is_instant}`, 'info');
        });
      }
      
      // Use the first pending session if we don't have a session_id yet
      if (pendingCount > 0 && !TEST_CONFIG.session_id) {
        TEST_CONFIG.session_id = data.sessions[0].id;
      }
      
      return data.sessions || [];
    } else {
      logTest('Get Pending Sessions', 'fail', data.error || 'Unknown error');
      return [];
    }
  } catch (error) {
    logTest('Get Pending Sessions', 'fail', error.message);
    return [];
  }
}

/**
 * TEST 5: Check User Credits
 * Verifies user has credits before approval
 */
async function checkUserCredits() {
  logSection('TEST 5: Check User Credits');
  
  if (!TEST_CONFIG.patient_id) {
    logTest('Check Credits', 'warning', 'Skipped - Missing patient ID');
    return null;
  }
  
  try {
    // This might need auth, so we'll try with cookies
    const response = await fetch(`${BASE_URL}/api/credits/user`, {
      method: 'GET',
      credentials: 'include',
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      const credits = data.credits?.credits_balance || 0;
      logTest('Check User Credits', 'pass', `User has ${credits} credits`);
      return data.credits;
    } else {
      logTest('Check User Credits', 'warning', 'Could not fetch credits (may need auth)');
      return null;
    }
  } catch (error) {
    logTest('Check User Credits', 'warning', error.message);
    return null;
  }
}

/**
 * TEST 6: Approve Session
 * User approves a pending session (deducts credit)
 */
async function approveSession(sessionId = null) {
  logSection('TEST 6: Approve Session');
  
  const targetSessionId = sessionId || TEST_CONFIG.session_id;
  
  if (!targetSessionId) {
    logTest('Approve Session', 'warning', 'Skipped - No session ID available');
    return null;
  }
  
  try {
    log(`Approving session: ${targetSessionId.substring(0, 8)}...`, 'info');
    
    const response = await fetch(`${BASE_URL}/api/sessions/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        session_id: targetSessionId,
      }),
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      logTest('Approve Session', 'pass', 'Session approved successfully');
      log(`New Status: ${data.session.status}`, 'info');
      log(`Credits After: ${data.session.credits_balance_after || 'N/A'}`, 'info');
      log(`Message: ${data.message}`, 'info');
      
      if (data.session.is_instant && data.session.session_url) {
        log(`Instant Session URL: ${data.session.session_url}`, 'info');
      }
      
      return data.session;
    } else {
      logTest('Approve Session', 'fail', data.error || 'Unknown error');
      if (data.details) log(`Details: ${data.details}`, 'error');
      
      // Handle specific errors
      if (data.error?.includes('credits')) {
        log('User needs credits to approve session', 'warning');
      }
      if (data.error?.includes('not found')) {
        log('Session may already be approved or does not exist', 'warning');
      }
      
      return null;
    }
  } catch (error) {
    logTest('Approve Session', 'fail', error.message);
    return null;
  }
}

/**
 * TEST 7: Verify Session Status
 * Checks that session status changed correctly after approval
 */
async function verifySessionStatus(sessionId = null) {
  logSection('TEST 7: Verify Session Status');
  
  const targetSessionId = sessionId || TEST_CONFIG.session_id;
  
  if (!targetSessionId) {
    logTest('Verify Status', 'warning', 'Skipped - No session ID');
    return;
  }
  
  try {
    const response = await fetch(`${BASE_URL}/api/sessions?session_id=${targetSessionId}`, {
      method: 'GET',
      credentials: 'include',
    });
    
    const data = await response.json();
    
    if (response.ok && data.success && data.sessions?.length > 0) {
      const session = data.sessions[0];
      const isApproved = session.status === 'scheduled' || session.status === 'confirmed';
      
      logTest('Verify Status', isApproved ? 'pass' : 'fail', 
        `Status: ${session.status} (Expected: scheduled or confirmed)`);
      
      if (session.is_instant) {
        log(`Is Instant: ${session.is_instant}`, 'info');
        log(`Should be 'confirmed': ${session.status === 'confirmed' ? '✅' : '❌'}`, 'info');
      } else {
        log(`Should be 'scheduled': ${session.status === 'scheduled' ? '✅' : '❌'}`, 'info');
      }
      
      return session;
    } else {
      logTest('Verify Status', 'warning', 'Could not fetch session');
      return null;
    }
  } catch (error) {
    logTest('Verify Status', 'warning', error.message);
    return null;
  }
}

/**
 * RUN ALL TESTS
 */
async function runAllTests() {
  console.log(`\n${colors.bright}${colors.cyan}`);
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║  SESSION APPROVAL SYSTEM - COMPREHENSIVE TEST      ║');
  console.log('╚════════════════════════════════════════════════════╝');
  console.log(colors.reset);
  
  log(`Testing against: ${BASE_URL}`, 'info');
  log('Note: Some tests require authentication cookies', 'warning');
  log('', 'info');
  
  // Test 1: Get test users
  await getTestUsers();
  
  // Test 2: Create custom scheduled session
  await createCustomScheduledSession();
  
  // Test 3: Create instant session
  await createInstantSession();
  
  // Test 4: Get pending sessions
  const pendingSessions = await getPendingSessions();
  
  // Test 5: Check credits
  await checkUserCredits();
  
  // Test 6: Approve a session (if we have one)
  if (pendingSessions.length > 0) {
    // Approve the first pending session
    const approvedSession = await approveSession(pendingSessions[0].id);
    
    // Test 7: Verify status
    if (approvedSession) {
      await verifySessionStatus(pendingSessions[0].id);
    }
  } else {
    log('No pending sessions to approve. Create a session first.', 'warning');
  }
  
  // Summary
  logSection('TEST SUMMARY');
  log(`✅ Passed: ${testResults.passed}`, 'success');
  log(`❌ Failed: ${testResults.failed}`, testResults.failed > 0 ? 'error' : 'success');
  log(`⚠️  Warnings: ${testResults.warnings}`, 'warning');
  
  if (testResults.failed === 0 && testResults.passed > 0) {
    log('\n🎉 All critical tests passed!', 'success');
  } else if (testResults.failed > 0) {
    log('\n⚠️  Some tests failed. Check authentication and database setup.', 'warning');
  }
  
  return {
    passed: testResults.passed,
    failed: testResults.failed,
    warnings: testResults.warnings,
  };
}

// Export for Node.js or Browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    runAllTests,
    createCustomScheduledSession,
    createInstantSession,
    getPendingSessions,
    approveSession,
    TEST_CONFIG,
  };
}

// Auto-run if called directly (Node.js)
if (require.main === module) {
  runAllTests().catch(console.error);
}

// Browser-friendly export
if (typeof window !== 'undefined') {
  window.testSessionApproval = {
    runAllTests,
    createCustomScheduledSession,
    createInstantSession,
    getPendingSessions,
    approveSession,
    checkUserCredits,
    verifySessionStatus,
    TEST_CONFIG,
  };
  
  console.log('%cSession Approval Test Suite Loaded!', 'color: #00ff00; font-size: 16px; font-weight: bold;');
  console.log('Run: testSessionApproval.runAllTests()');
  console.log('Or test individual functions:');
  console.log('  - testSessionApproval.createCustomScheduledSession()');
  console.log('  - testSessionApproval.createInstantSession()');
  console.log('  - testSessionApproval.getPendingSessions()');
  console.log('  - testSessionApproval.approveSession(sessionId)');
}

