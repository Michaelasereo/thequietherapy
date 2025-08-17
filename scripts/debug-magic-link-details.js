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

async function debugMagicLinkDetails() {
  console.log('🔍 Debugging magic link details...');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  try {
    // Get the latest partner magic link
    const { data: magicLinks, error: magicError } = await supabase
      .from('magic_links')
      .select('*')
      .eq('auth_type', 'partner')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (magicError) {
      console.log('❌ Magic links query error:', magicError);
      return;
    }
    
    console.log('📊 Found magic links:', magicLinks.length);
    
    magicLinks.forEach((link, index) => {
      console.log(`\n${index + 1}. Magic Link Details:`);
      console.log(`   ID: ${link.id}`);
      console.log(`   Email: ${link.email}`);
      console.log(`   Token: ${link.token}`);
      console.log(`   Auth Type: ${link.auth_type}`);
      console.log(`   Type: ${link.type}`);
      console.log(`   Created: ${link.created_at}`);
      console.log(`   Expires: ${link.expires_at}`);
      console.log(`   Used: ${link.used_at ? 'Yes' : 'No'}`);
      console.log(`   Used At: ${link.used_at || 'Not used'}`);
      
      // Check if expired
      const now = new Date();
      const expiresAt = new Date(link.expires_at);
      const isExpired = expiresAt < now;
      const timeDiffMs = expiresAt.getTime() - now.getTime();
      const timeDiffMinutes = timeDiffMs / (1000 * 60);
      
      console.log(`   Is Expired: ${isExpired}`);
      console.log(`   Time Until Expiry: ${timeDiffMinutes.toFixed(2)} minutes`);
      
      // Check if user exists
      console.log(`   User Check: ${link.email}`);
    });
    
    // Test the verification logic manually
    if (magicLinks.length > 0) {
      const latestLink = magicLinks[0];
      console.log('\n🔍 Testing verification logic manually...');
      
      // Step 1: Check if magic link exists and is not used
      const { data: magicLink, error: lookupError } = await supabase
        .from('magic_links')
        .select('*')
        .eq('token', latestLink.token)
        .eq('auth_type', 'partner')
        .is('used_at', null)
        .single();
      
      if (lookupError) {
        console.log('❌ Magic link lookup failed:', lookupError.message);
      } else if (!magicLink) {
        console.log('❌ Magic link not found or already used');
      } else {
        console.log('✅ Magic link found and not used');
        
        // Step 2: Check expiration
        const now = new Date();
        const expiresAt = new Date(magicLink.expires_at);
        const timeDiffMs = expiresAt.getTime() - now.getTime();
        
        if (timeDiffMs < 0) {
          console.log('❌ Magic link expired');
        } else {
          console.log('✅ Magic link not expired');
          
          // Step 3: Check if user exists
          const { data: user, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('email', magicLink.email)
            .single();
          
          if (userError) {
            console.log('❌ User lookup failed:', userError.message);
          } else if (!user) {
            console.log('❌ User not found');
          } else {
            console.log('✅ User found:', {
              id: user.id,
              email: user.email,
              user_type: user.user_type,
              is_verified: user.is_verified,
              partner_status: user.partner_status
            });
          }
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

debugMagicLinkDetails().catch(console.error);
