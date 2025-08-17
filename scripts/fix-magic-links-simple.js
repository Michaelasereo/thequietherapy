const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://frzciymslvpohhyefmtr.supabase.co';
const supabaseServiceKey = 'sb_secret_IUgjaZMUy-Il7waL-hMmiw_awYJ2AyO';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixMagicLinksTable() {
  console.log('🔧 Fixing magic_links table...');
  
  try {
    // Step 1: Check if auth_type column exists
    console.log('🔍 Checking current table structure...');
    const { data: columns, error: checkError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'magic_links')
      .eq('table_schema', 'public');

    if (checkError) {
      console.error('❌ Error checking table structure:', checkError);
      return;
    }

    console.log('📋 Current columns:');
    console.table(columns);

    const hasAuthType = columns.some(col => col.column_name === 'auth_type');
    
    if (hasAuthType) {
      console.log('✅ auth_type column already exists!');
    } else {
      console.log('❌ auth_type column missing. Please run the SQL manually in Supabase dashboard:');
      console.log(`
        ALTER TABLE magic_links 
        ADD COLUMN auth_type VARCHAR(50) CHECK (auth_type IN ('individual', 'therapist', 'partner', 'admin'));
        
        CREATE INDEX idx_magic_links_auth_type ON magic_links(auth_type);
        
        UPDATE magic_links 
        SET auth_type = CASE 
            WHEN type = 'login' THEN 'individual'
            WHEN type = 'signup' THEN 'individual'
            WHEN type = 'booking' THEN 'individual'
            ELSE 'individual'
        END
        WHERE auth_type IS NULL;
        
        ALTER TABLE magic_links 
        ALTER COLUMN auth_type SET NOT NULL;
      `);
      return;
    }

    // Step 2: Show sample data
    console.log('📊 Sample data:');
    const { data: sampleData, error: sampleError } = await supabase
      .from('magic_links')
      .select('id, email, token, type, auth_type, expires_at, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (sampleError) {
      console.error('❌ Error fetching sample data:', sampleError);
      return;
    }

    console.table(sampleData);

    console.log('✅ Magic links table is properly configured!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the fix
fixMagicLinksTable();
