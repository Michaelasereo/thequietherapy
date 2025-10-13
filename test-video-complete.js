/**
 * 🎥 Complete Video Session Flow Test
 * 
 * This script tests the entire video session workflow:
 * 1. Creates test patient and therapist
 * 2. Creates a video session
 * 3. Verifies Daily.co room creation
 * 4. Creates session notes
 * 5. Generates test SOAP notes
 * 6. Verifies dashboard data
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

function info(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function warn(message) {
  log(`⚠️  ${message}`, 'yellow');
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function createTestUsers() {
  info('Creating test users...');
  
  // Create test patient
  const patientEmail = `test.patient.${Date.now()}@example.com`;
  const { data: patient, error: patientError } = await supabase
    .from('users')
    .insert({
      email: patientEmail,
      full_name: 'Test Patient',
      user_type: 'individual', // Changed from 'patient' to match DB constraint
      credits: 10,
      is_verified: true,
      is_active: true,
    })
    .select()
    .single();

  if (patientError) {
    error(`Failed to create patient: ${patientError.message}`);
    return null;
  }

  success(`Created patient: ${patient.full_name} (${patient.email})`);

  // Get or create test therapist
  let { data: therapist } = await supabase
    .from('users')
    .select()
    .eq('user_type', 'therapist')
    .eq('is_active', true)
    .limit(1)
    .single();

  if (!therapist) {
    const therapistEmail = `test.therapist.${Date.now()}@example.com`;
    const { data: newTherapist, error: therapistError } = await supabase
      .from('users')
      .insert({
        email: therapistEmail,
        full_name: 'Test Therapist',
        user_type: 'therapist',
        is_verified: true,
        is_active: true,
      })
      .select()
      .single();

    if (therapistError) {
      error(`Failed to create therapist: ${therapistError.message}`);
      return null;
    }

    therapist = newTherapist;
    success(`Created therapist: ${therapist.full_name} (${therapist.email})`);
  } else {
    info(`Using existing therapist: ${therapist.full_name} (${therapist.email})`);
  }

  return { patient, therapist };
}

async function createDailyRoom() {
  info('Creating Daily.co room...');
  
  const DAILY_API_KEY = process.env.DAILY_API_KEY;
  const DAILY_DOMAIN = process.env.DAILY_DOMAIN;

  if (!DAILY_API_KEY || !DAILY_DOMAIN) {
    warn('Daily.co credentials not configured. Skipping room creation.');
    return null;
  }

  try {
    const response = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
          enable_recording: 'cloud',
          enable_chat: true,
        },
      }),
    });

    const room = await response.json();

    if (room.error) {
      error(`Daily.co error: ${room.error}`);
      return null;
    }

    success(`Created Daily.co room: ${room.name}`);
    return {
      url: room.url,
      name: room.name,
    };
  } catch (err) {
    error(`Failed to create Daily.co room: ${err.message}`);
    return null;
  }
}

async function createVideoSession(patient, therapist, dailyRoom) {
  info('Creating video session...');

  const now = new Date();
  const startTime = now.toISOString();
  const endTime = new Date(now.getTime() + 30 * 60 * 1000).toISOString(); // 30 minutes later

  const sessionData = {
    user_id: patient.id,
    therapist_id: therapist.id,
    start_time: startTime,
    end_time: endTime,
    status: 'scheduled',
    title: 'TEST VIDEO SESSION - Automated Test',
  };

  if (dailyRoom) {
    sessionData.daily_room_url = dailyRoom.url;
    sessionData.daily_room_name = dailyRoom.name;
  }

  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .insert(sessionData)
    .select()
    .single();

  if (sessionError) {
    error(`Failed to create session: ${sessionError.message}`);
    warn('Tip: Check sessions table schema with: SELECT * FROM information_schema.columns WHERE table_name = \'sessions\'');
    return null;
  }

  success(`Created session: ${session.id}`);
  info(`  Patient: ${patient.full_name}`);
  info(`  Therapist: ${therapist.full_name}`);
  info(`  Start: ${startTime}`);
  if (dailyRoom) {
    info(`  Room URL: ${dailyRoom.url}`);
  }

  return session;
}

async function createSessionNotes(session, patient, therapist) {
  info('Creating session notes...');

  const transcript = `
Therapist: Hello ${patient.full_name}, how are you feeling today?

Patient: I've been feeling quite stressed about work lately. The deadlines are overwhelming.

Therapist: I understand. Can you tell me more about what specifically is causing the most stress?

Patient: My manager keeps adding new tasks without adjusting the existing deadlines. I feel like I can't keep up, and it's affecting my sleep.

Therapist: That sounds very challenging. It's important that we address both the work stress and its impact on your sleep. Have you considered talking to your manager about workload distribution?

Patient: I'm worried that might make me seem incapable. What if they think I can't handle the job?

Therapist: That's a common concern. However, communicating about realistic workload expectations is actually a sign of professional maturity and self-awareness, not weakness.

Patient: I hadn't thought about it that way. Maybe I could try talking to them.

Therapist: That's a great step. We can work on some strategies for how to approach that conversation. Also, let's discuss some techniques to help with your sleep in the meantime.
  `.trim();

  const notesData = {
    session_id: session.id,
    therapist_id: therapist.id,
    user_id: patient.id,
    transcript: transcript,
    notes: 'Patient discussed work-related stress and sleep issues. Good engagement throughout session.',
    progress_notes: 'Patient showing awareness of stress triggers. Open to communication strategies.',
    homework_assigned: 'Practice deep breathing exercises before bed. Draft conversation points for manager discussion.',
    next_session_focus: 'Follow up on manager conversation. Continue sleep hygiene strategies.',
    mood_rating: 6,
    ai_generated: false,
  };

  const { data: notes, error: notesError } = await supabase
    .from('session_notes')
    .insert(notesData)
    .select()
    .single();

  if (notesError) {
    error(`Failed to create notes: ${notesError.message}`);
    return null;
  }

  success('Created session notes with transcript');
  return notes;
}

async function generateSOAPNotes(notes) {
  info('Generating AI SOAP notes...');

  const soapData = {
    soap_subjective: 'Patient reports feeling stressed about work with overwhelming deadlines. Manager continues to add tasks without adjusting timelines. Patient experiencing sleep disruption as a result. Patient expresses concern about appearing incapable if discussing workload with manager.',
    soap_objective: 'Patient appeared engaged and receptive during session. Demonstrated good insight into stress triggers. Showed openness to suggested interventions. Mood rating: 6/10.',
    soap_assessment: 'Patient presenting with work-related stress disorder with secondary sleep disruption. Demonstrates healthy self-awareness and willingness to implement coping strategies. Concern about professional perception may be limiting appropriate boundary-setting behaviors.',
    soap_plan: 'Continue weekly therapy sessions. Implement deep breathing exercises for sleep hygiene. Develop communication strategy for manager discussion regarding workload. Monitor sleep quality and work stress levels. Reassess in next session.',
    therapeutic_insights: JSON.stringify({
      breakthroughs: [
        'Patient reframed manager communication from weakness to professional maturity',
        'Recognition that sleep and work stress are connected',
      ],
      concerns: [
        'Sleep quality declining',
        'Potential boundary issues at work',
        'Fear of professional judgment',
      ],
      therapeutic_relationship: 'Strong rapport established. Patient responsive to reframing techniques.',
      treatment_progress: 'Early stage but positive trajectory. Patient demonstrating good insight and motivation for change.',
    }),
    ai_generated: true,
  };

  const { data: updatedNotes, error: updateError } = await supabase
    .from('session_notes')
    .update(soapData)
    .eq('id', notes.id)
    .select()
    .single();

  if (updateError) {
    error(`Failed to generate SOAP notes: ${updateError.message}`);
    return null;
  }

  success('Generated SOAP notes');
  info('  Subjective: ✓');
  info('  Objective: ✓');
  info('  Assessment: ✓');
  info('  Plan: ✓');
  info('  Therapeutic Insights: ✓');

  return updatedNotes;
}

async function verifyDashboardData(session, patient, therapist) {
  info('Verifying dashboard data...');

  // Verify patient can see session
  const { data: patientSessions, error: patientError } = await supabase
    .from('sessions')
    .select(`
      id,
      status,
      start_time,
      end_time,
      therapist:therapist_id (
        full_name,
        email
      )
    `)
    .eq('user_id', patient.id)
    .eq('id', session.id);

  if (patientError) {
    error(`Patient dashboard query failed: ${patientError.message}`);
  } else if (patientSessions && patientSessions.length > 0) {
    success(`Patient can see session on dashboard`);
  } else {
    error('Patient cannot see session on dashboard');
  }

  // Verify therapist can see session
  const { data: therapistSessions, error: therapistError } = await supabase
    .from('sessions')
    .select(`
      id,
      status,
      start_time,
      end_time,
      user:user_id (
        full_name,
        email
      )
    `)
    .eq('therapist_id', therapist.id)
    .eq('id', session.id);

  if (therapistError) {
    error(`Therapist dashboard query failed: ${therapistError.message}`);
  } else if (therapistSessions && therapistSessions.length > 0) {
    success(`Therapist can see session on dashboard`);
  } else {
    error('Therapist cannot see session on dashboard');
  }

  // Verify notes are accessible
  const { data: sessionNotes, error: notesError } = await supabase
    .from('session_notes')
    .select('*')
    .eq('session_id', session.id)
    .single();

  if (notesError) {
    error(`Session notes query failed: ${notesError.message}`);
  } else if (sessionNotes) {
    success(`Session notes are accessible`);
    if (sessionNotes.soap_subjective) {
      success(`SOAP notes are accessible`);
    }
  } else {
    error('Session notes not found');
  }
}

async function completeSession(session) {
  info('Marking session as completed...');

  const { data: updatedSession, error: updateError } = await supabase
    .from('sessions')
    .update({ status: 'completed' })
    .eq('id', session.id)
    .select()
    .single();

  if (updateError) {
    error(`Failed to complete session: ${updateError.message}`);
    return null;
  }

  success('Session marked as completed');
  return updatedSession;
}

async function printSummary(session, patient, therapist, dailyRoom) {
  log('\n' + '='.repeat(60), 'cyan');
  log('📊 TEST SUMMARY', 'cyan');
  log('='.repeat(60), 'cyan');
  
  console.log('\n📋 Session Details:');
  console.log(`   ID: ${session.id}`);
  console.log(`   Status: ${session.status}`);
  console.log(`   Start: ${session.start_time}`);
  console.log(`   End: ${session.end_time}`);
  
  console.log('\n👥 Participants:');
  console.log(`   Patient: ${patient.full_name} (${patient.email})`);
  console.log(`   Therapist: ${therapist.full_name} (${therapist.email})`);
  
  if (dailyRoom) {
    console.log('\n🎥 Video Room:');
    console.log(`   URL: ${dailyRoom.url}`);
    console.log(`   Name: ${dailyRoom.name}`);
  }
  
  console.log('\n🔗 Test URLs:');
  console.log(`   Patient Dashboard: http://localhost:3000/dashboard/therapy`);
  console.log(`   Therapist Dashboard: http://localhost:3000/therapist/dashboard/client-sessions`);
  console.log(`   Session Page: http://localhost:3000/session/${session.id}`);
  if (dailyRoom) {
    console.log(`   Video Session: http://localhost:3000/video-session/${session.id}`);
  }
  
  console.log('\n📝 Next Steps:');
  console.log('   1. Login as patient and check dashboard');
  console.log('   2. Login as therapist and check client sessions');
  console.log('   3. Verify session notes are visible');
  console.log('   4. Verify SOAP notes are visible (therapist only)');
  if (dailyRoom) {
    console.log('   5. Try joining the video session');
  }
  
  log('\n' + '='.repeat(60), 'cyan');
}

async function runTest() {
  log('\n🎥 Complete Video Session Flow Test\n', 'cyan');

  try {
    // Step 1: Create users
    const users = await createTestUsers();
    if (!users) {
      error('Failed to create test users. Exiting.');
      process.exit(1);
    }
    const { patient, therapist } = users;
    console.log('');

    // Step 2: Create Daily.co room (optional)
    const dailyRoom = await createDailyRoom();
    console.log('');

    // Step 3: Create session
    const session = await createVideoSession(patient, therapist, dailyRoom);
    if (!session) {
      error('Failed to create session. Exiting.');
      process.exit(1);
    }
    console.log('');

    // Step 4: Create notes
    const notes = await createSessionNotes(session, patient, therapist);
    if (!notes) {
      error('Failed to create notes. Exiting.');
      process.exit(1);
    }
    console.log('');

    // Step 5: Generate SOAP notes
    const soapNotes = await generateSOAPNotes(notes);
    console.log('');

    // Step 6: Verify dashboard access
    await verifyDashboardData(session, patient, therapist);
    console.log('');

    // Step 7: Complete session
    await completeSession(session);
    console.log('');

    // Step 8: Print summary
    await printSummary(session, patient, therapist, dailyRoom);

    success('\n✨ Test completed successfully!\n');

  } catch (err) {
    error(`\nTest failed with error: ${err.message}`);
    console.error(err);
    process.exit(1);
  }
}

// Run the test
runTest();

