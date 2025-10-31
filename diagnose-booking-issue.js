// 🔍 BOOKING SYSTEM DIAGNOSTIC SCRIPT
// Run: node diagnose-booking-issue.js

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TEST_USER_ID = '5803b951-f0b4-462c-b1d9-7bab27dfc5f7';
const TEST_THERAPIST_ID = '1229dfcb-db86-43d0-ad3b-988fcef6c2e1';

async function diagnoseBookingSystem() {
  console.log('🔍 BOOKING SYSTEM DIAGNOSTIC\n');
  console.log('='.repeat(50));
  
  // 1. Check Database Connection
  console.log('\n1️⃣  DATABASE CONNECTION');
  try {
    const { data, error } = await supabase.rpc('version');
    if (error) {
      console.log('❌ Database connection failed:', error.message);
    } else {
      console.log('✅ Database connected');
    }
  } catch (error) {
    console.log('❌ Connection error:', error.message);
  }
  
  // 2. Check Function Exists
  console.log('\n2️⃣  FUNCTION CHECK');
  try {
    const { data: func, error } = await supabase
      .from('pg_proc')
      .select('proname')
      .eq('proname', 'create_session_with_credit_deduction')
      .limit(1);
    
    // Try calling the function to see if it exists
    const { data: testCall, error: callError } = await supabase
      .rpc('create_session_with_credit_deduction', {
        p_user_id: TEST_USER_ID,
        p_therapist_id: TEST_THERAPIST_ID,
        p_session_date: '1970-01-01',
        p_session_time: '00:00',
        p_duration_minutes: 1,
        p_session_type: 'video',
        p_notes: 'diagnostic',
        p_title: 'Diagnostic'
      });
    
    if (callError) {
      console.log('⚠️  Function exists but callable:', callError.message.includes('function') ? '✅' : '❌');
      console.log('   Error:', callError.message);
      console.log('   (Expected to fail validation - confirms function exists)');
    } else {
      console.log('✅ Function callable');
    }
  } catch (error) {
    console.log('❌ Function check error:', error.message);
  }
  
  // 3. Check Test User
  console.log('\n3️⃣  TEST USER STATUS');
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, email, user_type, is_verified, is_active')
    .eq('id', TEST_USER_ID)
    .single();
  
  if (user) {
    console.log('✅ User found:', user.email);
    console.log('   Type:', user.user_type);
    console.log('   Verified:', user.is_verified);
    console.log('   Active:', user.is_active);
  } else {
    console.log('❌ User not found:', userError?.message);
  }
  
  // 4. Check User Credits
  console.log('\n4️⃣  USER CREDITS');
  const { data: credits, error: creditsError } = await supabase
    .from('user_credits')
    .select('*')
    .eq('user_id', TEST_USER_ID)
    .in('user_type', ['user', 'individual'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  if (credits) {
    console.log('✅ Credits found');
    console.log('   Balance:', credits.credits_balance);
    console.log('   Used:', credits.credits_used);
    console.log('   Type:', credits.user_type);
  } else {
    console.log('❌ No credits found:', creditsError?.message);
    console.log('   ⚠️  This is likely the problem!');
  }
  
  // 5. Check Test Therapist
  console.log('\n5️⃣  TEST THERAPIST STATUS');
  const { data: therapist, error: therapistError } = await supabase
    .from('users')
    .select(`
      id,
      email,
      user_type,
      is_verified,
      is_active,
      therapist_profiles (
        verification_status,
        is_verified
      )
    `)
    .eq('id', TEST_THERAPIST_ID)
    .eq('user_type', 'therapist')
    .single();
  
  if (therapist) {
    console.log('✅ Therapist found:', therapist.email);
    console.log('   Verified:', therapist.is_verified);
    console.log('   Active:', therapist.is_active);
    if (therapist.therapist_profiles) {
      const profile = therapist.therapist_profiles[0] || therapist.therapist_profiles;
      console.log('   Profile verification:', profile?.verification_status);
      console.log('   Profile is_verified:', profile?.is_verified);
    } else {
      console.log('⚠️  No therapist_profiles found!');
    }
  } else {
    console.log('❌ Therapist not found:', therapistError?.message);
  }
  
  // 6. Check Exclusion Constraint
  console.log('\n6️⃣  EXCLUSION CONSTRAINT');
  const { data: constraint, error: constraintError } = await supabase
    .rpc('pg_constraint_check', {
      constraint_name: 'exclude_sessions_therapist_time_overlap'
    }).catch(() => ({ data: null, error: { message: 'Cannot check via RPC' } }));
  
  console.log('   (Check via SQL query for detailed info)');
  
  // 7. Check for Existing Conflicts
  console.log('\n7️⃣  POTENTIAL CONFLICTS');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const sessionDate = tomorrow.toISOString().split('T')[0];
  
  const { data: conflicts, error: conflictsError } = await supabase
    .from('sessions')
    .select('id, scheduled_date, scheduled_time, start_time, end_time, status')
    .eq('therapist_id', TEST_THERAPIST_ID)
    .eq('scheduled_date', sessionDate)
    .in('status', ['scheduled', 'confirmed', 'in_progress']);
  
  if (conflicts && conflicts.length > 0) {
    console.log('⚠️  Found', conflicts.length, 'existing session(s) on that date:');
    conflicts.forEach(c => {
      console.log(`   - ${c.scheduled_time} (Status: ${c.status})`);
    });
  } else {
    console.log('✅ No conflicts found for test date');
  }
  
  // 8. Try Actual Function Call
  console.log('\n8️⃣  ATTEMPT FUNCTION CALL');
  try {
    const { data: result, error: funcError } = await supabase
      .rpc('create_session_with_credit_deduction', {
        p_user_id: TEST_USER_ID,
        p_therapist_id: TEST_THERAPIST_ID,
        p_session_date: sessionDate,
        p_session_time: '10:00',
        p_duration_minutes: 60,
        p_session_type: 'video',
        p_notes: 'Diagnostic test',
        p_title: 'Diagnostic Booking Test'
      });
    
    if (funcError) {
      console.log('❌ Function call failed');
      console.log('   Error:', funcError.message);
      console.log('   Details:', funcError.details);
      console.log('   Hint:', funcError.hint);
      
      // Common error analysis
      if (funcError.message.includes('credits')) {
        console.log('\n💡 LIKELY ISSUE: Credit deduction problem');
        console.log('   Check if user has credits balance > 0');
      } else if (funcError.message.includes('conflict') || funcError.message.includes('overlap')) {
        console.log('\n💡 LIKELY ISSUE: Time slot conflict');
        console.log('   Check existing sessions for that time');
      } else if (funcError.message.includes('therapist')) {
        console.log('\n💡 LIKELY ISSUE: Therapist validation failed');
        console.log('   Check therapist_profiles verification_status = approved');
      } else if (funcError.message.includes('user_id') || funcError.message.includes('user')) {
        console.log('\n💡 LIKELY ISSUE: User validation failed');
        console.log('   Check user exists and is verified/active');
      }
    } else {
      console.log('✅ Function call succeeded!');
      console.log('   Result:', result);
    }
  } catch (error) {
    console.log('❌ Function call exception:', error.message);
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 DIAGNOSTIC SUMMARY');
  console.log('='.repeat(50));
  console.log('\nCommon issues to check:');
  console.log('1. User credits balance > 0');
  console.log('2. Therapist verification_status = "approved"');
  console.log('3. No time slot conflicts');
  console.log('4. User is_verified = true');
  console.log('5. Function exists and is accessible');
  console.log('\n✅ Run SQL diagnostic for detailed analysis:');
  console.log('   psql $DATABASE_URL -f diagnose-booking-issue.sql\n');
}

diagnoseBookingSystem().catch(console.error);

