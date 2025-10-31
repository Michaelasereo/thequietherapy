const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  'https://frzciymslvpohhyefmtr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyemNpeW1zbHZwb2hoeWVmbXRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDcwODQ4MiwiZXhwIjoyMDcwMjg0NDgyfQ.RTCdw-tk6pe0k-QpO0jngK64gEJOM2KU3sHS435myxM'
);

async function createRealOverride() {
  try {
    console.log('🔧 Creating the real override (18:30-19:30)...');
    
    const therapistId = '6c91320e-b697-4b1e-af08-3c9b04d51cbb';
    const testDate = '2025-10-18';
    
    // First, delete any existing override for this date
    console.log('🧹 Cleaning up existing override...');
    await supabase
      .from('availability_overrides')
      .delete()
      .eq('therapist_id', therapistId)
      .eq('override_date', testDate);
    
    // Create the exact override you mentioned: 18:30-19:30
    console.log('📝 Creating override: 18:30-19:30...');
    const { data, error } = await supabase
      .from('availability_overrides')
      .insert({
        therapist_id: therapistId,
        override_date: testDate,
        is_available: true,
        override_type: 'custom_hours',
        start_time: '18:30:00',
        end_time: '19:30:00',
        session_duration: 60,
        session_type: 'individual',
        max_sessions: 1,
        reason: 'Custom override slot from therapist dashboard'
      })
      .select();
    
    if (error) {
      console.error('❌ Error creating override:', error);
      return;
    }
    
    console.log('✅ Override created:', data);
    
    // Test the API immediately
    console.log('🧪 Testing API with new override...');
    const response = await fetch(`http://localhost:3000/api/availability/slots?therapist_id=${therapistId}&date=${testDate}`);
    const result = await response.json();
    
    const overrideSlots = result.slots?.filter(slot => slot.is_override === true) || [];
    const regularSlots = result.slots?.filter(slot => slot.is_override === false) || [];
    
    console.log(`\n🎯 Results:`);
    console.log(`   Total slots: ${result.slots?.length || 0}`);
    console.log(`   Override slots: ${overrideSlots.length}`);
    console.log(`   Regular slots: ${regularSlots.length}`);
    
    if (overrideSlots.length > 0) {
      console.log('✅ SUCCESS: Override slots are working!');
      console.log('   Override slots:', overrideSlots.map(slot => `${slot.start_time}-${slot.end_time}`));
      console.log('\n🎉 The fix is working! Your custom override times should now appear in the booking system.');
    } else {
      console.log('❌ Still not working. Let me check what the API is returning...');
      console.log('   First few slots:', result.slots?.slice(0, 3).map(slot => `${slot.start_time}-${slot.end_time} (override: ${slot.is_override})`));
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createRealOverride();
