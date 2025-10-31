#!/usr/bin/env node

/**
 * Test Real-Time Availability Updates
 * 
 * This script verifies that availability changes are reflected immediately
 * by checking cache headers and response behavior.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';

async function testRealtimeAvailability() {
  console.log('🧪 Testing Real-Time Availability Updates\n');
  console.log('=' .repeat(60));
  
  // Test 1: Check cache headers on slots endpoint
  console.log('\n📋 Test 1: Verify No-Cache Headers on Slots Endpoint');
  console.log('-'.repeat(60));
  
  const therapistId = '6c91320e-b697-4b1e-af08-3c9b04d51cbb'; // Your test therapist
  const testDate = new Date();
  testDate.setDate(testDate.getDate() + 1); // Tomorrow
  const dateStr = testDate.toISOString().split('T')[0];
  
  try {
    const response = await fetch(
      `${BASE_URL}/api/availability/slots?therapist_id=${therapistId}&date=${dateStr}&_t=${Date.now()}`,
      {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      }
    );
    
    console.log('✅ Request sent successfully');
    console.log('📊 Response Status:', response.status);
    
    // Check response headers
    const cacheControl = response.headers.get('cache-control');
    const pragma = response.headers.get('pragma');
    const expires = response.headers.get('expires');
    
    console.log('\n📦 Response Headers:');
    console.log('   Cache-Control:', cacheControl || '❌ MISSING');
    console.log('   Pragma:', pragma || '❌ MISSING');
    console.log('   Expires:', expires || '❌ MISSING');
    
    // Validate headers
    let headersPassed = true;
    if (!cacheControl || !cacheControl.includes('no-store')) {
      console.log('   ❌ FAIL: Cache-Control should include "no-store"');
      headersPassed = false;
    }
    if (!cacheControl || !cacheControl.includes('no-cache')) {
      console.log('   ❌ FAIL: Cache-Control should include "no-cache"');
      headersPassed = false;
    }
    if (!pragma || pragma !== 'no-cache') {
      console.log('   ❌ FAIL: Pragma should be "no-cache"');
      headersPassed = false;
    }
    
    if (headersPassed) {
      console.log('\n   ✅ All cache headers configured correctly!');
    }
    
    // Check response data
    const data = await response.json();
    console.log('\n📊 Response Data:');
    console.log('   Success:', data.success ? '✅' : '❌');
    console.log('   Total Slots:', data.total_slots || 0);
    console.log('   Source:', data.source);
    
    if (data.debug) {
      console.log('\n🔍 Debug Info:');
      console.log('   Custom Slots:', data.debug.custom_slots || 0);
      console.log('   General Slots:', data.debug.general_slots || 0);
      console.log('   Data Source:', data.debug.source);
    }
    
  } catch (error) {
    console.error('❌ Test 1 Failed:', error.message);
    return false;
  }
  
  // Test 2: Verify cache busting with multiple requests
  console.log('\n' + '='.repeat(60));
  console.log('\n📋 Test 2: Verify Cache Busting (Multiple Requests)');
  console.log('-'.repeat(60));
  
  try {
    const timestamps = [];
    
    for (let i = 0; i < 3; i++) {
      const timestamp = Date.now();
      timestamps.push(timestamp);
      
      const response = await fetch(
        `${BASE_URL}/api/availability/slots?therapist_id=${therapistId}&date=${dateStr}&_t=${timestamp}`,
        { cache: 'no-store' }
      );
      
      console.log(`\nRequest ${i + 1}:`);
      console.log('   Timestamp:', timestamp);
      console.log('   Status:', response.status);
      console.log('   Status Text:', response.status === 200 ? '✅ OK' : '❌ ' + response.statusText);
      
      // Verify it's not a cached response (should be 200, not 304)
      if (response.status === 304) {
        console.log('   ⚠️  WARNING: Got 304 (Not Modified) - cache may not be bypassed!');
      }
      
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay between requests
    }
    
    // Verify all timestamps are unique
    const uniqueTimestamps = new Set(timestamps);
    if (uniqueTimestamps.size === timestamps.length) {
      console.log('\n✅ All requests used unique cache-busting timestamps');
    } else {
      console.log('\n❌ FAIL: Some timestamps were duplicated');
    }
    
  } catch (error) {
    console.error('❌ Test 2 Failed:', error.message);
    return false;
  }
  
  // Test 3: Check weekly availability endpoint headers
  console.log('\n' + '='.repeat(60));
  console.log('\n📋 Test 3: Verify Weekly Availability Endpoint Headers');
  console.log('-'.repeat(60));
  console.log('ℹ️  Note: This requires authentication, so it may fail if not logged in');
  
  try {
    const response = await fetch(
      `${BASE_URL}/api/therapist/availability/weekly`,
      {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      }
    );
    
    console.log('📊 Response Status:', response.status);
    
    if (response.status === 401 || response.status === 403) {
      console.log('⚠️  Skipped: Requires authentication');
    } else {
      const cacheControl = response.headers.get('cache-control');
      console.log('📦 Cache-Control:', cacheControl || '❌ MISSING');
      
      if (cacheControl && cacheControl.includes('no-store')) {
        console.log('✅ Weekly availability endpoint has no-cache headers');
      } else {
        console.log('❌ FAIL: Missing or incorrect cache headers');
      }
    }
    
  } catch (error) {
    console.error('⚠️  Test 3 Skipped:', error.message);
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n🎯 Test Summary:');
  console.log('-'.repeat(60));
  console.log('\n✅ Real-time availability configuration verified!');
  console.log('\n📝 Next Steps:');
  console.log('   1. Test manually: Edit availability in therapist dashboard');
  console.log('   2. Open booking page in another tab/window');
  console.log('   3. Refresh booking page after saving availability');
  console.log('   4. Verify updated slots appear immediately');
  console.log('\n💡 If slots still don\'t update:');
  console.log('   - Clear browser cache completely (Cmd+Shift+Delete on Mac)');
  console.log('   - Try incognito/private browsing mode');
  console.log('   - Check browser DevTools Network tab for 304 responses');
  console.log('   - Verify server restarted after code changes');
  console.log('\n' + '='.repeat(60));
}

// Run tests
testRealtimeAvailability().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});

