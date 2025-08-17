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

async function testPartnerAuthFlow() {
  console.log('🔍 Testing actual partner auth flow...');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  try {
    // Test 1: Check if partner auth page loads
    console.log('\n1️⃣ Testing partner auth page...');
    const authOptions = {
      hostname: 'localhost',
      port: 3002,
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
    
    // Test 2: Test the server action directly by simulating a form submission
    console.log('\n2️⃣ Testing partner magic link server action...');
    const testEmail = 'test@partner.com';
    
    // Simulate form submission to the server action
    const formData = new URLSearchParams();
    formData.append('email', testEmail);
    
    const actionOptions = {
      hostname: 'localhost',
      port: 3002,
      path: '/partner/auth', // This should trigger the server action
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Requested-With': 'XMLHttpRequest'
      }
    };
    
    const actionReq = http.request(actionOptions, (res) => {
      console.log('📡 Server action status:', res.statusCode);
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('📡 Server action response:', data);
        
        if (res.statusCode === 200) {
          console.log('✅ Server action executed successfully!');
        } else {
          console.log('❌ Server action failed');
        }
      });
    });
    
    actionReq.on('error', (error) => {
      console.error('❌ Server action request error:', error);
    });
    
    actionReq.write(formData.toString());
    actionReq.end();
    
    // Test 3: Check if magic link was created
    console.log('\n3️⃣ Checking if magic link was created...');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for action to complete
    
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
        const verificationUrl = `http://localhost:3002/api/auth/verify-magic-link?token=${latestLink.token}&auth_type=partner`;
        console.log('🔍 Testing verification URL:', verificationUrl);
        
        const verifyOptions = {
          hostname: 'localhost',
          port: 3002,
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

testPartnerAuthFlow().catch(console.error);
