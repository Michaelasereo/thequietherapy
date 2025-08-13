require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function deleteAndCreateUser() {
  console.log('🔄 Deleting existing user and creating new one...');
  
  try {
    // Delete existing user
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('email', 'testuser@example.com');
    
    if (deleteError) {
      console.error('❌ Error deleting user:', deleteError.message);
    } else {
      console.log('✅ Deleted existing user');
    }
    
    // Create new user with 1 credit
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        email: 'testuser@example.com',
        full_name: 'John Doe',
        user_type: 'individual',
        is_verified: true,
        is_active: true,
        credits: 1,
        package_type: 'basic'
      })
      .select()
      .single();
    
    if (createError) {
      console.error('❌ Error creating user:', createError.message);
      return false;
    }
    
    console.log('✅ Successfully created new user with 1 credit');
    console.log('📊 User data:', newUser);
    
    return true;
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    return false;
  }
}

deleteAndCreateUser();
