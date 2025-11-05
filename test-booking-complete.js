/**
 * Complete Booking Test Script
 * 
 * Tests the full booking flow with authentication
 * 
 * Usage: node test-booking-complete.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createUserSession(userId) {
  console.log(`\n🔐 Creating session for user: ${userId}`);
  
  // Create a session in the database
  const sessionToken = `test-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours from now
  
  const { data: session, error } = await supabase
    .from('user_sessions')
    .insert({
      user_id: userId,
      session_token: sessionToken,
      expires_at: expiresAt.toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();
  
  if (error) {
    console.error('❌ Error creating session:', error);
    return null;
  }
  
  console.log('✅ Session created:', sessionToken);
  return sessionToken;
}

async function findOrCreateTestUser() {
  console.log('\n👤 Finding test user...');
  
  const testEmail = 'obgynect@gmail.com';
  
  // Check if user exists
  const { data: existingUsers, error: userError } = await supabase
    .from('users')
    .select('id, email, full_name, user_type')
    .eq('email', testEmail)
    .eq('user_type', 'individual')
    .limit(1);
  
  if (existingUsers && existingUsers.length > 0) {
    const existingUser = existingUsers[0];
    console.log('✅ Test user exists:', {
      id: existingUser.id,
      email: existingUser.email
    });
    
    // Check if user has credits (sum all credits)
    const { data: creditsList } = await supabase
      .from('user_credits')
      .select('credits_balance')
      .eq('user_id', existingUser.id);
    
    const totalCredits = creditsList && creditsList.length > 0
      ? creditsList.reduce((sum, c) => sum + (c.credits_balance || 0), 0)
      : 0;
    
    console.log(`   Credits: ${totalCredits}`);
    
    if (totalCredits < 1) {
      console.log('   ⚠️  User has no credits, adding 1 credit...');
      // Check if user_credits record exists
      const { data: existingCredit } = await supabase
        .from('user_credits')
        .select('id, credits_balance')
        .eq('user_id', existingUser.id)
        .eq('user_type', 'user')
        .single();
      
      if (existingCredit) {
        // Update existing credit
        const { error: creditError } = await supabase
          .from('user_credits')
          .update({
            credits_balance: 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingCredit.id);
        
        if (creditError) {
          console.error('❌ Error updating credits:', creditError);
        } else {
          console.log('✅ Updated credits to 1');
        }
      } else {
        // Insert new credit - ensure user exists first
        const { error: creditError } = await supabase
          .from('user_credits')
          .insert({
            user_id: existingUser.id,
            credits_balance: 1,
            user_type: 'user',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (creditError) {
          console.error('❌ Error adding credits:', creditError);
          console.log('   Trying to get user details to verify...');
          // Verify user exists
          const { data: userVerify } = await supabase
            .from('users')
            .select('id, email')
            .eq('id', existingUser.id)
            .single();
          console.log('   User verification:', userVerify ? 'Found' : 'Not found');
        } else {
          console.log('✅ Added 1 credit to user');
        }
      }
    }
    
    return existingUser;
  }
  
  if (userError && userError.code !== 'PGRST116') {
    console.error('❌ Error checking user:', userError);
    return null;
  }
  
  // Create new user
  console.log('   Creating new test user...');
  const { data: newUser, error: createError } = await supabase
    .from('users')
    .insert({
      email: testEmail,
      full_name: 'Test Booking User',
      user_type: 'individual',
      is_verified: true,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();
  
  if (createError) {
    console.error('❌ Error creating user:', createError);
    return null;
  }
  
  // Add credit
  await supabase
      .from('user_credits')
      .insert({
        user_id: newUser.id,
        credits_balance: 1,
        user_type: 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
  
  console.log('✅ Created test user with 1 credit:', {
    id: newUser.id,
    email: newUser.email
  });
  
  return newUser;
}

async function findAvailableTherapist() {
  console.log('\n👨‍⚕️ Finding available therapist...');
  
  // Find approved therapist with enrollment
  const { data: therapists, error } = await supabase
    .from('users')
    .select(`
      id,
      email,
      full_name,
      therapist_enrollments!inner(
        id,
        status,
        is_active
      )
    `)
    .eq('user_type', 'therapist')
    .eq('is_verified', true)
    .eq('is_active', true)
    .eq('therapist_enrollments.status', 'approved')
    .eq('therapist_enrollments.is_active', true)
    .limit(1);
  
  if (error || !therapists || therapists.length === 0) {
    console.error('❌ No approved therapists found');
    console.log('\n💡 To fix this:');
    console.log('   1. Make sure therapists are approved');
    console.log('   2. Check therapist_enrollments table');
    return null;
  }
  
  const therapist = therapists[0];
  console.log('✅ Found therapist:', {
    id: therapist.id,
    email: therapist.email,
    name: therapist.full_name
  });
  
  return therapist;
}

async function testBookingAPI(userId, sessionToken, therapistId) {
  console.log('\n📅 Testing booking API...');
  
  // Create a future date (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const sessionDate = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD
  const sessionTime = '10:00'; // HH:MM
  
  const bookingData = {
    therapist_id: therapistId,
    session_date: sessionDate,
    start_time: sessionTime,
    duration: 60,
    session_type: 'video',
    notes: 'Test booking from automated test script'
  };
  
  console.log('📝 Booking data:', {
    therapist_id: therapistId,
    session_date: sessionDate,
    start_time: sessionTime,
    duration: 60
  });
  
  // Get user data
  const { data: user } = await supabase
    .from('users')
    .select('id, email, full_name, user_type, is_verified, is_active')
    .eq('id', userId)
    .single();
  
  if (!user) {
    console.error('❌ User not found');
    return { success: false, error: 'User not found' };
  }
  
  // Create JWT token using jose library (same as the API expects)
  const { SignJWT } = require('jose');
  const JWT_SECRET = process.env.JWT_SECRET;
  
  if (!JWT_SECRET) {
    console.error('❌ JWT_SECRET environment variable not set');
    return { success: false, error: 'JWT_SECRET not configured' };
  }
  
  const secret = new TextEncoder().encode(JWT_SECRET);
  
  // Create JWT token
  const token = await new SignJWT({
    id: user.id,
    email: user.email,
    name: user.full_name,
    user_type: user.user_type,
    is_verified: user.is_verified,
    is_active: user.is_active
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret);
  
  console.log('✅ Created JWT token');
  
  console.log('🔐 Making authenticated API request...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/sessions/book`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `quiet_session=${token}`
      },
      body: JSON.stringify(bookingData)
    });
    
    const result = await response.json();
    
    console.log(`📊 Response status: ${response.status}`);
    
    if (response.ok && result.data?.session) {
      console.log('✅ Booking successful!');
      console.log('📋 Session details:', {
        id: result.data.session.id,
        status: result.data.session.status,
        scheduled_date: result.data.session.scheduled_date,
        scheduled_time: result.data.session.scheduled_time,
        therapist_id: result.data.session.therapist_id,
        user_id: result.data.session.user_id
      });
      return { success: true, session: result.data.session };
    } else {
      console.log('❌ Booking failed');
      console.log('📋 Error details:', {
        status: response.status,
        error: result.error,
        message: result.message,
        fullResponse: JSON.stringify(result, null, 2)
      });
      return { success: false, error: result.error || result.message };
    }
  } catch (error) {
    console.error('❌ Request error:', error.message);
    return { success: false, error: error.message };
  }
}

async function runTest() {
  console.log('🧪 COMPLETE BOOKING TEST');
  console.log('='.repeat(60));
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Supabase URL: ${supabaseUrl}`);
  
  try {
    // Step 1: Find or create test user
    const user = await findOrCreateTestUser();
    if (!user) {
      console.error('❌ Failed to find or create test user');
      process.exit(1);
    }
    
    // Step 2: Find available therapist
    const therapist = await findAvailableTherapist();
    if (!therapist) {
      console.error('❌ Failed to find available therapist');
      process.exit(1);
    }
    
    // Step 3: Test booking API
    const result = await testBookingAPI(user.id, null, therapist.id);
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    
    if (result.success) {
      console.log('✅ BOOKING TEST PASSED!');
      console.log(`   Session ID: ${result.session.id}`);
      console.log(`   Status: ${result.session.status}`);
      console.log(`   Date: ${result.session.scheduled_date}`);
      console.log(`   Time: ${result.session.scheduled_time}`);
    } else {
      console.log('❌ BOOKING TEST FAILED');
      console.log(`   Error: ${result.error}`);
      console.log('\n💡 Common issues:');
      console.log('   1. Database function needs updating (ambiguous column error)');
      console.log('   2. Therapist availability not configured');
      console.log('   3. User has insufficient credits');
      console.log('   4. JWT_SECRET not configured');
    }
    
    return result.success;
  } catch (error) {
    console.error('\n💥 FATAL ERROR:', error);
    console.error(error.stack);
    return false;
  }
}

// Run test
if (require.main === module) {
  runTest()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Unhandled error:', error);
      process.exit(1);
    });
}

module.exports = { runTest };

