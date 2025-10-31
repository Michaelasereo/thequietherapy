const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  'https://frzciymslvpohhyefmtr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyemNpeW1zbHZwb2hoeWVmbXRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDcwODQ4MiwiZXhwIjoyMDcwMjg0NDgyfQ.RTCdw-tk6pe0k-QpO0jngK64gEJOM2KU3sHS435myxM'
);

async function fixOverrideRecord() {
  try {
    console.log('🔧 Fixing override record...');
    
    const therapistId = '6c91320e-b697-4b1e-af08-3c9b04d51cbb';
    const testDate = '2025-10-18';
    
    // Update the override record to have correct values for custom hours
    const { data, error } = await supabase
      .from('availability_overrides')
      .update({
        is_available: true,
        override_type: 'custom_hours', // Change from 'unavailable' to 'custom_hours'
        start_time: '19:00:00',
        end_time: '23:00:00',
        session_duration: 60,
        session_type: 'individual',
        max_sessions: 1,
        reason: 'Test custom hours override'
      })
      .eq('therapist_id', therapistId)
      .eq('override_date', testDate)
      .select();
    
    if (error) {
      console.error('❌ Error updating override:', error);
      return;
    }
    
    console.log('✅ Override record updated:', data);
    
    // Test the API again
    console.log('🧪 Testing API after fix...');
    const response = await fetch(`http://localhost:3001/api/availability/slots?therapist_id=${therapistId}&date=${testDate}`);
    const result = await response.json();
    
    const overrideSlots = result.slots?.filter(slot => slot.is_override === true) || [];
    const regularSlots = result.slots?.filter(slot => slot.is_override === false) || [];
    
    console.log(`\n🎯 Results after fix:`);
    console.log(`   Total slots: ${result.slots?.length || 0}`);
    console.log(`   Override slots: ${overrideSlots.length}`);
    console.log(`   Regular slots: ${regularSlots.length}`);
    
    if (overrideSlots.length > 0) {
      console.log('✅ SUCCESS: Override slots are now working!');
      console.log('   Override slots:', overrideSlots.map(slot => `${slot.start_time}-${slot.end_time}`));
    } else {
      console.log('❌ Still not working. Let me check the server logs...');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixOverrideRecord();
