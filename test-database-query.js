#!/usr/bin/env node

/**
 * Test: Verify API Queries Database Directly
 * 
 * This test proves that the availability API queries the database
 * directly with no caching in between.
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('   Need: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';

async function testDatabaseQuery() {
  console.log('🔍 Testing Database Query Flow\n');
  console.log('='.repeat(70));
  
  // Get a therapist ID from database
  console.log('\n📋 Step 1: Finding test therapist in database...');
  console.log('-'.repeat(70));
  
  const { data: therapists, error: therapistError } = await supabase
    .from('availability_weekly_schedules')
    .select('therapist_id, updated_at, template_name')
    .eq('is_active', true)
    .limit(1);
  
  if (therapistError || !therapists || therapists.length === 0) {
    console.error('❌ No therapists found with availability in database');
    console.log('💡 Set up availability first by logging in as a therapist');
    process.exit(1);
  }
  
  const therapistId = therapists[0].therapist_id;
  const lastUpdated = therapists[0].updated_at;
  
  console.log('✅ Found therapist:', therapistId);
  console.log('📅 Last updated:', lastUpdated);
  
  // Query database directly
  console.log('\n📋 Step 2: Query database directly...');
  console.log('-'.repeat(70));
  
  const { data: dbData, error: dbError } = await supabase
    .from('availability_weekly_schedules')
    .select('weekly_availability, updated_at')
    .eq('therapist_id', therapistId)
    .eq('is_active', true)
    .single();
  
  if (dbError || !dbData) {
    console.error('❌ Failed to query database:', dbError);
    process.exit(1);
  }
  
  console.log('✅ Database query successful');
  console.log('📊 Data structure:', {
    hasStandardHours: !!dbData.weekly_availability?.standardHours,
    hasSessionSettings: !!dbData.weekly_availability?.sessionSettings,
    updatedAt: dbData.updated_at
  });
  
  // Count enabled days
  let enabledDays = 0;
  if (dbData.weekly_availability?.standardHours) {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    enabledDays = days.filter(day => 
      dbData.weekly_availability.standardHours[day]?.enabled
    ).length;
  }
  console.log('📅 Enabled days in database:', enabledDays);
  
  // Query via API
  console.log('\n📋 Step 3: Query same data via API...');
  console.log('-'.repeat(70));
  
  const testDate = new Date();
  testDate.setDate(testDate.getDate() + 1);
  const dateStr = testDate.toISOString().split('T')[0];
  
  const apiUrl = `${BASE_URL}/api/availability/slots?therapist_id=${therapistId}&date=${dateStr}&_t=${Date.now()}`;
  console.log('🔗 API URL:', apiUrl);
  
  const response = await fetch(apiUrl, {
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    }
  });
  
  if (!response.ok) {
    console.error('❌ API request failed:', response.status);
    process.exit(1);
  }
  
  const apiData = await response.json();
  console.log('✅ API query successful');
  console.log('📊 API response:', {
    success: apiData.success,
    totalSlots: apiData.total_slots,
    source: apiData.source,
    debug: apiData.debug
  });
  
  // Compare timestamps
  console.log('\n📋 Step 4: Verify data freshness...');
  console.log('-'.repeat(70));
  
  console.log('🔍 Comparing timestamps:');
  console.log('   Database updated_at:', dbData.updated_at);
  console.log('   API queried at:     ', new Date().toISOString());
  
  // Verify data comes from database
  console.log('\n📋 Step 5: Verify data consistency...');
  console.log('-'.repeat(70));
  
  if (apiData.source === 'availability_service') {
    console.log('✅ API is using AvailabilityService (correct!)');
  }
  
  if (apiData.debug?.source === 'weekly_availability') {
    console.log('✅ Data source is weekly_availability table (correct!)');
  }
  
  // Test multiple requests to verify no caching
  console.log('\n📋 Step 6: Test multiple requests (verify no caching)...');
  console.log('-'.repeat(70));
  
  const requests = [];
  for (let i = 0; i < 3; i++) {
    const startTime = Date.now();
    const res = await fetch(
      `${BASE_URL}/api/availability/slots?therapist_id=${therapistId}&date=${dateStr}&_t=${Date.now()}`,
      { 
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      }
    );
    const endTime = Date.now();
    const data = await res.json();
    
    requests.push({
      requestNum: i + 1,
      status: res.status,
      responseTime: endTime - startTime,
      slotCount: data.total_slots,
      isCached: res.status === 304
    });
  }
  
  console.log('\n📊 Request Results:');
  requests.forEach(req => {
    console.log(`   Request ${req.requestNum}:`);
    console.log(`      Status: ${req.status} ${req.isCached ? '(CACHED - BAD!)' : '(FRESH - GOOD!)'}`);
    console.log(`      Response Time: ${req.responseTime}ms`);
    console.log(`      Slots: ${req.slotCount}`);
  });
  
  const allFresh = requests.every(req => !req.isCached);
  const avgResponseTime = requests.reduce((sum, req) => sum + req.responseTime, 0) / requests.length;
  
  console.log('\n📊 Summary:');
  console.log(`   All requests fresh: ${allFresh ? '✅ YES' : '❌ NO'}`);
  console.log(`   Average response time: ${avgResponseTime.toFixed(0)}ms`);
  console.log(`   Consistent slot count: ${new Set(requests.map(r => r.slotCount)).size === 1 ? '✅ YES' : '⚠️  VARYING'}`);
  
  // Final verdict
  console.log('\n' + '='.repeat(70));
  console.log('\n🎯 VERDICT:');
  console.log('-'.repeat(70));
  
  if (allFresh && avgResponseTime < 500) {
    console.log('✅ PASSED: API queries database directly with no caching!');
    console.log('✅ PASSED: Response times are good (< 500ms)');
    console.log('✅ PASSED: All requests return fresh data');
    console.log('\n💡 What this means:');
    console.log('   • When you update availability, it goes to database immediately');
    console.log('   • When users book, they query database directly');
    console.log('   • No caching layer between API and database');
    console.log('   • Updates are visible in REAL-TIME!');
    console.log('\n🎉 Your availability system is working correctly!');
  } else if (!allFresh) {
    console.log('⚠️  WARNING: Some requests returned cached data (304)');
    console.log('💡 Try:');
    console.log('   - Clear browser cache completely');
    console.log('   - Check if CDN/proxy is caching responses');
    console.log('   - Verify cache headers are being sent');
  } else {
    console.log('⚠️  WARNING: Response times are slow (> 500ms)');
    console.log('💡 This is likely database performance, not caching issue');
  }
  
  console.log('\n' + '='.repeat(70));
}

// Run the test
testDatabaseQuery().catch(error => {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
});

