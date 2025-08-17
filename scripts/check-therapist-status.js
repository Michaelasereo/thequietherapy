require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTherapistStatus() {
  console.log('🔍 Checking therapist status constraints...\n');

  try {
    // Check existing therapist enrollments to see what statuses are used
    const { data: enrollments, error } = await supabase
      .from('therapist_enrollments')
      .select('status')
      .limit(10);

    if (error) {
      console.error('❌ Error querying enrollments:', error);
      return;
    }

    console.log('Existing status values:');
    const statuses = new Set(enrollments.map(e => e.status));
    statuses.forEach(status => console.log(`  - ${status}`));

    // Try to get the constraint information
    const { data: constraintInfo, error: constraintError } = await supabase
      .rpc('get_table_constraints', { table_name: 'therapist_enrollments' });

    if (constraintError) {
      console.log('Could not get constraint info:', constraintError.message);
    } else {
      console.log('Constraint info:', constraintInfo);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkTherapistStatus();
