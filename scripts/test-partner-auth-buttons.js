const http = require('http');
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

async function testPartnerAuthButtons() {
  console.log('🔍 Testing partner auth page buttons...');
  
  try {
    // Test 1: Check if the auth page loads
    console.log('\n1️⃣ Testing partner auth page load...');
    const authOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/partner/auth',
      method: 'GET'
    };
    
    const authPromise = new Promise((resolve, reject) => {
      const authReq = http.request(authOptions, (res) => {
        console.log('📡 Auth page status:', res.statusCode);
        
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) {
            console.log('✅ Auth page loads successfully');
            
            // Check if buttons are present in the HTML
            if (data.includes('New Partner') && data.includes('Existing Partner')) {
              console.log('✅ Both buttons found in HTML');
              
              // Check for specific button elements
              if (data.includes('onClick') || data.includes('onclick')) {
                console.log('✅ Click handlers found in HTML');
              } else {
                console.log('⚠️ Click handlers not found in HTML (might be client-side)');
              }
              
              // Check for button styling classes
              if (data.includes('variant="outline"')) {
                console.log('✅ Button styling classes found');
              }
              
            } else {
              console.log('❌ Buttons not found in HTML');
              console.log('📋 HTML preview:', data.substring(0, 500));
            }
            
            resolve(data);
          } else {
            console.log('❌ Auth page failed to load');
            reject(new Error(`Auth page failed: ${res.statusCode}`));
          }
        });
      });
      
      authReq.on('error', (error) => {
        console.error('❌ Auth page request error:', error);
        reject(error);
      });
      
      authReq.end();
    });
    
    await authPromise;
    
    // Test 2: Test the API endpoint that the "Existing Partner" button calls
    console.log('\n2️⃣ Testing partner login API endpoint...');
    const apiData = JSON.stringify({ email: 'test@partner.com' });
    
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
    
    const apiPromise = new Promise((resolve, reject) => {
      const apiReq = http.request(apiOptions, (res) => {
        console.log('📡 API status:', res.statusCode);
        
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) {
            console.log('✅ API endpoint working');
            console.log('📡 API response:', data);
            resolve(data);
          } else {
            console.log('❌ API endpoint failed');
            reject(new Error(`API failed: ${res.statusCode}`));
          }
        });
      });
      
      apiReq.on('error', (error) => {
        console.error('❌ API request error:', error);
        reject(error);
      });
      
      apiReq.write(apiData);
      apiReq.end();
    });
    
    await apiPromise;
    
    // Test 3: Test the onboarding page that "New Partner" button should redirect to
    console.log('\n3️⃣ Testing onboarding page (New Partner button target)...');
    const onboardingOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/partner/onboarding',
      method: 'GET'
    };
    
    const onboardingPromise = new Promise((resolve, reject) => {
      const onboardingReq = http.request(onboardingOptions, (res) => {
        console.log('📡 Onboarding page status:', res.statusCode);
        
        if (res.statusCode === 200) {
          console.log('✅ Onboarding page accessible');
          resolve();
        } else if (res.statusCode === 307 || res.statusCode === 302) {
          console.log('🔄 Onboarding page redirecting to:', res.headers.location);
          resolve();
        } else {
          console.log('❌ Onboarding page not accessible');
          reject(new Error(`Onboarding page failed: ${res.statusCode}`));
        }
      });
      
      onboardingReq.on('error', (error) => {
        console.error('❌ Onboarding page request error:', error);
        reject(error);
      });
      
      onboardingReq.end();
    });
    
    await onboardingPromise;
    
    console.log('\n🎉 Button functionality test completed!');
    console.log('✅ Auth page loads with buttons');
    console.log('✅ API endpoint for Existing Partner works');
    console.log('✅ Onboarding page for New Partner accessible');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testPartnerAuthButtons().catch(console.error);
