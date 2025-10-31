#!/usr/bin/env node

/**
 * Check What's Actually in Your Availability Database
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

async function checkActualAvailability() {
  console.log('🔍 CHECKING YOUR ACTUAL AVAILABILITY IN DATABASE\n');
  console.log('='.repeat(70));
  
  // Get your therapist ID
  const { data: therapists } = await supabase
    .from('availability_weekly_schedules')
    .select('therapist_id, weekly_availability, updated_at')
    .eq('is_active', true)
    .order('updated_at', { ascending: false })
    .limit(1);
  
  if (!therapists || therapists.length === 0) {
    console.error('❌ No availability found in database');
    process.exit(1);
  }
  
  const therapistId = therapists[0].therapist_id;
  const availability = therapists[0].weekly_availability;
  const lastUpdated = therapists[0].updated_at;
  
  console.log('✅ Your Therapist ID:', therapistId);
  console.log('📅 Last Updated:', lastUpdated);
  console.log('\n📊 YOUR ACTUAL AVAILABILITY CONFIGURATION:');
  console.log('='.repeat(70));
  
  if (availability && availability.standardHours) {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const enabledDays = [];
    
    days.forEach(day => {
      const dayData = availability.standardHours[day];
      console.log(`\n📅 ${day.toUpperCase()}:`);
      
      if (dayData && dayData.enabled) {
        enabledDays.push(day);
        console.log('   ✅ ENABLED');
        
        if (dayData.generalHours) {
          console.log(`   🕐 General Hours: ${dayData.generalHours.start} - ${dayData.generalHours.end}`);
          if (dayData.generalHours.sessionDuration) {
            console.log(`   ⏱️  Session Duration: ${dayData.generalHours.sessionDuration} minutes`);
          }
        }
        
        if (dayData.timeSlots && dayData.timeSlots.length > 0) {
          console.log(`   📋 Time Slots (${dayData.timeSlots.length}):`);
          dayData.timeSlots.forEach((slot, index) => {
            console.log(`      ${index + 1}. ${slot.start} - ${slot.end} (${slot.type})`);
          });
        }
      } else {
        console.log('   ❌ DISABLED');
      }
    });
    
    console.log('\n' + '='.repeat(70));
    console.log('📊 SUMMARY:');
    console.log('='.repeat(70));
    console.log(`✅ Enabled Days: ${enabledDays.length}`);
    console.log(`📅 Days: ${enabledDays.join(', ').toUpperCase()}`);
    
    if (availability.sessionSettings) {
      console.log(`\n⚙️  Session Settings:`);
      console.log(`   Duration: ${availability.sessionSettings.sessionDuration || 'Not set'} minutes`);
      console.log(`   Buffer Time: ${availability.sessionSettings.bufferTime || 'Not set'} minutes`);
    }
    
    // Show the raw JSON for debugging
    console.log('\n' + '='.repeat(70));
    console.log('🔍 RAW DATABASE DATA (for debugging):');
    console.log('='.repeat(70));
    console.log(JSON.stringify(availability, null, 2));
    
  } else {
    console.log('❌ No standardHours found in your availability');
    console.log('🔍 Raw data:', JSON.stringify(availability, null, 2));
  }
  
  // Also check if there are any legacy templates
  console.log('\n' + '='.repeat(70));
  console.log('🔍 CHECKING LEGACY TEMPLATES:');
  console.log('='.repeat(70));
  
  const { data: legacyTemplates } = await supabase
    .from('availability_templates')
    .select('*')
    .eq('therapist_id', therapistId)
    .eq('is_active', true)
    .order('day_of_week');
  
  if (legacyTemplates && legacyTemplates.length > 0) {
    console.log(`✅ Found ${legacyTemplates.length} legacy templates:`);
    legacyTemplates.forEach(template => {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      console.log(`   ${dayNames[template.day_of_week]}: ${template.start_time} - ${template.end_time}`);
    });
  } else {
    console.log('❌ No legacy templates found');
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('🎯 DIAGNOSIS:');
  console.log('='.repeat(70));
  
  if (enabledDays.length === 1) {
    console.log('⚠️  ISSUE FOUND: Only 1 day is enabled in database');
    console.log('💡 This explains why calendar shows "1 days available"');
    console.log('\n🔧 SOLUTION:');
    console.log('1. Go to your therapist dashboard');
    console.log('2. Edit your availability');
    console.log('3. Enable the other 2 days you want');
    console.log('4. Save the changes');
    console.log('5. Calendar should then show 3 days available');
  } else if (enabledDays.length === 3) {
    console.log('✅ All 3 days are enabled in database');
    console.log('💡 The issue is in the calendar API logic');
    console.log('🔧 The fix I made should resolve this');
  } else {
    console.log(`📊 You have ${enabledDays.length} days enabled`);
    console.log('💡 This matches what the calendar should show');
  }
  
  console.log('\n' + '='.repeat(70));
}

// Run the check
checkActualAvailability().catch(error => {
  console.error('❌ Check failed:', error.message);
  process.exit(1);
});

