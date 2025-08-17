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

async function testMagicLink() {
  console.log('🔍 Testing magic link verification...');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  try {
    // Get the most recent unused partner magic link
    const { data: magicLink, error } = await supabase
      .from('magic_links')
      .select('*')
      .eq('auth_type', 'partner')
      .is('used_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error || !magicLink) {
      console.log('❌ No unused partner magic link found:', error);
      return;
    }
    
    console.log('🔍 Found magic link:', {
      id: magicLink.id,
      email: magicLink.email,
      token: magicLink.token.substring(0, 8) + '...',
      type: magicLink.type,
      auth_type: magicLink.auth_type,
      expires_at: magicLink.expires_at
    });
    
    // Test the verification URL
    const verificationUrl = `http://localhost:3002/api/auth/verify-magic-link?token=${magicLink.token}&auth_type=partner`;
    console.log('🔍 Testing URL:', verificationUrl);
    
    // Make a request to test the verification
    const http = require('http');
    const url = require('url');
    
    const testUrl = url.parse(verificationUrl);
    const options = {
      hostname: testUrl.hostname,
      port: testUrl.port,
      path: testUrl.path,
      method: 'GET'
    };
    
    const req = http.request(options, (res) => {
      console.log('📡 Response status:', res.statusCode);
      console.log('📡 Response headers:', res.headers);
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('📡 Response body:', data);
        
        // Check if we got redirected
        if (res.statusCode === 307 || res.statusCode === 302) {
          const location = res.headers.location;
          console.log('🔄 Redirect location:', location);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Request error:', error);
    });
    
    req.end();
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testMagicLink().catch(console.error);

