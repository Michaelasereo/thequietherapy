require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function updateUserCredits() {
  console.log('🔄 Updating user credits...');
  
  try {
    // Update the testuser@example.com credits to 1
    const { data, error } = await supabase
      .from('users')
      .update({ credits: 1 })
      .eq('email', 'testuser@example.com')
      .select();
    
    if (error) {
      console.error('❌ Error updating user credits:', error.message);
      return false;
    }
    
    if (data && data.length > 0) {
      console.log('✅ Successfully updated user credits to 1');
      console.log('📊 Updated user:', data[0].full_name, 'Credits:', data[0].credits);
    } else {
      console.log('⚠️  No user found with email testuser@example.com');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    return false;
  }
}

updateUserCredits();
