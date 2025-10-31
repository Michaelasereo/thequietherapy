const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  'https://frzciymslvpohhyefmtr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyemNpeW1zbHZwb2hoeWVmbXRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDcwODQ4MiwiZXhwIjoyMDcwMjg0NDgyfQ.RTCdw-tk6pe0k-QpO0jngK64gEJOM2KU3sHS435myxM'
);

async function testDbQuery() {
  try {
    console.log('🔍 Testing database query...');
    
    const therapistId = '6c91320e-b697-4b1e-af08-3c9b04d51cbb';
    const date = '2025-10-18';
    
    // Test the exact same query that the API uses
    const { data: overrides, error } = await supabase
      .from('availability_overrides')
      .select('*')
      .eq('therapist_id', therapistId)
      .eq('override_date', date);
    
    if (error) {
      console.error('❌ Database query error:', error);
      return;
    }
    
    console.log('📊 Query results:');
    console.log('   Override count:', overrides?.length || 0);
    console.log('   Therapist ID:', therapistId);
    console.log('   Date:', date);
    
    if (overrides && overrides.length > 0) {
      console.log('✅ Override found in database:');
      console.log(JSON.stringify(overrides[0], null, 2));
      
      // Test the override logic
      const override = overrides[0];
      const isUnavailable = override.is_available === false || override.override_type === 'unavailable';
      const isCustomHours = (override.is_available === true || override.override_type === 'custom_hours') && override.start_time && override.end_time;
      
      console.log('\n🧪 Override logic test:');
      console.log('   is_available:', override.is_available);
      console.log('   override_type:', override.override_type);
      console.log('   start_time:', override.start_time);
      console.log('   end_time:', override.end_time);
      console.log('   isUnavailable:', isUnavailable);
      console.log('   isCustomHours:', isCustomHours);
      
      if (isCustomHours) {
        console.log('✅ Should generate custom override slots!');
      } else if (isUnavailable) {
        console.log('🚫 Should make date unavailable!');
      } else {
        console.log('❓ Override logic unclear!');
      }
    } else {
      console.log('❌ No override found in database');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testDbQuery();
