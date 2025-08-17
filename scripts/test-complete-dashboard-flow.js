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

async function testCompleteDashboardFlow() {
  console.log('🔍 Testing complete dashboard flow...');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  try {
    // Step 1: Create a fresh magic link
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
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) {
            resolve(data);
          } else {
            reject(new Error(`Create failed: ${res.statusCode}`));
          }
        });
      });
      
      createReq.on('error', (error) => {
        reject(error);
      });
      
      createReq.write(JSON.stringify({ email: 'test@partner.com' }));
      createReq.end();
    });
    
    await createPromise;
    console.log('✅ Magic link created');
    
    // Step 2: Get the fresh magic link
    console.log('\n2️⃣ Getting fresh magic link...');
    const { data: freshLinks, error: freshError } = await supabase
      .from('magic_links')
      .select('*')
      .eq('auth_type', 'partner')
      .eq('email', 'test@partner.com')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (freshError || !freshLinks || freshLinks.length === 0) {
      console.log('❌ No fresh magic link found');
      return;
    }
    
    const freshLink = freshLinks[0];
    console.log('✅ Fresh magic link found');
    
    // Step 3: Verify magic link and get session cookie
    console.log('\n3️⃣ Verifying magic link...');
    const verificationUrl = `/api/auth/verify-magic-link?token=${freshLink.token}&auth_type=partner`;
    
    const verifyOptions = {
      hostname: 'localhost',
      port: 3002,
      path: verificationUrl,
      method: 'GET'
    };
    
    const verifyPromise = new Promise((resolve, reject) => {
      const verifyReq = http.request(verifyOptions, (res) => {
        if (res.statusCode === 307 || res.statusCode === 302) {
          // Extract session cookie
          const setCookieHeader = res.headers['set-cookie'];
          if (setCookieHeader && setCookieHeader.length > 0) {
            const partnerCookie = setCookieHeader.find(cookie => cookie.includes('trpi_partner_user'));
            if (partnerCookie) {
              console.log('✅ Session cookie obtained');
              resolve(partnerCookie);
            } else {
              reject(new Error('No partner session cookie found'));
            }
          } else {
            reject(new Error('No cookies set'));
          }
        } else {
          reject(new Error(`Verification failed: ${res.statusCode}`));
        }
      });
      
      verifyReq.on('error', (error) => {
        reject(error);
      });
      
      verifyReq.end();
    });
    
    const sessionCookie = await verifyPromise;
    console.log('✅ Magic link verification successful');
    
    // Step 4: Test partner API endpoint with session cookie
    console.log('\n4️⃣ Testing partner API endpoint...');
    const apiOptions = {
      hostname: 'localhost',
      port: 3002,
      path: '/api/partner/me',
      method: 'GET',
      headers: {
        'Cookie': sessionCookie,
        'Cache-Control': 'no-cache'
      }
    };
    
    const apiPromise = new Promise((resolve, reject) => {
      const apiReq = http.request(apiOptions, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) {
            console.log('✅ Partner API successful');
            console.log('📋 API response:', data);
            resolve(data);
          } else {
            console.log('❌ Partner API failed:', res.statusCode);
            console.log('📋 API response:', data);
            reject(new Error(`API failed: ${res.statusCode}`));
          }
        });
      });
      
      apiReq.on('error', (error) => {
        reject(error);
      });
      
      apiReq.end();
    });
    
    await apiPromise;
    
    // Step 5: Test dashboard access with session cookie
    console.log('\n5️⃣ Testing dashboard access...');
    const dashboardOptions = {
      hostname: 'localhost',
      port: 3002,
      path: '/partner/dashboard',
      method: 'GET',
      headers: {
        'Cookie': sessionCookie,
        'Cache-Control': 'no-cache'
      }
    };
    
    const dashboardPromise = new Promise((resolve, reject) => {
      const dashboardReq = http.request(dashboardOptions, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) {
            console.log('✅ Dashboard access successful!');
            console.log('📊 Response length:', data.length, 'characters');
            
            // Check if response contains dashboard content
            if (data.includes('Partner Overview') || data.includes('partner dashboard')) {
              console.log('✅ Dashboard content confirmed!');
            } else {
              console.log('⚠️ Dashboard content not found in response');
            }
            
            resolve(data);
          } else if (res.statusCode === 307 || res.statusCode === 302) {
            console.log('🔄 Dashboard redirecting to:', res.headers.location);
            reject(new Error(`Dashboard redirect: ${res.headers.location}`));
          } else {
            console.log('❌ Dashboard access failed:', res.statusCode);
            reject(new Error(`Dashboard failed: ${res.statusCode}`));
          }
        });
      });
      
      dashboardReq.on('error', (error) => {
        reject(error);
      });
      
      dashboardReq.end();
    });
    
    await dashboardPromise;
    
    console.log('\n🎉 Complete dashboard flow successful!');
    console.log('✅ Magic link creation: Working');
    console.log('✅ Magic link verification: Working');
    console.log('✅ Session cookie setting: Working');
    console.log('✅ Partner API access: Working');
    console.log('✅ Dashboard access: Working');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCompleteDashboardFlow().catch(console.error);
