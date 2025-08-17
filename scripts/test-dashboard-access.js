require('dotenv').config({ path: '.env.local' });
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

async function testDashboardAccess() {
  console.log('🔍 Testing complete dashboard access flow...');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  try {
    // Step 1: Get the latest partner magic link
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
    console.log('🔍 Using magic link:', {
      id: latestLink.id,
      email: latestLink.email,
      token: latestLink.token,
      auth_type: latestLink.auth_type
    });
    
    // Step 2: Test magic link verification
    console.log('\n2️⃣ Testing magic link verification...');
    const verificationUrl = `/api/auth/verify-magic-link?token=${latestLink.token}&auth_type=partner`;
    
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
          if (res.statusCode === 307 || res.statusCode === 302) {
            console.log('✅ Magic link verification successful!');
            console.log('🔄 Redirecting to:', res.headers.location);
            
            // Extract session cookie
            const setCookieHeader = res.headers['set-cookie'];
            if (setCookieHeader && setCookieHeader.length > 0) {
              const partnerCookie = setCookieHeader.find(cookie => cookie.includes('trpi_partner_user'));
              if (partnerCookie) {
                console.log('🍪 Session cookie set:', partnerCookie.split(';')[0]);
                resolve(partnerCookie);
              } else {
                reject(new Error('No partner session cookie found'));
              }
            } else {
              reject(new Error('No cookies set'));
            }
          } else {
            console.log('❌ Verification failed with status:', res.statusCode);
            console.log('📋 Response:', data);
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
    
    const sessionCookie = await verifyPromise;
    
    // Step 3: Test dashboard access with session cookie
    console.log('\n3️⃣ Testing dashboard access...');
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
        console.log('📡 Dashboard status:', res.statusCode);
        console.log('📡 Dashboard headers:', res.headers);
        
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
            console.log('❌ Dashboard access failed with status:', res.statusCode);
            console.log('📋 Response preview:', data.substring(0, 500));
            reject(new Error(`Dashboard failed: ${res.statusCode}`));
          }
        });
      });
      
      dashboardReq.on('error', (error) => {
        console.error('❌ Dashboard request error:', error);
        reject(error);
      });
      
      dashboardReq.end();
    });
    
    await dashboardPromise;
    
    // Step 4: Test partner API endpoint
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
        console.log('📡 Partner API status:', res.statusCode);
        
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) {
            console.log('✅ Partner API successful!');
            console.log('📋 API response:', data);
            resolve(data);
          } else {
            console.log('❌ Partner API failed with status:', res.statusCode);
            console.log('📋 API response:', data);
            reject(new Error(`API failed: ${res.statusCode}`));
          }
        });
      });
      
      apiReq.on('error', (error) => {
        console.error('❌ API request error:', error);
        reject(error);
      });
      
      apiReq.end();
    });
    
    await apiPromise;
    
    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testDashboardAccess().catch(console.error);
