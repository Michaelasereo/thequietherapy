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

async function testPartnerAuthAPI() {
  console.log('🔍 Testing partner login API route...');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  try {
    // Test 1: Check if partner auth page loads
    console.log('\n1️⃣ Testing partner auth page...');
    const authOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/partner/auth',
      method: 'GET'
    };
    
    const authReq = http.request(authOptions, (res) => {
      console.log('📡 Auth page status:', res.statusCode);
    });
    
    authReq.on('error', (error) => {
      console.error('❌ Auth page error:', error);
    });
    
    authReq.end();
    
    // Test 2: Test the new partner login API route
    console.log('\n2️⃣ Testing partner login API route...');
    const testEmail = 'test@partner.com';
    
    const apiData = JSON.stringify({ email: testEmail });
    
    const apiOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/partner/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(apiData)
      }
    };
    
    const apiReq = http.request(apiOptions, (res) => {
      console.log('📡 API route status:', res.statusCode);
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('📡 API route response:', data);
        
        if (res.statusCode === 200) {
          console.log('✅ API route executed successfully!');
        } else {
          console.log('❌ API route failed');
        }
      });
    });
    
    apiReq.on('error', (error) => {
      console.error('❌ API route request error:', error);
    });
    
    apiReq.write(apiData);
    apiReq.end();
    
    // Test 3: Check if magic link was created
    console.log('\n3️⃣ Checking if magic link was created...');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for API to complete
    
    const { data: magicLinks, error: magicError } = await supabase
      .from('magic_links')
      .select('*')
      .eq('auth_type', 'partner')
      .eq('email', testEmail)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (magicError) {
      console.log('❌ Magic links query error:', magicError);
    } else {
      console.log('📊 Magic links for test email:', magicLinks?.length || 0);
      if (magicLinks && magicLinks.length > 0) {
        const latestLink = magicLinks[0];
        console.log('✅ Magic link created:', {
          id: latestLink.id,
          email: latestLink.email,
          type: latestLink.type,
          auth_type: latestLink.auth_type,
          created_at: latestLink.created_at,
          used: latestLink.used_at ? 'Yes' : 'No'
        });
        
        // Test 4: Test the magic link verification
        console.log('\n4️⃣ Testing magic link verification...');
        const verificationUrl = `http://localhost:3000/api/auth/verify-magic-link?token=${latestLink.token}&auth_type=partner`;
        console.log('🔍 Testing verification URL:', verificationUrl);
        
        const verifyOptions = {
          hostname: 'localhost',
          port: 3000,
          path: `/api/auth/verify-magic-link?token=${latestLink.token}&auth_type=partner`,
          method: 'GET'
        };
        
        const verifyReq = http.request(verifyOptions, (res) => {
          console.log('📡 Verification status:', res.statusCode);
          console.log('📡 Verification headers:', res.headers);
          
          if (res.statusCode === 307 || res.statusCode === 302) {
            console.log('🔄 Verification redirecting to:', res.headers.location);
            console.log('✅ Magic link verification successful!');
          } else {
            console.log('❌ Magic link verification failed');
          }
        });
        
        verifyReq.on('error', (error) => {
          console.error('❌ Verification request error:', error);
        });
        
        verifyReq.end();
      } else {
        console.log('❌ No magic link created for test email');
      }
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testPartnerAuthAPI().catch(console.error);
