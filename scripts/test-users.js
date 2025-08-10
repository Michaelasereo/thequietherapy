require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testUsersTable() {
  console.log('🧪 Testing Users Table...')
  
  try {
    // Test 1: Check if users table exists
    console.log('\n1️⃣ Testing table existence...')
    const { data: tableCheck, error: tableError } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    if (tableError) {
      console.error('❌ Users table not found:', tableError.message)
      console.log('📋 Please run the users-schema.sql file in your Supabase SQL editor first')
      return false
    }
    
    console.log('✅ Users table exists!')

    // Test 2: Count existing users
    console.log('\n2️⃣ Counting existing users...')
    const { count, error: countError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
    
    if (countError) {
      console.error('❌ Error counting users:', countError.message)
      return false
    }
    
    console.log(`✅ Found ${count} users in the table`)

    // Test 3: Fetch all users
    console.log('\n3️⃣ Fetching all users...')
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (fetchError) {
      console.error('❌ Error fetching users:', fetchError.message)
      return false
    }
    
    console.log('✅ Successfully fetched users:')
    users?.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.full_name} (${user.email}) - ${user.user_type}`)
    })

    // Test 4: Test user creation
    console.log('\n4️⃣ Testing user creation...')
    const testUser = {
      email: `test-${Date.now()}@example.com`,
      full_name: 'Test User',
      user_type: 'individual',
      is_verified: false,
      is_active: true,
      credits: 5,
      package_type: 'Basic'
    }
    
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert(testUser)
      .select()
      .single()
    
    if (createError) {
      console.error('❌ Error creating test user:', createError.message)
      return false
    }
    
    console.log('✅ Successfully created test user:', newUser.full_name)

    // Test 5: Test user update
    console.log('\n5️⃣ Testing user update...')
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ 
        full_name: 'Updated Test User',
        credits: 10 
      })
      .eq('id', newUser.id)
      .select()
      .single()
    
    if (updateError) {
      console.error('❌ Error updating user:', updateError.message)
      return false
    }
    
    console.log('✅ Successfully updated user:', updatedUser.full_name, 'Credits:', updatedUser.credits)

    // Test 6: Test user deletion (cleanup)
    console.log('\n6️⃣ Cleaning up test user...')
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', newUser.id)
    
    if (deleteError) {
      console.error('❌ Error deleting test user:', deleteError.message)
      return false
    }
    
    console.log('✅ Successfully deleted test user')

    // Test 7: Test filtering by user type
    console.log('\n7️⃣ Testing user type filtering...')
    const { data: individualUsers, error: filterError } = await supabase
      .from('users')
      .select('*')
      .eq('user_type', 'individual')
    
    if (filterError) {
      console.error('❌ Error filtering users:', filterError.message)
      return false
    }
    
    console.log(`✅ Found ${individualUsers?.length} individual users`)

    console.log('\n🎉 All users table tests passed!')
    console.log('📋 Users table is working correctly')
    return true

  } catch (error) {
    console.error('❌ Test failed with error:', error)
    return false
  }
}

// Run the test
testUsersTable()
