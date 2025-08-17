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

async function testPartnerDashboardDirect() {
  console.log('🔍 Testing direct partner dashboard access...');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  try {
    // Get a partner user
    const { data: partner, error } = await supabase
      .from('users')
      .select('id, email, full_name, partner_status, temporary_approval')
      .eq('user_type', 'partner')
      .eq('partner_status', 'temporary')
      .limit(1)
      .single();
    
    if (error || !partner) {
      console.log('❌ No partner user found:', error);
      return;
    }
    
    console.log('🔍 Found partner user:', {
      id: partner.id,
      email: partner.email,
      name: partner.full_name,
      status: partner.partner_status,
      temp: partner.temporary_approval
    });
    
    // Create a valid cookie
    const cookieData = {
      id: partner.id,
      email: partner.email,
      name: partner.full_name,
      role: 'partner',
      session_token: '07dbccae-3afa-42cd-a9ac-218361aa43d5' // Use the session token from the magic link
    };
    
    const cookieValue = encodeURIComponent(JSON.stringify(cookieData));
    const cookie = `trpi_partner_user=${cookieValue}`;
    
    console.log('🔍 Testing with cookie:', cookie);
    
    // Test partner me endpoint with cookie
    const meOptions = {
      hostname: 'localhost',
      port: 3002,
      path: '/api/partner/me',
      method: 'GET',
      headers: {
        'Cookie': cookie
      }
    };
    
    const meReq = http.request(meOptions, (res) => {
      console.log('📡 Partner me status:', res.statusCode);
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('📡 Partner me response:', data);
        
        if (res.statusCode === 200) {
          console.log('✅ Partner me endpoint working!');
          
          // Now test dashboard access
          const dashboardOptions = {
            hostname: 'localhost',
            port: 3002,
            path: '/partner/dashboard',
            method: 'GET',
            headers: {
              'Cookie': cookie
            }
          };
          
          const dashboardReq = http.request(dashboardOptions, (res) => {
            console.log('📡 Dashboard status:', res.statusCode);
            console.log('📡 Dashboard headers:', res.headers);
            
            let dashboardData = '';
            res.on('data', chunk => dashboardData += chunk);
            res.on('end', () => {
              console.log('📡 Dashboard response length:', dashboardData.length);
              
              if (res.statusCode === 200) {
                console.log('✅ Dashboard loaded successfully!');
              } else if (res.statusCode === 307 || res.statusCode === 302) {
                console.log('🔄 Dashboard redirecting to:', res.headers.location);
              } else {
                console.log('❌ Dashboard failed to load');
              }
            });
          });
          
          dashboardReq.on('error', (error) => {
            console.error('❌ Dashboard request error:', error);
          });
          
          dashboardReq.end();
        } else {
          console.log('❌ Partner me endpoint failed');
        }
      });
    });
    
    meReq.on('error', (error) => {
      console.error('❌ Partner me request error:', error);
    });
    
    meReq.end();
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testPartnerDashboardDirect().catch(console.error);
