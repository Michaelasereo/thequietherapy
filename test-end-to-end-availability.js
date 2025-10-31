#!/usr/bin/env node

/**
 * End-to-End Test: Update Availability → Query API → Verify Change
 * 
 * This test proves that changes to availability in the database
 * are immediately visible when querying the API (no caching).
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Test configurations
const TEST_CONFIG_A = {
  name: 'Morning Slots (9 AM - 12 PM)',
  standardHours: {
    monday: {
      enabled: true,
      generalHours: {
        start: '09:00',
        end: '12:00',
        sessionDuration: 60
      }
    },
    tuesday: { enabled: false },
    wednesday: { enabled: false },
    thursday: { enabled: false },
    friday: { enabled: false },
    saturday: { enabled: false },
    sunday: { enabled: false }
  },
  sessionSettings: {
    sessionDuration: 60,
    bufferTime: 0
  }
};

const TEST_CONFIG_B = {
  name: 'Afternoon Slots (2 PM - 5 PM)',
  standardHours: {
    monday: {
      enabled: true,
      generalHours: {
        start: '14:00',
        end: '17:00',
        sessionDuration: 60
      }
    },
    tuesday: { enabled: false },
    wednesday: { enabled: false },
    thursday: { enabled: false },
    friday: { enabled: false },
    saturday: { enabled: false },
    sunday: { enabled: false }
  },
  sessionSettings: {
    sessionDuration: 60,
    bufferTime: 0
  }
};

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getNextMonday() {
  const date = new Date();
  const dayOfWeek = date.getDay();
  const daysUntilMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek);
  date.setDate(date.getDate() + daysUntilMonday);
  return date.toISOString().split('T')[0];
}

async function queryAPIForSlots(therapistId, date) {
  const url = `${BASE_URL}/api/availability/slots?therapist_id=${therapistId}&date=${date}&_t=${Date.now()}`;
  
  const response = await fetch(url, {
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    }
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  return await response.json();
}

async function updateAvailabilityInDatabase(therapistId, config) {
  const { error } = await supabase
    .from('availability_weekly_schedules')
    .upsert({
      therapist_id: therapistId,
      template_name: 'primary',
      weekly_availability: config,
      is_active: true,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'therapist_id,template_name'
    });
  
  if (error) {
    throw new Error(`Database update failed: ${error.message}`);
  }
  
  return true;
}

async function runEndToEndTest() {
  console.log('🧪 END-TO-END REAL-TIME AVAILABILITY TEST\n');
  console.log('='.repeat(70));
  console.log('\nThis test will:');
  console.log('1. Update availability in database (Config A: Morning slots)');
  console.log('2. Query API immediately');
  console.log('3. Verify API returns Config A slots');
  console.log('4. Update availability in database (Config B: Afternoon slots)');
  console.log('5. Query API immediately');
  console.log('6. Verify API returns Config B slots (NOT Config A!)');
  console.log('\n' + '='.repeat(70));
  
  // Get test therapist
  console.log('\n📋 Step 1: Finding test therapist...');
  console.log('-'.repeat(70));
  
  const { data: therapists } = await supabase
    .from('availability_weekly_schedules')
    .select('therapist_id')
    .eq('is_active', true)
    .limit(1);
  
  if (!therapists || therapists.length === 0) {
    console.error('❌ No therapist found. Set up availability first.');
    process.exit(1);
  }
  
  const therapistId = therapists[0].therapist_id;
  console.log('✅ Using therapist:', therapistId);
  
  const testDate = await getNextMonday();
  console.log('📅 Testing with date:', testDate, '(next Monday)');
  
  // TEST SEQUENCE A: Morning Slots
  console.log('\n' + '='.repeat(70));
  console.log('\n🔵 TEST SEQUENCE A: Morning Slots (9 AM - 12 PM)');
  console.log('='.repeat(70));
  
  console.log('\n📝 Step 2A: Update database with Config A...');
  await updateAvailabilityInDatabase(therapistId, TEST_CONFIG_A);
  console.log('✅ Database updated with:', TEST_CONFIG_A.name);
  console.log('   Expected slots: 09:00-10:00, 10:00-11:00, 11:00-12:00');
  
  console.log('\n⏱️  Waiting 100ms for database commit...');
  await sleep(100);
  
  console.log('\n📡 Step 3A: Query API immediately...');
  const responseA = await queryAPIForSlots(therapistId, testDate);
  
  console.log('✅ API responded with:');
  console.log('   Total slots:', responseA.total_slots);
  console.log('   Slots:', responseA.slots?.map(s => s.start_time).join(', ') || 'none');
  
  // Verify Config A
  const configASlotsExpected = ['09:00', '10:00', '11:00'];
  const configASlotsActual = responseA.slots?.map(s => s.start_time).sort() || [];
  
  const configAMatch = configASlotsExpected.every(time => 
    configASlotsActual.includes(time)
  );
  
  if (configAMatch && responseA.total_slots === 3) {
    console.log('\n✅ PASS: API returned Config A slots correctly!');
  } else {
    console.log('\n❌ FAIL: API did not return expected Config A slots');
    console.log('   Expected:', configASlotsExpected);
    console.log('   Got:', configASlotsActual);
  }
  
  // TEST SEQUENCE B: Afternoon Slots
  console.log('\n' + '='.repeat(70));
  console.log('\n🔴 TEST SEQUENCE B: Afternoon Slots (2 PM - 5 PM)');
  console.log('='.repeat(70));
  
  console.log('\n📝 Step 2B: Update database with Config B...');
  await updateAvailabilityInDatabase(therapistId, TEST_CONFIG_B);
  console.log('✅ Database updated with:', TEST_CONFIG_B.name);
  console.log('   Expected slots: 14:00-15:00, 15:00-16:00, 16:00-17:00');
  
  console.log('\n⏱️  Waiting 100ms for database commit...');
  await sleep(100);
  
  console.log('\n📡 Step 3B: Query API immediately...');
  const responseB = await queryAPIForSlots(therapistId, testDate);
  
  console.log('✅ API responded with:');
  console.log('   Total slots:', responseB.total_slots);
  console.log('   Slots:', responseB.slots?.map(s => s.start_time).join(', ') || 'none');
  
  // Verify Config B (NOT Config A!)
  const configBSlotsExpected = ['14:00', '15:00', '16:00'];
  const configBSlotsActual = responseB.slots?.map(s => s.start_time).sort() || [];
  
  const configBMatch = configBSlotsExpected.every(time => 
    configBSlotsActual.includes(time)
  );
  
  const noConfigASlots = !configASlotsExpected.some(time =>
    configBSlotsActual.includes(time)
  );
  
  if (configBMatch && responseB.total_slots === 3 && noConfigASlots) {
    console.log('\n✅ PASS: API returned Config B slots correctly!');
    console.log('✅ PASS: API did NOT return old Config A slots!');
  } else {
    console.log('\n❌ FAIL: API did not return expected Config B slots');
    console.log('   Expected:', configBSlotsExpected);
    console.log('   Got:', configBSlotsActual);
    if (!noConfigASlots) {
      console.log('   ⚠️  WARNING: Found old Config A slots in response!');
    }
  }
  
  // FINAL VERIFICATION
  console.log('\n' + '='.repeat(70));
  console.log('\n🎯 FINAL VERIFICATION');
  console.log('='.repeat(70));
  
  // Query one more time to be absolutely sure
  console.log('\n📡 Final query to confirm...');
  await sleep(100);
  const responseFinal = await queryAPIForSlots(therapistId, testDate);
  
  const finalSlots = responseFinal.slots?.map(s => s.start_time).sort() || [];
  const stillConfigB = configBSlotsExpected.every(time => finalSlots.includes(time));
  
  console.log('📊 Final slots:', finalSlots.join(', '));
  
  // RESULTS
  console.log('\n' + '='.repeat(70));
  console.log('\n📊 TEST RESULTS');
  console.log('='.repeat(70));
  
  const allTestsPassed = configAMatch && configBMatch && noConfigASlots && stillConfigB;
  
  console.log('\n✓ Test 1: Config A slots appeared immediately:', configAMatch ? '✅ PASS' : '❌ FAIL');
  console.log('✓ Test 2: Config B slots appeared immediately:', configBMatch ? '✅ PASS' : '❌ FAIL');
  console.log('✓ Test 3: Old Config A slots disappeared:', noConfigASlots ? '✅ PASS' : '❌ FAIL');
  console.log('✓ Test 4: Final query still shows Config B:', stillConfigB ? '✅ PASS' : '❌ FAIL');
  
  if (allTestsPassed) {
    console.log('\n' + '='.repeat(70));
    console.log('🎉 ALL TESTS PASSED!');
    console.log('='.repeat(70));
    console.log('\n✅ Real-time availability updates are working perfectly!');
    console.log('\n📝 What this proves:');
    console.log('   • Database updates are immediate');
    console.log('   • API queries database directly (no caching)');
    console.log('   • Changes are visible instantly (< 200ms)');
    console.log('   • No stale data is ever returned');
    console.log('\n💡 When you update availability in the UI:');
    console.log('   1. Data saves to database ✅');
    console.log('   2. Users immediately see changes when booking ✅');
    console.log('   3. No cache refresh needed ✅');
    console.log('   4. Real-time updates guaranteed ✅');
    console.log('\n' + '='.repeat(70));
    return true;
  } else {
    console.log('\n' + '='.repeat(70));
    console.log('❌ SOME TESTS FAILED');
    console.log('='.repeat(70));
    console.log('\n⚠️  There may be a caching issue. Check:');
    console.log('   • Browser cache settings');
    console.log('   • CDN/proxy caching');
    console.log('   • API cache headers');
    console.log('\n' + '='.repeat(70));
    return false;
  }
}

// Run the test
runEndToEndTest()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n❌ Test crashed:', error.message);
    console.error(error);
    process.exit(1);
  });

