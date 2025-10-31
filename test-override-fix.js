const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  'https://frzciymslvpohhyefmtr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyemNpeW1zbHZwb2hoeWVmbXRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDcwODQ4MiwiZXhwIjoyMDcwMjg0NDgyfQ.RTCdw-tk6pe0k-QpO0jngK64gEJOM2KU3sHS435myxM'
);

async function testOverrideFix() {
  try {
    console.log('🧪 Testing override fix...');
    
    const therapistId = '6c91320e-b697-4b1e-af08-3c9b04d51cbb';
    const testDate = '2025-10-18';
    
    // 1. Create a test override record
    console.log('📝 Creating test override record...');
    const { data: overrideData, error: overrideError } = await supabase
      .from('availability_overrides')
      .upsert({
        therapist_id: therapistId,
        override_date: testDate,
        is_available: true,
        start_time: '19:00:00', // 7:00 PM
        end_time: '23:00:00',   // 11:00 PM
        session_duration: 60,
        session_type: 'individual',
        max_sessions: 1,
        reason: 'Test override for debugging'
      }, { onConflict: 'therapist_id,override_date' });
    
    if (overrideError) {
      console.error('❌ Error creating override:', overrideError);
      console.log('Override data that failed:', {
        therapist_id: therapistId,
        override_date: testDate,
        is_available: true,
        start_time: '19:00:00',
        end_time: '23:00:00',
        session_duration: 60,
        session_type: 'individual',
        max_sessions: 1,
        reason: 'Test override for debugging'
      });
      return;
    }
    
    console.log('✅ Override record created successfully');
    
    // 2. Test the API endpoint
    console.log('🔍 Testing API endpoint...');
    const response = await fetch(`http://localhost:3000/api/availability/slots?therapist_id=${therapistId}&date=${testDate}`);
    
    if (!response.ok) {
      console.error('❌ API request failed:', response.status, response.statusText);
      return;
    }
    
    const result = await response.json();
    console.log('📊 API Response:', JSON.stringify(result, null, 2));
    
    // 3. Check if override slots are marked correctly
    const overrideSlots = result.slots?.filter(slot => slot.is_override === true) || [];
    const regularSlots = result.slots?.filter(slot => slot.is_override === false) || [];
    
    console.log(`\n🎯 Results:`);
    console.log(`   Total slots: ${result.slots?.length || 0}`);
    console.log(`   Override slots: ${overrideSlots.length}`);
    console.log(`   Regular slots: ${regularSlots.length}`);
    
    if (overrideSlots.length > 0) {
      console.log('✅ SUCCESS: Override slots are being marked correctly!');
      console.log('   Override slots:', overrideSlots.map(slot => `${slot.start_time}-${slot.end_time}`));
    } else {
      console.log('❌ FAILED: No override slots found with is_override: true');
    }
    
    // 4. Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    await supabase
      .from('availability_overrides')
      .delete()
      .eq('therapist_id', therapistId)
      .eq('override_date', testDate);
    
    console.log('✅ Test completed and cleaned up');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testOverrideFix();
