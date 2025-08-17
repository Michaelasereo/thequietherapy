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

async function debugPartnerUser() {
  console.log('🔍 Debugging partner user...');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  try {
    // Check the specific user from the test
    const testEmail = 'asereopeyemimichael@gmail.com';
    const testId = 'fac0056c-2f16-4417-a1ae-9c63345937c8';
    
    console.log('🔍 Checking user with ID:', testId);
    console.log('🔍 Checking user with email:', testEmail);
    
    // Check by ID
    const { data: userById, error: idError } = await supabase
      .from('users')
      .select('*')
      .eq('id', testId)
      .single();
    
    if (idError) {
      console.log('❌ User not found by ID:', idError.message);
    } else {
      console.log('✅ User found by ID:', {
        id: userById.id,
        email: userById.email,
        full_name: userById.full_name,
        user_type: userById.user_type,
        partner_status: userById.partner_status,
        temporary_approval: userById.temporary_approval,
        is_verified: userById.is_verified,
        is_active: userById.is_active
      });
    }
    
    // Check by email
    const { data: userByEmail, error: emailError } = await supabase
      .from('users')
      .select('*')
      .eq('email', testEmail)
      .single();
    
    if (emailError) {
      console.log('❌ User not found by email:', emailError.message);
    } else {
      console.log('✅ User found by email:', {
        id: userByEmail.id,
        email: userByEmail.email,
        full_name: userByEmail.full_name,
        user_type: userByEmail.user_type,
        partner_status: userByEmail.partner_status,
        temporary_approval: userByEmail.temporary_approval,
        is_verified: userByEmail.is_verified,
        is_active: userByEmail.is_active
      });
    }
    
    // Check all partner users
    console.log('\n🔍 All partner users:');
    const { data: allPartners, error: partnersError } = await supabase
      .from('users')
      .select('id, email, full_name, user_type, partner_status, temporary_approval')
      .eq('user_type', 'partner');
    
    if (partnersError) {
      console.log('❌ Error fetching partners:', partnersError);
    } else {
      console.log('📋 Partner users found:', allPartners.length);
      allPartners.forEach((partner, index) => {
        console.log(`${index + 1}. ${partner.email} (${partner.id}) - Status: ${partner.partner_status}`);
      });
    }
    
    // Check if there's a mismatch between ID and email
    if (userById && userByEmail) {
      if (userById.id !== userByEmail.id) {
        console.log('⚠️ ID mismatch detected!');
        console.log('   ID lookup result:', userById.id);
        console.log('   Email lookup result:', userByEmail.id);
      } else {
        console.log('✅ ID and email lookups match');
      }
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

debugPartnerUser().catch(console.error);
