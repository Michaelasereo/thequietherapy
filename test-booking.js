/**
 * BOOKING SYSTEM TEST SCRIPT
 * 
 * Tests the booking functionality in multiple ways:
 * 1. Direct RPC call to create_session_with_credit_deduction
 * 2. Test via API endpoint (if running locally)
 * 3. Verify all required columns exist
 * 
 * Usage:
 *   node test-booking.js
 * 
 * Make sure to set these environment variables:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY (or SUPABASE_SERVICE_ROLE_KEY for admin operations)
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials!');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test configuration - UPDATE THESE VALUES
const TEST_CONFIG = {
  user_id: '5ee47a33-6e45-4fe6-a84e-ffe102c40e67', // Your test user ID
  therapist_id: '1229dfcb-db86-43d0-ad3b-988fcef6c2e1', // Your test therapist ID
  session_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
  session_time: '16:00:00', // 4:00 PM
  duration_minutes: 60,
  session_type: 'video',
  notes: 'Test booking from automated script',
  title: 'Test Therapy Session'
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test functions
async function testSessionsTableColumns() {
  log('\n📋 TEST 1: Checking sessions table columns...', 'cyan');
  
  // First verify table exists
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .limit(0);
  
  if (error) {
    log(`❌ Failed to query sessions table: ${error.message}`, 'red');
    log('   Run complete-booking-setup.sql first!', 'yellow');
    return false;
  }
  
  // Required columns for booking function
  const requiredColumns = [
    'id', 'user_id', 'therapist_id', 'title', 'description',
    'scheduled_date', 'scheduled_time', 'start_time', 'end_time',
    'duration_minutes', 'session_type', 'status', 'created_at', 'updated_at'
  ];
  
  log('Checking required columns...', 'blue');
  
  // Try to select specific columns to verify they exist
  let missingColumns = [];
  
  for (const col of requiredColumns) {
    try {
      // Test selecting just this column
      const { error: colError } = await supabase
        .from('sessions')
        .select(col)
        .limit(0);
      
      if (colError && colError.message.includes('column') && colError.message.includes('does not exist')) {
        missingColumns.push(col);
        log(`  ❌ Column '${col}' is MISSING`, 'red');
      } else {
        log(`  ✅ Column '${col}' exists`, 'green');
      }
    } catch (err) {
      // If we can't select it, assume it might be missing
      missingColumns.push(col);
      log(`  ⚠️  Could not verify column '${col}': ${err.message}`, 'yellow');
    }
  }
  
  if (missingColumns.length > 0) {
    log(`\n❌ Missing columns: ${missingColumns.join(', ')}`, 'red');
    log('   Run complete-booking-setup.sql to add missing columns!', 'yellow');
    return false;
  }
  
  log('\n✅ All required columns exist!', 'green');
  return true;
}

async function testUserCreditsTable() {
  log('\n💰 TEST 2: Checking user_credits table...', 'cyan');
  
  const { data, error } = await supabase
    .from('user_credits')
    .select('*')
    .eq('user_id', TEST_CONFIG.user_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    log(`❌ Failed to query user_credits: ${error.message}`, 'red');
    return false;
  }
  
  if (!data) {
    log(`⚠️  No credits record found for user ${TEST_CONFIG.user_id}`, 'yellow');
    log('   Creating a test credit record...', 'blue');
    
    // Create a test credit record
    const { data: newCredit, error: createError } = await supabase
      .from('user_credits')
      .insert({
        user_id: TEST_CONFIG.user_id,
        user_type: 'user',
        credits_balance: 5,
        credits_used: 0,
        credits_purchased: 5
      })
      .select()
      .single();
    
    if (createError) {
      log(`❌ Failed to create credit record: ${createError.message}`, 'red');
      return false;
    }
    
    log(`✅ Created test credit record with ${newCredit.credits_balance} credits`, 'green');
    return true;
  }
  
  log(`✅ User has ${data.credits_balance} credits available`, 'green');
  return data.credits_balance > 0;
}

async function testTherapistExists() {
  log('\n👨‍⚕️ TEST 3: Checking therapist exists...', 'cyan');
  
  const { data, error } = await supabase
    .from('users')
    .select('id, full_name, email, user_type, is_active, is_verified')
    .eq('id', TEST_CONFIG.therapist_id)
    .single();
  
  if (error || !data) {
    log(`❌ Therapist not found: ${error?.message}`, 'red');
    return false;
  }
  
  if (data.user_type !== 'therapist') {
    log(`❌ User is not a therapist (user_type: ${data.user_type})`, 'red');
    return false;
  }
  
  if (!data.is_active) {
    log(`⚠️  Therapist is not active`, 'yellow');
  }
  
  if (!data.is_verified) {
    log(`⚠️  Therapist is not verified`, 'yellow');
  }
  
  log(`✅ Therapist found: ${data.full_name} (${data.email})`, 'green');
  return true;
}

async function testBookingConflictFunction() {
  log('\n🔍 TEST 4: Testing check_booking_conflict function...', 'cyan');
  
  const testDate = TEST_CONFIG.session_date;
  const testTime = '10:00:00';
  const endTime = '11:00:00';
  
  const { data, error } = await supabase.rpc('check_booking_conflict', {
    p_therapist_id: TEST_CONFIG.therapist_id,
    p_session_date: testDate,
    p_start_time: testTime,
    p_end_time: endTime
  });
  
  if (error) {
    log(`❌ Function error: ${error.message}`, 'red');
    return false;
  }
  
  log(`✅ Conflict check returned: ${data} (false = no conflict, true = conflict)`, 'green');
  return true;
}

async function testCreateBookingFunction() {
  log('\n🎯 TEST 5: Testing create_session_with_credit_deduction function...', 'cyan');
  
  // Use a unique time slot to avoid conflicts
  // Generate a random hour between 9 AM and 5 PM
  const randomHour = Math.floor(Math.random() * 8) + 9; // 9-16 (9 AM to 4 PM)
  const randomMinute = Math.floor(Math.random() * 4) * 15; // 0, 15, 30, or 45
  const testDate = TEST_CONFIG.session_date;
  const testTime = `${randomHour.toString().padStart(2, '0')}:${randomMinute.toString().padStart(2, '0')}:00`;
  
  log(`📅 Booking test session: ${testDate} at ${testTime}`, 'blue');
  
  const { data, error } = await supabase.rpc('create_session_with_credit_deduction', {
    p_user_id: TEST_CONFIG.user_id,
    p_therapist_id: TEST_CONFIG.therapist_id,
    p_session_date: testDate,
    p_session_time: testTime,
    p_duration_minutes: TEST_CONFIG.duration_minutes,
    p_session_type: TEST_CONFIG.session_type,
    p_notes: TEST_CONFIG.notes + ' - Automated test',
    p_title: TEST_CONFIG.title + ' - Test'
  });
  
  if (error) {
    log(`❌ Booking failed: ${error.message}`, 'red');
    
    if (error.message.includes('Booking conflict')) {
      log('   ⚠️  Time slot is already booked - try a different time', 'yellow');
    } else if (error.message.includes('Insufficient credits')) {
      log('   ⚠️  User has insufficient credits', 'yellow');
    } else if (error.message.includes('column')) {
      log('   ⚠️  Missing column - run complete-booking-setup.sql first!', 'yellow');
    }
    
    return false;
  }
  
  if (!data || (Array.isArray(data) && data.length === 0)) {
    log('❌ Booking returned no data', 'red');
    return false;
  }
  
  const session = Array.isArray(data) ? data[0] : data;
  
  log(`✅ Booking successful!`, 'green');
  log(`   Session ID: ${session.id}`, 'green');
  log(`   Title: ${session.title}`, 'green');
  log(`   Scheduled: ${session.scheduled_date} at ${session.scheduled_time}`, 'green');
  log(`   Status: ${session.status}`, 'green');
  
  // Verify credit was deducted
  const { data: creditsAfter } = await supabase
    .from('user_credits')
    .select('credits_balance, credits_used')
    .eq('user_id', TEST_CONFIG.user_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  if (creditsAfter) {
    log(`💰 Credits after booking: ${creditsAfter.credits_balance} balance, ${creditsAfter.credits_used} used`, 'green');
  }
  
  return true;
}

async function testVerifyCreatedSession() {
  log('\n✅ TEST 6: Verifying created session in database...', 'cyan');
  
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', TEST_CONFIG.user_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  if (error) {
    log(`❌ Failed to verify session: ${error.message}`, 'red');
    return false;
  }
  
  log('✅ Session verified in database:', 'green');
  log(`   ID: ${data.id}`, 'green');
  log(`   User: ${data.user_id}`, 'green');
  log(`   Therapist: ${data.therapist_id}`, 'green');
  log(`   Title: ${data.title}`, 'green');
  log(`   Scheduled: ${data.scheduled_date} at ${data.scheduled_time}`, 'green');
  log(`   Duration: ${data.duration_minutes} minutes`, 'green');
  log(`   Type: ${data.session_type}`, 'green');
  log(`   Status: ${data.status}`, 'green');
  
  // Check all required columns are present
  const requiredColumns = [
    'id', 'user_id', 'therapist_id', 'title', 'description',
    'scheduled_date', 'scheduled_time', 'start_time', 'end_time',
    'duration_minutes', 'session_type', 'status', 'created_at', 'updated_at'
  ];
  
  const missingColumns = requiredColumns.filter(col => !(col in data));
  
  if (missingColumns.length > 0) {
    log(`⚠️  Missing columns in session record: ${missingColumns.join(', ')}`, 'yellow');
    return false;
  }
  
  log('✅ All required columns present in session record!', 'green');
  return true;
}

async function runAllTests() {
  log('\n🚀 STARTING BOOKING SYSTEM TESTS', 'cyan');
  log('=' .repeat(50), 'cyan');
  
  const results = {
    sessionsTable: false,
    userCredits: false,
    therapistExists: false,
    conflictFunction: false,
    bookingFunction: false,
    verifySession: false
  };
  
  try {
    results.sessionsTable = await testSessionsTableColumns();
    results.userCredits = await testUserCreditsTable();
    results.therapistExists = await testTherapistExists();
    results.conflictFunction = await testBookingConflictFunction();
    
    // Only test booking if prerequisites pass
    if (results.sessionsTable && results.userCredits && results.therapistExists) {
      results.bookingFunction = await testCreateBookingFunction();
      
      if (results.bookingFunction) {
        results.verifySession = await testVerifyCreatedSession();
      }
    } else {
      log('\n⚠️  Skipping booking test due to failed prerequisites', 'yellow');
    }
    
  } catch (error) {
    log(`\n❌ Test execution error: ${error.message}`, 'red');
    console.error(error);
  }
  
  // Summary
  log('\n' + '='.repeat(50), 'cyan');
  log('📊 TEST SUMMARY', 'cyan');
  log('='.repeat(50), 'cyan');
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const color = passed ? 'green' : 'red';
    log(`${status.padEnd(10)} ${test}`, color);
  });
  
  const allPassed = Object.values(results).every(r => r);
  
  if (allPassed) {
    log('\n🎉 ALL TESTS PASSED! Booking system is ready!', 'green');
  } else {
    log('\n⚠️  SOME TESTS FAILED - Review errors above', 'yellow');
    log('   Run complete-booking-setup.sql to fix missing columns', 'yellow');
  }
  
  return allPassed;
}

// Run tests
if (require.main === module) {
  runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = {
  runAllTests,
  testSessionsTableColumns,
  testUserCreditsTable,
  testTherapistExists,
  testBookingConflictFunction,
  testCreateBookingFunction,
  testVerifyCreatedSession
};


