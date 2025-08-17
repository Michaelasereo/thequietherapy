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

async function debugDashboardError() {
  console.log('🔍 Debugging dashboard error...');
  
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
    
    // Create a valid cookie with session token
    const cookieData = {
      id: partner.id,
      email: partner.email,
      name: partner.full_name,
      role: 'partner',
      session_token: '07dbccae-3afa-42cd-a9ac-218361aa43d5'
    };
    
    const cookieValue = encodeURIComponent(JSON.stringify(cookieData));
    const cookie = `trpi_partner_user=${cookieValue}`;
    
    console.log('🔍 Testing dashboard with cookie...');
    
    // Test dashboard access with detailed error handling
    const dashboardOptions = {
      hostname: 'localhost',
      port: 3002,
      path: '/partner/dashboard',
      method: 'GET',
      headers: {
        'Cookie': cookie,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    };
    
    const dashboardReq = http.request(dashboardOptions, (res) => {
      console.log('📡 Dashboard response status:', res.statusCode);
      console.log('📡 Dashboard response headers:', res.headers);
      
      let dashboardData = '';
      res.on('data', chunk => dashboardData += chunk);
      res.on('end', () => {
        console.log('📡 Dashboard response length:', dashboardData.length);
        
        if (res.statusCode === 200) {
          console.log('✅ Dashboard loaded successfully!');
          
          // Check if the response contains error messages
          if (dashboardData.includes('error') || dashboardData.includes('Error')) {
            console.log('⚠️ Dashboard contains error messages');
            const errorMatch = dashboardData.match(/error[^<]*/gi);
            if (errorMatch) {
              console.log('🔍 Found error text:', errorMatch.slice(0, 3));
            }
          }
          
          // Check if it contains React error boundary
          if (dashboardData.includes('Something went wrong') || dashboardData.includes('Error Boundary')) {
            console.log('⚠️ Dashboard contains React error boundary');
          }
          
          // Check if it contains the expected content
          if (dashboardData.includes('Partner Overview')) {
            console.log('✅ Dashboard contains expected content');
          } else {
            console.log('⚠️ Dashboard missing expected content');
          }
          
        } else if (res.statusCode === 500) {
          console.log('❌ Dashboard returned 500 error');
          
          // Try to extract error information
          if (dashboardData.includes('Error:')) {
            const errorMatch = dashboardData.match(/Error:[^<]*/gi);
            if (errorMatch) {
              console.log('🔍 Error details:', errorMatch.slice(0, 3));
            }
          }
          
          // Check for Next.js error page
          if (dashboardData.includes('Internal Server Error')) {
            console.log('🔍 Next.js internal server error detected');
          }
          
        } else if (res.statusCode === 307 || res.statusCode === 302) {
          console.log('🔄 Dashboard redirecting to:', res.headers.location);
        } else {
          console.log('❌ Unexpected status code:', res.statusCode);
        }
        
        // Save response to file for inspection
        fs.writeFileSync('dashboard-response.html', dashboardData);
        console.log('💾 Dashboard response saved to dashboard-response.html');
      });
    });
    
    dashboardReq.on('error', (error) => {
      console.error('❌ Dashboard request error:', error);
    });
    
    dashboardReq.end();
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

debugDashboardError().catch(console.error);
