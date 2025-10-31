const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  'https://frzciymslvpohhyefmtr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyemNpeW1zbHZwb2hoeWVmbXRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDcwODQ4MiwiZXhwIjoyMDcwMjg0NDgyfQ.RTCdw-tk6pe0k-QpO0jngK64gEJOM2KU3sHS435myxM'
);

async function checkRealOverride() {
  try {
    console.log('🔍 Checking real override records...');
    
    const therapistId = '6c91320e-b697-4b1e-af08-3c9b04d51cbb';
    
    // Check all override records for this therapist
    const { data: overrides, error } = await supabase
      .from('availability_overrides')
      .select('*')
      .eq('therapist_id', therapistId)
      .order('override_date', { ascending: true });
    
    if (error) {
      console.error('❌ Error checking overrides:', error);
      return;
    }
    
    console.log('📊 All override records for therapist:');
    console.log('   Total overrides:', overrides?.length || 0);
    
    if (overrides && overrides.length > 0) {
      overrides.forEach((override, index) => {
        console.log(`\n   Override ${index + 1}:`);
        console.log(`     Date: ${override.override_date}`);
        console.log(`     Available: ${override.is_available}`);
        console.log(`     Type: ${override.override_type}`);
        console.log(`     Time: ${override.start_time} - ${override.end_time}`);
        console.log(`     Duration: ${override.session_duration} minutes`);
        console.log(`     Reason: ${override.reason || 'No reason'}`);
      });
      
      // Test the API for each override date
      for (const override of overrides) {
        console.log(`\n🧪 Testing API for ${override.override_date}...`);
        const response = await fetch(`http://localhost:3000/api/availability/slots?therapist_id=${therapistId}&date=${override.override_date}`);
        const result = await response.json();
        
        const overrideSlots = result.slots?.filter(slot => slot.is_override === true) || [];
        const regularSlots = result.slots?.filter(slot => slot.is_override === false) || [];
        
        console.log(`   Total slots: ${result.slots?.length || 0}`);
        console.log(`   Override slots: ${overrideSlots.length}`);
        console.log(`   Regular slots: ${regularSlots.length}`);
        
        if (overrideSlots.length > 0) {
          console.log('   ✅ Override slots found!');
          console.log('   Override times:', overrideSlots.map(slot => `${slot.start_time}-${slot.end_time}`));
        } else {
          console.log('   ❌ No override slots found');
        }
      }
    } else {
      console.log('❌ No override records found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkRealOverride();
