const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  'https://frzciymslvpohhyefmtr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyemNpeW1zbHZwb2hoeWVmbXRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDcwODQ4MiwiZXhwIjoyMDcwMjg0NDgyfQ.RTCdw-tk6pe0k-QpO0jngK64gEJOM2KU3sHS435myxM'
);

async function checkUserType() {
  console.log('🔍 Checking user type for test@example.com...\n');
  
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'test@example.com')
      .single();
    
    if (error) {
      console.error('❌ Error fetching user:', error);
      return;
    }
    
    if (user) {
      console.log('✅ User found:');
      console.log('  - Email:', user.email);
      console.log('  - User Type:', user.user_type);
      console.log('  - Full Name:', user.full_name);
      console.log('  - Is Verified:', user.is_verified);
      console.log('  - Is Active:', user.is_active);
      console.log('  - Created:', user.created_at);
    } else {
      console.log('❌ User not found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the check
checkUserType();
