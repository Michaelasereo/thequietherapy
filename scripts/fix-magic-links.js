const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixMagicLinksTable() {
  console.log('🔧 Fixing magic_links table...');
  
  try {
    // Step 1: Add the auth_type column
    console.log('📝 Adding auth_type column...');
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE magic_links 
        ADD COLUMN IF NOT EXISTS auth_type VARCHAR(50) CHECK (auth_type IN ('individual', 'therapist', 'partner', 'admin'));
      `
    });

    if (alterError) {
      console.error('❌ Error adding auth_type column:', alterError);
      return;
    }

    // Step 2: Create index on auth_type
    console.log('📊 Creating index on auth_type...');
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_magic_links_auth_type ON magic_links(auth_type);
      `
    });

    if (indexError) {
      console.error('❌ Error creating index:', indexError);
      return;
    }

    // Step 3: Update existing records
    console.log('🔄 Updating existing records...');
    const { error: updateError } = await supabase.rpc('exec_sql', {
      sql: `
        UPDATE magic_links 
        SET auth_type = CASE 
            WHEN type = 'login' THEN 'individual'
            WHEN type = 'signup' THEN 'individual'
            WHEN type = 'booking' THEN 'individual'
            ELSE 'individual'
        END
        WHERE auth_type IS NULL;
      `
    });

    if (updateError) {
      console.error('❌ Error updating records:', updateError);
      return;
    }

    // Step 4: Make auth_type NOT NULL
    console.log('🔒 Making auth_type NOT NULL...');
    const { error: notNullError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE magic_links 
        ALTER COLUMN auth_type SET NOT NULL;
      `
    });

    if (notNullError) {
      console.error('❌ Error making auth_type NOT NULL:', notNullError);
      return;
    }

    // Step 5: Verify the changes
    console.log('✅ Verifying changes...');
    const { data: columns, error: verifyError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
            column_name, 
            data_type, 
            is_nullable, 
            column_default
        FROM information_schema.columns 
        WHERE table_name = 'magic_links' 
        AND column_name IN ('auth_type', 'type')
        ORDER BY column_name;
      `
    });

    if (verifyError) {
      console.error('❌ Error verifying changes:', verifyError);
      return;
    }

    console.log('📋 Table structure:');
    console.table(columns);

    // Step 6: Show sample data
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

    console.log('✅ Magic links table fixed successfully!');
    console.log('🎉 The auth_type column has been added and populated.');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the fix
fixMagicLinksTable();
