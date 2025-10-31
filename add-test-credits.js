// Add credits to test user
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TEST_USER_EMAIL = 'obgynect@gmail.com';

async function addTestCredits() {
  console.log('💰 Adding test credits to user...\n');
  
  // Find user by email
  const { data: users, error: userError } = await supabase
    .from('users')
    .select('id, email, user_type')
    .eq('email', TEST_USER_EMAIL);
  
  if (!users || users.length === 0) {
    console.log('❌ User not found:', userError?.message);
    return;
  }
  
  const user = users[0]; // Get first matching user
  const TEST_USER_ID = user.id;
  
  if (!user) {
    console.log('❌ User not found:', userError?.message);
    return;
  }
  
  console.log('✅ User found:', user.email);
  console.log('   Type:', user.user_type);
  
  // Check existing credits
  const { data: existingCredits, error: creditsError } = await supabase
    .from('user_credits')
    .select('*')
    .eq('user_id', TEST_USER_ID)
    .in('user_type', ['user', 'individual'])
    .order('created_at', { ascending: false })
    .limit(1);
  
  if (existingCredits && existingCredits.length > 0) {
    const credit = existingCredits[0];
    console.log('\n📊 Current credits:');
    console.log('   Balance:', credit.credits_balance);
    console.log('   Used:', credit.credits_used);
    
    if (credit.credits_balance > 0) {
      console.log('\n✅ User already has credits!');
      return;
    }
  } else {
    console.log('\n⚠️  No credits found for user');
  }
  
  // Add credits
  console.log('\n➕ Adding 10 test credits...');
  
  const { data: newCredit, error: insertError } = await supabase
    .from('user_credits')
    .insert({
      user_id: TEST_USER_ID,
      user_type: user.user_type === 'individual' ? 'individual' : 'user',
      credits_balance: 10,
      credits_used: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();
  
  if (insertError) {
    console.log('❌ Failed to add credits:', insertError.message);
    console.log('   Details:', insertError.details);
    return;
  }
  
  console.log('\n✅ Credits added successfully!');
  console.log('   Credit ID:', newCredit.id);
  console.log('   Balance:', newCredit.credits_balance);
  console.log('   Used:', newCredit.credits_used);
  console.log('\n🎉 You can now test booking!');
}

addTestCredits().catch(console.error);

