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

async function testFreshMagicLink() {
  console.log('🔍 Testing fresh magic link...');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  try {
    // Step 1: Create a fresh magic link via API
    console.log('1️⃣ Creating fresh magic link...');
    const createOptions = {
      hostname: 'localhost',
      port: 3002,
      path: '/api/partner/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const createPromise = new Promise((resolve, reject) => {
      const createReq = http.request(createOptions, (res) => {
        console.log('📡 Create status:', res.statusCode);
        
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          console.log('📡 Create response:', data);
          if (res.statusCode === 200) {
            resolve(data);
          } else {
            reject(new Error(`Create failed: ${res.statusCode}`));
          }
        });
      });
      
      createReq.on('error', (error) => {
        console.error('❌ Create request error:', error);
        reject(error);
      });
      
      createReq.write(JSON.stringify({ email: 'test@partner.com' }));
      createReq.end();
    });
    
    await createPromise;
    
    // Step 2: Get the fresh magic link from database
    console.log('\n2️⃣ Getting fresh magic link from database...');
    const { data: freshLinks, error: freshError } = await supabase
      .from('magic_links')
      .select('*')
      .eq('auth_type', 'partner')
      .eq('email', 'test@partner.com')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (freshError) {
      console.log('❌ Fresh link query error:', freshError);
      return;
    }
    
    if (!freshLinks || freshLinks.length === 0) {
      console.log('❌ No fresh magic link found');
      return;
    }
    
    const freshLink = freshLinks[0];
    console.log('✅ Fresh magic link found:', {
      id: freshLink.id,
      token: freshLink.token,
      created: freshLink.created_at,
      expires: freshLink.expires_at,
      used: freshLink.used_at ? 'Yes' : 'No'
    });
    
    // Step 3: Test verification immediately
    console.log('\n3️⃣ Testing verification immediately...');
    const verificationUrl = `/api/auth/verify-magic-link?token=${freshLink.token}&auth_type=partner`;
    
    const verifyOptions = {
      hostname: 'localhost',
      port: 3002,
      path: verificationUrl,
      method: 'GET'
    };
    
    const verifyPromise = new Promise((resolve, reject) => {
      const verifyReq = http.request(verifyOptions, (res) => {
        console.log('📡 Verification status:', res.statusCode);
        console.log('📡 Verification headers:', res.headers);
        
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          console.log('📡 Verification response:', data);
          
          if (res.statusCode === 307 || res.statusCode === 302) {
            console.log('✅ Verification successful!');
            console.log('🔄 Redirecting to:', res.headers.location);
            resolve(data);
          } else {
            console.log('❌ Verification failed');
            reject(new Error(`Verification failed: ${res.statusCode}`));
          }
        });
      });
      
      verifyReq.on('error', (error) => {
        console.error('❌ Verification request error:', error);
        reject(error);
      });
      
      verifyReq.end();
    });
    
    await verifyPromise;
    
    // Step 4: Check if magic link was marked as used
    console.log('\n4️⃣ Checking if magic link was marked as used...');
    const { data: usedLink, error: usedError } = await supabase
      .from('magic_links')
      .select('*')
      .eq('id', freshLink.id)
      .single();
    
    if (usedError) {
      console.log('❌ Used link query error:', usedError);
    } else {
      console.log('📋 Magic link status after verification:', {
        id: usedLink.id,
        used: usedLink.used_at ? 'Yes' : 'No',
        used_at: usedLink.used_at
      });
    }
    
    console.log('\n🎉 Test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testFreshMagicLink().catch(console.error);
