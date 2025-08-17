const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  console.log('🚀 Setting up database tables for magic link authentication...\n');
  
  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  console.log('Environment Variables:');
  console.log('- SUPABASE_URL:', supabaseUrl ? 'SET' : 'NOT SET');
  console.log('- SUPABASE_KEY:', supabaseKey ? 'SET' : 'NOT SET');
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Missing environment variables. Please check your .env file.');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Read the SQL setup file
    const sqlPath = path.join(__dirname, '..', 'setup-magic-links.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📋 Running magic_links table setup...');
    
    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql: sqlContent });
    
    if (error) {
      console.log('❌ Error running SQL setup:', error.message);
      console.log('This might be because the exec_sql function doesn\'t exist.');
      console.log('Please run the SQL manually in your Supabase SQL Editor.');
      return;
    }
    
    console.log('✅ Magic links table setup completed!');
    
    // Verify the table was created
    console.log('\n🔍 Verifying table creation...');
    
    const { data: magicLinks, error: verifyError } = await supabase
      .from('magic_links')
      .select('*')
      .limit(1);
    
    if (verifyError) {
      console.log('❌ Verification failed:', verifyError.message);
      console.log('Please run the SQL manually in your Supabase SQL Editor.');
    } else {
      console.log('✅ magic_links table verified and accessible!');
    }
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.log('\n📝 Manual Setup Instructions:');
    console.log('1. Go to your Supabase Dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the contents of setup-magic-links.sql');
    console.log('4. Run the SQL');
  }
}

// Run the setup
setupDatabase().catch(console.error);
