#!/usr/bin/env node

/**
 * Test Calendar with YOUR Therapist ID
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

async function testYourCalendar() {
  console.log('🧪 TESTING YOUR CALENDAR WITH YOUR THERAPIST ID\n');
  console.log('='.repeat(70));
  
  // Use YOUR therapist ID from the previous check
  const yourTherapistId = '6c91320e-b697-4b1e-af08-3c9b04d51cbb';
  
  console.log('✅ Using YOUR therapist ID:', yourTherapistId);
  
  // Test the calendar API with your ID
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 30);
  
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];
  
  console.log('\n📅 Testing date range:', startDateStr, 'to', endDateStr);
  
  try {
    const apiUrl = `${BASE_URL}/api/availability/days?therapist_id=${yourTherapistId}&start_date=${startDateStr}&end_date=${endDateStr}`;
    console.log('🔗 API URL:', apiUrl);
    
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    if (response.ok) {
      console.log('\n✅ API Response:');
      console.log('   Success:', data.success);
      console.log('   Available days:', data.availableDays?.length || 0);
      console.log('   Days:', data.availableDays || []);
      
      if (data.availableDays && data.availableDays.length > 0) {
        console.log('\n🎯 CALENDAR SHOULD SHOW:');
        console.log('='.repeat(50));
        
        // Group by day of week
        const daysByWeek = {};
        data.availableDays.forEach(dateStr => {
          const date = new Date(dateStr);
          const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
          if (!daysByWeek[dayName]) {
            daysByWeek[dayName] = [];
          }
          daysByWeek[dayName].push(dateStr);
        });
        
        Object.keys(daysByWeek).sort().forEach(day => {
          console.log(`   ${day}: ${daysByWeek[day].length} dates`);
          console.log(`      ${daysByWeek[day].slice(0, 3).join(', ')}${daysByWeek[day].length > 3 ? '...' : ''}`);
        });
        
        console.log('\n✅ This should match your 3 enabled days:');
        console.log('   - Monday (should show)');
        console.log('   - Saturday (should show)');
        console.log('   - Sunday (should show)');
        
        // Check if we have the right days
        const hasMonday = data.availableDays.some(date => new Date(date).getDay() === 1);
        const hasSaturday = data.availableDays.some(date => new Date(date).getDay() === 6);
        const hasSunday = data.availableDays.some(date => new Date(date).getDay() === 0);
        
        console.log('\n📊 Day Analysis:');
        console.log(`   Monday dates: ${hasMonday ? '✅ YES' : '❌ NO'}`);
        console.log(`   Saturday dates: ${hasSaturday ? '✅ YES' : '❌ NO'}`);
        console.log(`   Sunday dates: ${hasSunday ? '✅ YES' : '❌ NO'}`);
        
        if (hasMonday && hasSaturday && hasSunday) {
          console.log('\n🎉 SUCCESS! Calendar should show all 3 days!');
        } else {
          console.log('\n⚠️  ISSUE: Not all 3 days are showing');
          console.log('💡 This explains why you see "1 days available" instead of "3 days available"');
        }
        
      } else {
        console.log('\n❌ No available days returned');
        console.log('💡 This explains why calendar shows no dates');
      }
    } else {
      console.log('❌ API error:', data.error);
    }
  } catch (error) {
    console.log('❌ API request failed:', error.message);
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('🎯 SUMMARY:');
  console.log('='.repeat(70));
  console.log('If the API shows 3 types of days (Monday, Saturday, Sunday),');
  console.log('then your calendar should display "3 days available" instead of "1 days available"');
  console.log('\nIf it only shows Mondays, there\'s still a bug in the calendar logic.');
  console.log('\n' + '='.repeat(70));
}

// Run the test
testYourCalendar().catch(error => {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
});

