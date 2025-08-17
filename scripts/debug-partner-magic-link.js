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

async function debugPartnerMagicLink() {
  console.log('🔍 Debugging partner magic link sending...');
  console.log('🔍 Environment check:');
  console.log('- NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set');
  console.log('- SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Not set');
  console.log('- BREVO_SMTP_USER:', process.env.BREVO_SMTP_USER ? 'Set' : 'Not set');
  console.log('- BREVO_SMTP_PASS:', process.env.BREVO_SMTP_PASS ? 'Set' : 'Not set');
  
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
    
    // Test 2: Test magic link creation directly
    console.log('\n2️⃣ Testing magic link creation...');
    const testEmail = 'test@partner.com';
    
    // Test the partner magic link action
    const magicLinkOptions = {
      hostname: 'localhost',
      port: 3002,
      path: '/api/auth/magic-link',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const magicLinkData = JSON.stringify({
      email: testEmail,
      auth_type: 'partner',
      type: 'login'
    });
    
    const magicLinkReq = http.request(magicLinkOptions, (res) => {
      console.log('📡 Magic link creation status:', res.statusCode);
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('📡 Magic link response:', data);
        
        if (res.statusCode === 200) {
          console.log('✅ Magic link created successfully!');
        } else {
          console.log('❌ Magic link creation failed');
        }
      });
    });
    
    magicLinkReq.on('error', (error) => {
      console.error('❌ Magic link request error:', error);
    });
    
    magicLinkReq.write(magicLinkData);
    magicLinkReq.end();
    
    // Test 3: Check magic_links table
    console.log('\n3️⃣ Checking magic_links table...');
    const { data: magicLinks, error: magicError } = await supabase
      .from('magic_links')
      .select('*')
      .eq('auth_type', 'partner')
      .order('created_at', { ascending: false })
      .limit(3);
    
    if (magicError) {
      console.log('❌ Magic links query error:', magicError);
    } else {
      console.log('📊 Recent partner magic links:', magicLinks?.length || 0);
      if (magicLinks && magicLinks.length > 0) {
        magicLinks.forEach(ml => {
          console.log(`- ${ml.email} (${ml.type}, used: ${ml.used_at ? 'Yes' : 'No'}, created: ${ml.created_at})`);
        });
      }
    }
    
    // Test 4: Check if there are any recent errors in the database
    console.log('\n4️⃣ Checking for any database issues...');
    const { data: partners, error: partnerError } = await supabase
      .from('users')
      .select('id, email, user_type, partner_status, temporary_approval')
      .eq('user_type', 'partner')
      .limit(5);
    
    if (partnerError) {
      console.log('❌ Partners query error:', partnerError);
    } else {
      console.log('📊 Partner users found:', partners?.length || 0);
      if (partners && partners.length > 0) {
        partners.forEach(p => {
          console.log(`- ${p.email} (${p.partner_status}, temp: ${p.temporary_approval})`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

debugPartnerMagicLink().catch(console.error);
