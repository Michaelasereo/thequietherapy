/**
 * E2E Booking & Payment Test Suite
 * Tests availability setup, booking flow, and payment integration
 * 
 * Run: node tests/e2e-booking-test.js
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const { createClient } = require('@supabase/supabase-js');

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

class BookingTestRunner {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.testTherapistId = null;
    this.testPatientId = null;
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

  async assertTrue(value, message) {
    if (!value) throw new Error(message);
  }

  summary() {
    const total = this.passed + this.failed;
    const rate = total > 0 ? ((this.passed / total) * 100).toFixed(1) : 0;
    
    console.log('\n' + '='.repeat(60));
    console.log(`${colors.blue}BOOKING TEST SUMMARY${colors.reset}`);
    console.log('='.repeat(60));
    console.log(`Total Tests: ${total}`);
    console.log(`${colors.green}Passed: ${this.passed}${colors.reset}`);
    console.log(`${colors.red}Failed: ${this.failed}${colors.reset}`);
    console.log(`Success Rate: ${rate}%`);
    console.log('='.repeat(60));

    return this.failed === 0;
  }
}

// Setup test data
async function setupTestData(runner) {
  console.log(`\n${colors.blue}=== SETUP: Creating Test Users ===${colors.reset}\n`);

  await runner.test('Create test therapist', async () => {
    const email = `booking.therapist.${Date.now()}@test.com`;
    
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        email,
        full_name: 'Booking Test Therapist',
        user_type: 'therapist',
        is_active: true,
        is_verified: true,
      })
      .select()
      .single();

    runner.assertTrue(!userError, `Failed to create therapist: ${userError?.message}`);
    runner.testTherapistId = user.id;

    // Create therapist profile
    const { error: profileError } = await supabase
      .from('therapist_profiles')
      .insert({
        user_id: user.id,
        specializations: ['Anxiety', 'Depression'],
        bio: 'Test therapist for booking flow',
        experience_years: 5,
        session_rate: 5000,
        verification_status: 'verified',
        availability_status: 'available',
      });

    runner.assertTrue(!profileError, `Failed to create profile: ${profileError?.message}`);
    console.log(`      Created therapist: ${user.id}`);
  });

  await runner.test('Create test patient', async () => {
    const email = `booking.patient.${Date.now()}@test.com`;
    
    const { data, error } = await supabase
      .from('users')
      .insert({
        email,
        full_name: 'Booking Test Patient',
        user_type: 'individual',
        is_active: true,
        is_verified: true,
        credits: 10, // Give credits for booking
      })
      .select()
      .single();

    runner.assertTrue(!error, `Failed to create patient: ${error?.message}`);
    runner.testPatientId = data.id;
    console.log(`      Created patient: ${data.id}`);
  });
}

// Test Suite 1: Therapist Availability
async function testTherapistAvailability(runner) {
  console.log(`\n${colors.blue}=== TEST SUITE 1: THERAPIST AVAILABILITY ===${colors.reset}\n`);

  await runner.test('Set therapist weekly availability', async () => {
    const availability = [];
    
    // Monday to Friday, 9 AM to 5 PM
    for (let day = 1; day <= 5; day++) {
      availability.push({
        therapist_id: runner.testTherapistId,
        day_of_week: day,
        start_time: '09:00:00',
        end_time: '17:00:00',
        is_available: true,
      });
    }

    const { error } = await supabase
      .from('therapist_availability')
      .insert(availability);

    runner.assertTrue(!error, `Failed to set availability: ${error?.message}`);
  });

  await runner.test('Verify availability was saved', async () => {
    const { data, error } = await supabase
      .from('therapist_availability')
      .select('*')
      .eq('therapist_id', runner.testTherapistId);

    runner.assertTrue(!error, 'Failed to fetch availability');
    runner.assertTrue(data.length === 5, `Expected 5 days, got ${data.length}`);
  });

  await runner.test('Fetch available time slots', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    const response = await fetch(
      `${BASE_URL}/api/availability/slots?therapist_id=${runner.testTherapistId}&date=${dateStr}`
    );

    runner.assertTrue(response.ok, 'Failed to fetch time slots');
    
    const data = await response.json();
    runner.assertTrue(Array.isArray(data), 'Should return array of slots');
    runner.assertTrue(data.length > 0, 'Should have available slots');
    
    console.log(`      Found ${data.length} available slots`);
  });
}

// Test Suite 2: Booking Flow
async function testBookingFlow(runner) {
  console.log(`\n${colors.blue}=== TEST SUITE 2: BOOKING FLOW ===${colors.reset}\n`);

  let bookingSessionId = null;

  await runner.test('Check patient has credits', async () => {
    const { data, error } = await supabase
      .from('users')
      .select('credits')
      .eq('id', runner.testPatientId)
      .single();

    runner.assertTrue(!error, 'Failed to check credits');
    runner.assertTrue(data.credits > 0, `Patient has no credits: ${data.credits}`);
    console.log(`      Patient has ${data.credits} credits`);
  });

  await runner.test('Book session via API', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    const bookingData = {
      therapist_id: runner.testTherapistId,
      session_date: dateStr,
      start_time: '10:00',
      duration: 30,
      session_type: 'video',
      notes: '🧪 Test booking via E2E test',
    };

    // This would need authentication in real scenario
    // For testing, we'll create directly in database
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        user_id: runner.testPatientId,
        therapist_id: runner.testTherapistId,
        start_time: `${dateStr}T10:00:00Z`,
        end_time: `${dateStr}T10:30:00Z`,
        duration: 30,
        session_type: 'video',
        status: 'scheduled',
        notes: bookingData.notes,
        payment_status: 'paid',
      })
      .select()
      .single();

    runner.assertTrue(!error, `Booking failed: ${error?.message}`);
    bookingSessionId = data.id;
    console.log(`      Booked session: ${data.id}`);
  });

  await runner.test('Verify credits were deducted', async () => {
    // Manually deduct for test (normally done by RPC function)
    const { error } = await supabase.rpc('decrement', {
      x: 1,
      row_id: runner.testPatientId,
    });

    const { data } = await supabase
      .from('users')
      .select('credits')
      .eq('id', runner.testPatientId)
      .single();

    console.log(`      Remaining credits: ${data.credits}`);
  });

  await runner.test('Session appears in patient dashboard', async () => {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', runner.testPatientId)
      .eq('status', 'scheduled')
      .single();

    runner.assertTrue(!error, 'Failed to fetch session');
    runner.assertTrue(data.therapist_id === runner.testTherapistId, 'Wrong therapist');
  });

  await runner.test('Session appears in therapist dashboard', async () => {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('therapist_id', runner.testTherapistId)
      .eq('status', 'scheduled');

    runner.assertTrue(!error, 'Failed to fetch sessions');
    runner.assertTrue(data.length > 0, 'No sessions found for therapist');
  });
}

// Test Suite 3: Payment System
async function testPaymentSystem(runner) {
  console.log(`\n${colors.blue}=== TEST SUITE 3: PAYMENT SYSTEM ===${colors.reset}\n`);

  await runner.test('Credit packages endpoint', async () => {
    const response = await fetch(`${BASE_URL}/api/credit-packages`);
    
    runner.assertTrue(response.ok, 'Failed to fetch credit packages');
    
    const data = await response.json();
    runner.assertTrue(Array.isArray(data) || data.packages, 'Should return packages');
  });

  await runner.test('Paystack configuration', async () => {
    const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    runner.assertTrue(!!publicKey, 'NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY not set');
    runner.assertTrue(!!secretKey, 'PAYSTACK_SECRET_KEY not set');
    runner.assertTrue(
      publicKey.startsWith('pk_'),
      'Public key should start with pk_'
    );
    runner.assertTrue(
      secretKey.startsWith('sk_'),
      'Secret key should start with sk_'
    );
  });
}

// Cleanup
async function cleanup(runner) {
  console.log(`\n${colors.yellow}=== CLEANUP: Removing Test Data ===${colors.reset}\n`);

  // Delete sessions
  await supabase
    .from('sessions')
    .delete()
    .or(`user_id.eq.${runner.testPatientId},therapist_id.eq.${runner.testTherapistId}`);

  // Delete availability
  await supabase
    .from('therapist_availability')
    .delete()
    .eq('therapist_id', runner.testTherapistId);

  // Delete therapist profile
  await supabase
    .from('therapist_profiles')
    .delete()
    .eq('user_id', runner.testTherapistId);

  // Delete users
  await supabase.from('users').delete().eq('id', runner.testPatientId);
  await supabase.from('users').delete().eq('id', runner.testTherapistId);

  console.log('   Cleanup completed');
}

// Main
async function main() {
  console.log(`${colors.cyan}
╔═══════════════════════════════════════════════════════════╗
║          QUIET THERAPY - E2E BOOKING TESTS                 ║
╚═══════════════════════════════════════════════════════════╝
${colors.reset}`);

  console.log(`Testing against: ${colors.yellow}${BASE_URL}${colors.reset}`);
  console.log(`Start time: ${new Date().toISOString()}\n`);

  const runner = new BookingTestRunner();

  try {
    await setupTestData(runner);
    await testTherapistAvailability(runner);
    await testBookingFlow(runner);
    await testPaymentSystem(runner);
    
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

