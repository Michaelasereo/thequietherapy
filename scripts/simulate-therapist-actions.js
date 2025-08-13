const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function simulateTherapistActions(sessionId, therapistId, userId) {
  try {
    console.log('🎭 Simulating therapist actions for session:', sessionId);

    // 1. Add session note
    const sessionNote = {
      session_id: sessionId,
      therapist_id: therapistId,
      content: `Session Summary - ${new Date().toLocaleDateString()}

Patient presented with symptoms of anxiety and stress related to work pressure. 
Discussed coping mechanisms and relaxation techniques.

Key Points:
- Patient reports increased stress at work
- Difficulty sleeping due to racing thoughts
- Some improvement with breathing exercises
- Agreed to practice mindfulness daily

Homework Assigned:
- Practice deep breathing exercises 10 minutes daily
- Keep a stress journal
- Schedule follow-up session in 2 weeks

Overall Assessment: Patient is engaged and motivated for treatment.`
    };

    const { error: noteError } = await supabase
      .from('session_notes')
      .insert(sessionNote);

    if (noteError) {
      console.error('❌ Error adding session note:', noteError);
    } else {
      console.log('✅ Session note added');
    }

    // 2. Add medical diagnosis
    const medicalHistory = {
      user_id: userId,
      therapist_id: therapistId,
      condition: 'Generalized Anxiety Disorder (GAD)',
      diagnosis_date: new Date().toISOString().split('T')[0],
      notes: 'Initial diagnosis based on patient presentation. Symptoms include excessive worry, difficulty concentrating, and sleep disturbances.'
    };

    const { error: medicalError } = await supabase
      .from('patient_medical_history')
      .insert(medicalHistory);

    if (medicalError) {
      console.error('❌ Error adding medical history:', medicalError);
    } else {
      console.log('✅ Medical diagnosis added');
    }

    // 3. Add drug history (if applicable)
    const drugHistory = {
      user_id: userId,
      therapist_id: therapistId,
      medication_name: 'Sertraline (Zoloft)',
      dosage: '25mg daily',
      start_date: new Date().toISOString().split('T')[0],
      prescribing_doctor: 'Dr. Sarah Johnson',
      duration_of_usage: 'Starting today',
      notes: 'Prescribed for GAD symptoms. Patient to start with 25mg and increase to 50mg after 1 week if tolerated well.'
    };

    const { error: drugError } = await supabase
      .from('patient_drug_history')
      .insert(drugHistory);

    if (drugError) {
      console.error('❌ Error adding drug history:', drugError);
    } else {
      console.log('✅ Drug history added');
    }

    console.log('🎉 Therapist actions simulation complete!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Function to get therapist ID by email
async function getTherapistId(email) {
  try {
    const { data, error } = await supabase
      .from('global_users')
      .select('id')
      .eq('email', email)
      .eq('role', 'therapist')
      .single();

    if (error) {
      throw error;
    }

    return data.id;
  } catch (error) {
    console.error('Error getting therapist ID:', error);
    return null;
  }
}

// Function to get user ID by email
async function getUserId(email) {
  try {
    const { data, error } = await supabase
      .from('global_users')
      .select('id')
      .eq('email', email)
      .eq('role', 'user')
      .single();

    if (error) {
      throw error;
    }

    return data.id;
  } catch (error) {
    console.error('Error getting user ID:', error);
    return null;
  }
}

// Export functions for use in other scripts
module.exports = {
  simulateTherapistActions,
  getTherapistId,
  getUserId
};

// Example usage
if (require.main === module) {
  // This will run if the script is executed directly
  const sessionId = process.argv[2];
  const therapistEmail = process.argv[3] || 'test.therapist@trpi.com';
  const userEmail = process.argv[4] || 'test.user@trpi.com';

  if (!sessionId) {
    console.log('Usage: node simulate-therapist-actions.js <sessionId> [therapistEmail] [userEmail]');
    process.exit(1);
  }

  (async () => {
    const therapistId = await getTherapistId(therapistEmail);
    const userId = await getUserId(userEmail);

    if (therapistId && userId) {
      await simulateTherapistActions(sessionId, therapistId, userId);
    } else {
      console.error('❌ Could not find therapist or user');
    }
  })();
}
