const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  'https://frzciymslvpohhyefmtr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyemNpeW1zbHZwb2hoeWVmbXRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDcwODQ4MiwiZXhwIjoyMDcwMjg0NDgyfQ.RTCdw-tk6pe0k-QpO0jngK64gEJOM2KU3sHS435myxM'
);

async function checkOverride() {
  try {
    console.log('🔍 Checking override records...');
    
    const therapistId = '6c91320e-b697-4b1e-af08-3c9b04d51cbb';
    const testDate = '2025-10-18';
    
    // Check if override record exists
    const { data: overrides, error } = await supabase
      .from('availability_overrides')
      .select('*')
      .eq('therapist_id', therapistId)
      .eq('override_date', testDate);
    
    if (error) {
      console.error('❌ Error checking overrides:', error);
      return;
    }
    
    console.log('📊 Override records found:', overrides?.length || 0);
    if (overrides && overrides.length > 0) {
      console.log('Override details:', JSON.stringify(overrides[0], null, 2));
    }
    
    // Also check if the table exists and has the right structure
    const { data: tableInfo, error: tableError } = await supabase
      .from('availability_overrides')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Table error:', tableError);
    } else {
      console.log('✅ Table exists and is accessible');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkOverride();
