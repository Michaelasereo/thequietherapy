require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addIsActiveColumn() {
  console.log('🔧 Adding is_active column to therapist_enrollments table...');
  
  try {
    // Add the is_active column
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE therapist_enrollments 
        ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false;
      `
    });

    if (alterError) {
      console.error('❌ Error adding column:', alterError);
      return;
    }

    // Update existing records
    const { error: updateError } = await supabase.rpc('exec_sql', {
      sql: `
        UPDATE therapist_enrollments 
        SET is_active = false 
        WHERE is_active IS NULL;
      `
    });

    if (updateError) {
      console.error('❌ Error updating records:', updateError);
      return;
    }

    console.log('✅ Successfully added is_active column to therapist_enrollments table');
    
    // Verify the column was added
    const { data, error } = await supabase
      .from('therapist_enrollments')
      .select('id, email, is_active')
      .limit(1);

    if (error) {
      console.error('❌ Error verifying column:', error);
    } else {
      console.log('✅ Column verification successful');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

addIsActiveColumn();
