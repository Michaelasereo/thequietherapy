const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  'https://frzciymslvpohhyefmtr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyemNpeW1zbHZwb2hoeWVmbXRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDcwODQ4MiwiZXhwIjoyMDcwMjg0NDgyfQ.RTCdw-tk6pe0k-QpO0jngK64gEJOM2KU3sHS435myxM'
);

async function checkTableStructure() {
  try {
    console.log('🔍 Checking table structure...');
    
    // Try to get table info by selecting from it
    const { data, error } = await supabase
      .from('availability_overrides')
      .select('*')
      .limit(0);
    
    if (error) {
      console.error('❌ Error accessing table:', error);
      
      // Try to create the table if it doesn't exist
      console.log('🔧 Attempting to create table...');
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS availability_overrides (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          therapist_id UUID NOT NULL,
          override_date DATE NOT NULL,
          is_available BOOLEAN DEFAULT FALSE,
          start_time TIME,
          end_time TIME,
          session_duration INTEGER DEFAULT 45,
          session_type VARCHAR(20) DEFAULT 'individual',
          max_sessions INTEGER DEFAULT 1,
          reason VARCHAR(100),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(therapist_id, override_date)
        );
      `;
      
      const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
      if (createError) {
        console.error('❌ Error creating table:', createError);
      } else {
        console.log('✅ Table created successfully');
      }
    } else {
      console.log('✅ Table exists and is accessible');
    }
    
    // Try a simple insert to test
    console.log('🧪 Testing simple insert...');
    const { data: insertData, error: insertError } = await supabase
      .from('availability_overrides')
      .insert({
        therapist_id: '6c91320e-b697-4b1e-af08-3c9b04d51cbb',
        override_date: '2025-10-18',
        is_available: true,
        start_time: '19:00:00',
        end_time: '23:00:00',
        session_duration: 60,
        session_type: 'individual',
        max_sessions: 1,
        reason: 'Test insert'
      })
      .select();
    
    if (insertError) {
      console.error('❌ Insert error:', insertError);
    } else {
      console.log('✅ Insert successful:', insertData);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkTableStructure();
