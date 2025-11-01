/**
 * Test script to verify therapist sessions are correctly matched
 * Run with: node test-therapist-sessions-match.js
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTherapistSessionsMatch() {
  console.log('🧪 Testing Therapist Sessions Match...\n');

  try {
    // 1. Get all therapists
    console.log('1️⃣  Fetching all therapists...');
    const { data: therapists, error: therapistsError } = await supabase
      .from('users')
      .select('id, email, full_name, user_type')
      .eq('user_type', 'therapist');

    if (therapistsError) {
      throw therapistsError;
    }

    console.log(`   ✅ Found ${therapists.length} therapists\n`);

    // 2. Get all sessions
    console.log('2️⃣  Fetching all sessions...');
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('id, therapist_id, user_id, status, created_at, title')
      .order('created_at', { ascending: false });

    if (sessionsError) {
      throw sessionsError;
    }

    console.log(`   ✅ Found ${sessions.length} sessions\n`);

    // 3. Check for mismatches
    console.log('3️⃣  Checking for mismatches...');
    const therapistIds = new Set(therapists.map(t => t.id));
    const mismatches = [];
    const validSessions = [];

    for (const session of sessions) {
      if (!session.therapist_id) {
        mismatches.push({
          session_id: session.id,
          issue: 'Missing therapist_id',
          session
        });
      } else if (!therapistIds.has(session.therapist_id)) {
        mismatches.push({
          session_id: session.id,
          issue: 'Orphaned session (therapist_id not found in users table)',
          therapist_id: session.therapist_id,
          session
        });
      } else {
        validSessions.push(session);
      }
    }

    // 4. Count sessions per therapist
    console.log('4️⃣  Counting sessions per therapist...');
    const sessionsByTherapist = new Map();
    
    for (const therapist of therapists) {
      const therapistSessions = validSessions.filter(s => s.therapist_id === therapist.id);
      sessionsByTherapist.set(therapist.id, {
        therapist,
        count: therapistSessions.length,
        sessions: therapistSessions
      });
    }

    // 5. Display results
    console.log('\n📊 RESULTS:\n');
    
    if (mismatches.length > 0) {
      console.log('❌ FOUND MISMATCHES:');
      mismatches.forEach((mismatch, index) => {
        console.log(`   ${index + 1}. Session ${mismatch.session_id}`);
        console.log(`      Issue: ${mismatch.issue}`);
        if (mismatch.therapist_id) {
          console.log(`      therapist_id: ${mismatch.therapist_id}`);
        }
      });
      console.log(`\n   Total mismatches: ${mismatches.length}\n`);
    } else {
      console.log('✅ NO MISMATCHES FOUND!\n');
    }

    console.log('📈 Sessions by Therapist:');
    const sortedTherapists = Array.from(sessionsByTherapist.values())
      .sort((a, b) => b.count - a.count);

    sortedTherapists.forEach(({ therapist, count, sessions }) => {
      const scheduledCount = sessions.filter(s => 
        ['scheduled', 'confirmed', 'pending_approval'].includes(s.status)
      ).length;
      
      console.log(`   ${therapist.email}:`);
      console.log(`      Total: ${count} sessions`);
      console.log(`      Scheduled: ${scheduledCount} sessions`);
      if (scheduledCount > 0) {
        console.log(`      ✅ Has upcoming sessions`);
      }
    });

    // 6. Test API endpoint would return
    console.log('\n5️⃣  Testing API endpoint logic...');
    for (const therapist of therapists.slice(0, 3)) { // Test first 3 therapists
      const { data: apiSessions, error: apiError } = await supabase
        .from('sessions')
        .select('id, status, user_id, scheduled_date, scheduled_time, start_time, created_at, title, complaints')
        .eq('therapist_id', therapist.id)
        .order('created_at', { ascending: false });

      if (apiError) {
        console.log(`   ❌ Error for ${therapist.email}:`, apiError.message);
      } else {
        console.log(`   ${therapist.email}: API would return ${apiSessions?.length || 0} sessions`);
      }
    }

    console.log('\n✅ Test completed!\n');

    if (mismatches.length > 0) {
      console.log('⚠️  WARNING: There are mismatched sessions that need fixing!');
      process.exit(1);
    } else {
      console.log('✅ All sessions are correctly matched!');
      process.exit(0);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testTherapistSessionsMatch();

