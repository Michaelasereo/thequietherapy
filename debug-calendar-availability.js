#!/usr/bin/env node

/**
 * Debug Calendar Availability Issue
 * 
 * This script will:
 * 1. Check what availability is stored in the database
 * 2. Test the API that determines available dates
 * 3. Show exactly why only 1 day is showing as available
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

async function debugCalendarAvailability() {
  console.log('🔍 DEBUGGING CALENDAR AVAILABILITY ISSUE\n');
  console.log('='.repeat(70));
  
  // Step 1: Get therapist ID
  console.log('\n📋 Step 1: Finding therapist...');
  console.log('-'.repeat(70));
  
  const { data: therapists } = await supabase
    .from('availability_weekly_schedules')
    .select('therapist_id, weekly_availability, updated_at')
    .eq('is_active', true)
    .limit(1);
  
  if (!therapists || therapists.length === 0) {
    console.error('❌ No therapist found with availability');
    process.exit(1);
  }
  
  const therapistId = therapists[0].therapist_id;
  const availability = therapists[0].weekly_availability;
  const lastUpdated = therapists[0].updated_at;
  
  console.log('✅ Therapist ID:', therapistId);
  console.log('📅 Last updated:', lastUpdated);
  
  // Step 2: Analyze the availability structure
  console.log('\n📋 Step 2: Analyzing availability structure...');
  console.log('-'.repeat(70));
  
  if (availability && availability.standardHours) {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const enabledDays = [];
    
    days.forEach(day => {
      const dayData = availability.standardHours[day];
      if (dayData && dayData.enabled) {
        enabledDays.push(day);
        console.log(`✅ ${day}: ENABLED`);
        if (dayData.generalHours) {
          console.log(`   Hours: ${dayData.generalHours.start} - ${dayData.generalHours.end}`);
        }
        if (dayData.timeSlots) {
          console.log(`   Time slots: ${dayData.timeSlots.length} slots`);
        }
      } else {
        console.log(`❌ ${day}: DISABLED`);
      }
    });
    
    console.log(`\n📊 Summary: ${enabledDays.length} days enabled`);
    console.log('   Enabled days:', enabledDays.join(', '));
  } else {
    console.log('❌ No standardHours found in availability');
  }
  
  // Step 3: Test the database function that the calendar uses
  console.log('\n📋 Step 3: Testing database function...');
  console.log('-'.repeat(70));
  
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 30); // Next 30 days
  
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];
  
  console.log('📅 Testing date range:', startDateStr, 'to', endDateStr);
  
  try {
    const { data: slots, error } = await supabase
      .rpc('generate_availability_slots', {
        p_therapist_id: therapistId,
        p_start_date: startDateStr,
        p_end_date: endDateStr
      });
    
    if (error) {
      console.log('❌ Database function error:', error.message);
      console.log('💡 This explains why calendar shows no dates!');
    } else {
      console.log('✅ Database function returned:', slots?.length || 0, 'slots');
      
      if (slots && slots.length > 0) {
        // Group by date
        const slotsByDate = {};
        slots.forEach(slot => {
          if (!slotsByDate[slot.date]) {
            slotsByDate[slot.date] = [];
          }
          slotsByDate[slot.date].push(slot.start_time);
        });
        
        console.log('\n📊 Available dates from database function:');
        Object.keys(slotsByDate).sort().forEach(date => {
          console.log(`   ${date}: ${slotsByDate[date].length} slots (${slotsByDate[date].join(', ')})`);
        });
      } else {
        console.log('❌ No slots returned from database function');
        console.log('💡 This is why calendar shows no available dates!');
      }
    }
  } catch (error) {
    console.log('❌ Database function failed:', error.message);
  }
  
  // Step 4: Test the API endpoint that calendar uses
  console.log('\n📋 Step 4: Testing calendar API endpoint...');
  console.log('-'.repeat(70));
  
  try {
    const apiUrl = `${BASE_URL}/api/availability/days?therapist_id=${therapistId}&start_date=${startDateStr}&end_date=${endDateStr}`;
    console.log('🔗 API URL:', apiUrl);
    
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ API response:');
      console.log('   Success:', data.success);
      console.log('   Available days:', data.availableDays?.length || 0);
      console.log('   Days:', data.availableDays || []);
      
      if (data.availableDays && data.availableDays.length > 0) {
        console.log('\n✅ Calendar should show these dates as available!');
      } else {
        console.log('\n❌ Calendar will show no available dates');
        console.log('💡 This matches what you\'re seeing in the UI');
      }
    } else {
      console.log('❌ API error:', data.error);
    }
  } catch (error) {
    console.log('❌ API request failed:', error.message);
  }
  
  // Step 5: Test individual date slots
  console.log('\n📋 Step 5: Testing individual date slots...');
  console.log('-'.repeat(70));
  
  const testDates = [];
  for (let i = 1; i <= 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    testDates.push(date.toISOString().split('T')[0]);
  }
  
  console.log('📅 Testing next 7 days:', testDates.join(', '));
  
  for (const testDate of testDates) {
    try {
      const slotsUrl = `${BASE_URL}/api/availability/slots?therapist_id=${therapistId}&date=${testDate}&_t=${Date.now()}`;
      const response = await fetch(slotsUrl);
      const data = await response.json();
      
      if (response.ok && data.slots && data.slots.length > 0) {
        console.log(`✅ ${testDate}: ${data.slots.length} slots available`);
      } else {
        console.log(`❌ ${testDate}: No slots available`);
      }
    } catch (error) {
      console.log(`❌ ${testDate}: Error - ${error.message}`);
    }
  }
  
  // Step 6: Recommendations
  console.log('\n' + '='.repeat(70));
  console.log('\n🎯 DIAGNOSIS & RECOMMENDATIONS');
  console.log('='.repeat(70));
  
  console.log('\n💡 Likely Issues:');
  console.log('1. Database function `generate_availability_slots` may not support new format');
  console.log('2. Calendar API may be using old availability system');
  console.log('3. Date format mismatch between frontend and backend');
  console.log('4. Timezone issues affecting date calculations');
  
  console.log('\n🔧 Quick Fixes to Try:');
  console.log('1. Check if database function exists and works with new format');
  console.log('2. Update calendar API to use new availability system');
  console.log('3. Verify date formats are consistent (YYYY-MM-DD)');
  console.log('4. Check timezone settings in availability data');
  
  console.log('\n📝 Next Steps:');
  console.log('1. Run this script to see detailed output');
  console.log('2. Check the database function implementation');
  console.log('3. Update calendar API to use new availability format');
  console.log('4. Test with a simple availability configuration');
  
  console.log('\n' + '='.repeat(70));
}

// Run the debug
debugCalendarAvailability().catch(error => {
  console.error('❌ Debug failed:', error.message);
  process.exit(1);
});

