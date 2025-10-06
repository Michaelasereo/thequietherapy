// Script to create a test session using the API endpoint
// Run with: node create-test-session-api.js

const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

async function createTestSession() {
  try {
    console.log('🔍 Creating test session using API...');

    // First, get users from the database
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Get a therapist and a user
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

    // Create a session for tomorrow at 2 PM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const sessionDate = tomorrow.toISOString().split('T')[0];
    const sessionTime = '14:00';

    // Create session using the booking API
    const bookingData = {
      therapist_id: therapist.id,
      session_date: sessionDate,
      start_time: sessionTime,
      duration: 60,
      session_type: 'video',
      notes: 'Test session created for flow testing'
    };

    console.log('📅 Creating session for:', sessionDate, 'at', sessionTime);

    // Note: This would normally require authentication, but for testing we'll create directly in DB
    // Let's create a simple session without the complex constraints
    const sessionData = {
      user_id: user.id,
      therapist_id: therapist.id,
      scheduled_date: sessionDate,
      scheduled_time: sessionTime,
      duration_minutes: 60,
      status: 'scheduled',
      title: `Test Session - ${user.full_name}`,
      description: 'Test session created for flow testing',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Try to insert with minimal data
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .insert(sessionData)
      .select()
      .single();

    if (sessionError) {
      console.error('❌ Error creating session:', sessionError);
      console.log('Trying with even simpler data...');
      
      // Try with absolute minimal data
      const minimalSessionData = {
        user_id: user.id,
        therapist_id: therapist.id,
        scheduled_date: sessionDate,
        scheduled_time: sessionTime,
        status: 'scheduled'
      };

      const { data: minimalSession, error: minimalError } = await supabase
        .from('sessions')
        .insert(minimalSessionData)
        .select()
        .single();

      if (minimalError) {
        console.error('❌ Error creating minimal session:', minimalError);
        return;
      }

      console.log('✅ Minimal test session created successfully!');
      console.log('Session ID:', minimalSession.id);
      console.log('Date:', sessionDate);
      console.log('Time:', sessionTime);
      console.log('Therapist:', therapist.full_name);
      console.log('User:', user.full_name);
    } else {
      console.log('✅ Test session created successfully!');
      console.log('Session ID:', session.id);
      console.log('Date:', sessionDate);
      console.log('Time:', sessionTime);
      console.log('Therapist:', therapist.full_name);
      console.log('User:', user.full_name);
    }

    console.log('');
    console.log('🔗 User can now see this session at: /dashboard/sessions');
    console.log('🔗 Session details at: /dashboard/sessions/' + (session?.id || 'session-id'));
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
