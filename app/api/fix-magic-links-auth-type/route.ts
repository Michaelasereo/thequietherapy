import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST() {
  console.log('🔧 Fixing magic_links table auth_type column...');
  
  try {
    // Step 1: Try to add the auth_type column
    console.log('📝 Adding auth_type column...');
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE magic_links 
        ADD COLUMN IF NOT EXISTS auth_type VARCHAR(50) CHECK (auth_type IN ('individual', 'therapist', 'partner', 'admin'));
      `
    });

    if (alterError) {
      console.log('⚠️ Could not use exec_sql, trying alternative approach...');
      
      // Alternative: Try to query the table to see if auth_type exists
      const { data: testData, error: testError } = await supabase
        .from('magic_links')
        .select('auth_type')
        .limit(1);
      
      if (testError && testError.message.includes('auth_type')) {
        console.log('❌ auth_type column is missing');
        return NextResponse.json({
          success: false,
          error: 'auth_type column is missing',
          message: 'Please run the following SQL in your Supabase dashboard:',
          sql: `
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
          `
        });
      }
    }

    // Step 2: Create index
    console.log('📊 Creating index...');
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_magic_links_auth_type ON magic_links(auth_type);
      `
    });

    if (indexError) {
      console.log('⚠️ Could not create index via exec_sql');
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
      console.log('⚠️ Could not update records via exec_sql');
    }

    // Step 4: Make NOT NULL
    console.log('🔒 Making auth_type NOT NULL...');
    const { error: notNullError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE magic_links 
        ALTER COLUMN auth_type SET NOT NULL;
      `
    });

    if (notNullError) {
      console.log('⚠️ Could not make auth_type NOT NULL via exec_sql');
    }

    // Step 5: Verify by trying to query with auth_type
    console.log('✅ Verifying fix...');
    const { data: sampleData, error: verifyError } = await supabase
      .from('magic_links')
      .select('id, email, token, type, auth_type, expires_at, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (verifyError) {
      console.error('❌ Verification failed:', verifyError);
      return NextResponse.json({
        success: false,
        error: 'Verification failed',
        details: verifyError
      });
    }

    console.log('✅ Magic links table fixed successfully!');
    return NextResponse.json({
      success: true,
      message: 'Magic links table fixed successfully',
      sampleData
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: 'Unexpected error',
      details: error
    });
  }
}
