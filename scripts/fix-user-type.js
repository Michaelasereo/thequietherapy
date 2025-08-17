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

async function fixUserType() {
  console.log('🔧 Fixing user type...');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  try {
    const testEmail = 'asereopeyemimichael@gmail.com';
    const testId = 'fac0056c-2f16-4417-a1ae-9c63345937c8';
    
    console.log('🔍 Updating user:', testEmail);
    
    // Update user type to partner
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        user_type: 'partner',
        partner_status: 'temporary',
        temporary_approval: true
      })
      .eq('id', testId)
      .select()
      .single();
    
    if (updateError) {
      console.log('❌ Error updating user:', updateError);
      return;
    }
    
    console.log('✅ User updated successfully:', {
      id: updatedUser.id,
      email: updatedUser.email,
      full_name: updatedUser.full_name,
      user_type: updatedUser.user_type,
      partner_status: updatedUser.partner_status,
      temporary_approval: updatedUser.temporary_approval
    });
    
    // Verify the update
    const { data: verifyUser, error: verifyError } = await supabase
      .from('users')
      .select('*')
      .eq('id', testId)
      .single();
    
    if (verifyError) {
      console.log('❌ Error verifying update:', verifyError);
    } else {
      console.log('✅ Verification successful:', {
        user_type: verifyUser.user_type,
        partner_status: verifyUser.partner_status,
        temporary_approval: verifyUser.temporary_approval
      });
    }
    
  } catch (error) {
    console.error('❌ Fix error:', error);
  }
}

fixUserType().catch(console.error);
