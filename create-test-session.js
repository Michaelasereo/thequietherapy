// Script to create a test session for testing the complete flow
// Run with: node create-test-session.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestSession() {
  try {
    console.log('🔍 Creating test session...');

    // First, get a therapist and a user
    const { data: therapist, error: therapistError } = await supabase
      .from('users')
      .select('id, full_name, email')
      .eq('user_type', 'therapist')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (therapistError || !therapist) {
      console.error('❌ No therapist found:', therapistError);
      return;
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, full_name, email')
      .eq('user_type', 'individual')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (userError || !user) {
      console.error('❌ No user found:', userError);
      return;
    }

    console.log('✅ Found therapist:', therapist.full_name);
    console.log('✅ Found user:', user.full_name);

    // Create a session for today at 4 PM (in the future)
    const today = new Date();
    const sessionDate = today.toISOString().split('T')[0];
    const sessionTime = '16:00';

    const sessionData = {
      user_id: user.id,
      therapist_id: therapist.id,
      scheduled_date: sessionDate,
      scheduled_time: sessionTime,
      duration_minutes: 60,
      status: 'scheduled',
      title: `Test Session - ${user.full_name}`,
      description: 'Test session created for flow testing',
      planned_duration_minutes: 60,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .insert(sessionData)
      .select()
      .single();

    if (sessionError) {
      console.error('❌ Error creating session:', sessionError);
      return;
    }

    console.log('✅ Test session created successfully!');
    console.log('Session ID:', session.id);
    console.log('Date:', sessionDate);
    console.log('Time:', sessionTime);
    console.log('Therapist:', therapist.full_name);
    console.log('User:', user.full_name);
    console.log('');
    console.log('🔗 User can now see this session at: /dashboard/sessions');
    console.log('🔗 Session details at: /dashboard/sessions/' + session.id);
    console.log('');
    console.log('To test the complete flow:');
    console.log('1. Login as the user and go to /dashboard/sessions');
    console.log('2. Click on the session to view details');
    console.log('3. Join the session when the time comes');
    console.log('4. Complete the session and add feedback');
    console.log('5. Check SOAP notes and session history');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createTestSession();
