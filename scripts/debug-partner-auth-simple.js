const http = require('http');
const https = require('https');
const { createClient } = require('@supabase/supabase-js');
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

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const req = client.request(url, {
      method: options.method || 'GET',
      headers: options.headers || {},
      ...options
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function debugPartnerAuth() {
  console.log('🔍 Testing partner authentication flow...');
  console.log('🔍 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  
  try {
    // Test 1: Check if partner auth page loads
    console.log('\n1️⃣ Testing partner auth page...');
    const authResponse = await makeRequest('http://localhost:3002/partner/auth');
    console.log('Auth page status:', authResponse.status);
    
    // Test 2: Check if partner dashboard page loads
    console.log('\n2️⃣ Testing partner dashboard page...');
    const dashboardResponse = await makeRequest('http://localhost:3002/partner/dashboard');
    console.log('Dashboard page status:', dashboardResponse.status);
    
    // Test 3: Check if partner me endpoint works
    console.log('\n3️⃣ Testing partner me endpoint...');
    const meResponse = await makeRequest('http://localhost:3002/api/partner/me');
    console.log('Partner me status:', meResponse.status);
    console.log('Partner me response:', meResponse.data);
    
    // Test 4: Check if there are any partner users in the database
    console.log('\n4️⃣ Checking for partner users in database...');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    const { data: partners, error } = await supabase
      .from('users')
      .select('id, email, user_type, partner_status, temporary_approval')
      .eq('user_type', 'partner')
      .limit(5);
    
    if (error) {
      console.log('Database error:', error);
    } else {
      console.log('Partner users found:', partners?.length || 0);
      if (partners && partners.length > 0) {
        partners.forEach(p => {
          console.log(`- ${p.email} (${p.partner_status}, temp: ${p.temporary_approval})`);
        });
      }
    }
    
    // Test 5: Check magic_links table for partner entries
    console.log('\n5️⃣ Checking magic_links table...');
    const { data: magicLinks, error: magicError } = await supabase
      .from('magic_links')
      .select('*')
      .eq('auth_type', 'partner')
      .order('created_at', { ascending: false })
      .limit(3);
    
    if (magicError) {
      console.log('Magic links query error:', magicError);
    } else {
      console.log('Recent partner magic links:', magicLinks?.length || 0);
      if (magicLinks && magicLinks.length > 0) {
        magicLinks.forEach(ml => {
          console.log(`- ${ml.email} (${ml.type}, used: ${ml.used_at ? 'Yes' : 'No'})`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

debugPartnerAuth().catch(console.error);
