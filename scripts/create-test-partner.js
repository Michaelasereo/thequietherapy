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

async function createTestPartner() {
  console.log('🔍 Creating test partner user...');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  try {
    const testEmail = 'test@partner.com';
    
    // Check if partner user already exists
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', testEmail)
      .eq('user_type', 'partner')
      .single();
    
    if (userError && userError.code !== 'PGRST116') {
      console.log('❌ Error checking existing user:', userError);
      return;
    }
    
    if (existingUser) {
      console.log('✅ Test partner user already exists:', existingUser.email);
      return existingUser;
    }
    
    // Create new partner user
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        email: testEmail,
        full_name: 'Test Partner',
        user_type: 'partner',
        is_verified: true,
        is_active: true,
        partner_status: 'temporary',
        temporary_approval: true,
        company_name: 'Test Company',
        organization_type: 'corporate',
        contact_person: 'Test Contact'
      })
      .select()
      .single();
    
    if (createError) {
      console.log('❌ Error creating partner user:', createError);
      return;
    }
    
    console.log('✅ Created test partner user:', newUser.email);
    console.log('📋 User details:', {
      id: newUser.id,
      email: newUser.email,
      user_type: newUser.user_type,
      partner_status: newUser.partner_status,
      temporary_approval: newUser.temporary_approval
    });
    
    return newUser;
    
  } catch (error) {
    console.error('❌ Create test partner error:', error);
  }
}

createTestPartner().catch(console.error);
