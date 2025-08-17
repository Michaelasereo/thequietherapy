const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join('=').trim();
      }
    });
  }
}

loadEnv();

async function debugMagicLinkUrl() {
  console.log('🔍 Debugging magic link URL...');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  try {
    // Get the latest partner magic link
    const { data: magicLinks, error: magicError } = await supabase
      .from('magic_links')
      .select('*')
      .eq('auth_type', 'partner')
      .order('created_at', { ascending: false })
      .limit(3);
    
    if (magicError) {
      console.log('❌ Magic links query error:', magicError);
      return;
    }
    
    console.log('📊 Found magic links:', magicLinks.length);
    
    magicLinks.forEach((link, index) => {
      console.log(`\n${index + 1}. Magic Link Details:`);
      console.log(`   ID: ${link.id}`);
      console.log(`   Email: ${link.email}`);
      console.log(`   Token: ${link.token}`);
      console.log(`   Auth Type: ${link.auth_type}`);
      console.log(`   Type: ${link.type}`);
      console.log(`   Created: ${link.created_at}`);
      console.log(`   Expires: ${link.expires_at}`);
      console.log(`   Used: ${link.used_at ? 'Yes' : 'No'}`);
      
      // Construct the verification URL
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const verificationUrl = `${baseUrl}/api/auth/verify-magic-link?token=${link.token}&auth_type=${link.auth_type}`;
      
      console.log(`   🔗 Verification URL: ${verificationUrl}`);
      
      // Check if the URL is correct
      if (baseUrl.includes('localhost:3000')) {
        console.log(`   ⚠️  WARNING: URL points to localhost:3000`);
        console.log(`   💡 Your server might be running on a different port (like 3002)`);
        console.log(`   💡 Try this URL instead: http://localhost:3002/api/auth/verify-magic-link?token=${link.token}&auth_type=${link.auth_type}`);
      }
    });
    
    // Check environment variables
    console.log('\n🔍 Environment Variables:');
    console.log(`   NEXT_PUBLIC_APP_URL: ${process.env.NEXT_PUBLIC_APP_URL || 'NOT SET'}`);
    console.log(`   NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET'}`);
    
    // Check what ports are commonly used
    console.log('\n🔍 Common Development Ports:');
    console.log(`   Port 3000: http://localhost:3000`);
    console.log(`   Port 3001: http://localhost:3001`);
    console.log(`   Port 3002: http://localhost:3002`);
    console.log(`   Port 3003: http://localhost:3003`);
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

debugMagicLinkUrl().catch(console.error);
