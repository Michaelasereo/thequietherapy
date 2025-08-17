const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const http = require('http');

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

async function debugVerificationError() {
  console.log('🔍 Debugging magic link verification error...');
  
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
      .limit(1);
    
    if (magicError) {
      console.log('❌ Magic links query error:', magicError);
      return;
    }
    
    if (!magicLinks || magicLinks.length === 0) {
      console.log('❌ No partner magic links found');
      return;
    }
    
    const latestLink = magicLinks[0];
    console.log('🔍 Testing magic link:', {
      id: latestLink.id,
      email: latestLink.email,
      token: latestLink.token,
      auth_type: latestLink.auth_type,
      created_at: latestLink.created_at
    });
    
    // Test verification with detailed error logging
    const verificationUrl = `/api/auth/verify-magic-link?token=${latestLink.token}&auth_type=partner`;
    console.log('🔍 Testing verification URL:', verificationUrl);
    
    const verifyOptions = {
      hostname: 'localhost',
      port: 3002,
      path: verificationUrl,
      method: 'GET'
    };
    
    const verifyReq = http.request(verifyOptions, (res) => {
      console.log('📡 Verification status:', res.statusCode);
      console.log('📡 Verification headers:', res.headers);
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('📡 Verification response body:', data);
        
        if (res.statusCode === 400) {
          console.log('❌ Verification failed with 400 - Bad Request');
          console.log('📋 Response details:', data);
        } else if (res.statusCode === 307 || res.statusCode === 302) {
          console.log('🔄 Verification redirecting to:', res.headers.location);
          console.log('✅ Magic link verification successful!');
        } else {
          console.log('❌ Magic link verification failed with status:', res.statusCode);
        }
      });
    });
    
    verifyReq.on('error', (error) => {
      console.error('❌ Verification request error:', error);
    });
    
    verifyReq.end();
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

debugVerificationError().catch(console.error);
