require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixPartnerStatusConstraint() {
  console.log('🔧 Fixing Partner Status Constraint...\n');

  try {
    // 1. Drop the existing constraint
    console.log('1. Dropping existing constraint...');
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE users DROP CONSTRAINT IF EXISTS users_partner_status_check;'
    });

    if (dropError) {
      console.log('ℹ️ No existing constraint to drop or error:', dropError.message);
    } else {
      console.log('✅ Existing constraint dropped');
    }

    // 2. Add the new constraint with 'temporary' included
    console.log('\n2. Adding new constraint with temporary status...');
    const { error: addError } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE users ADD CONSTRAINT users_partner_status_check 
            CHECK (partner_status IN ('active', 'suspended', 'pending', 'temporary'));`
    });

    if (addError) {
      console.error('❌ Error adding constraint:', addError);
      return;
    }

    console.log('✅ New constraint added successfully');

    // 3. Test the constraint by updating a partner to temporary status
    console.log('\n3. Testing constraint with temporary status...');
    const { data: testPartner, error: testError } = await supabase
      .from('users')
      .select('id, email, partner_status')
      .eq('email', 'testpartner@example.com')
      .eq('user_type', 'partner')
      .single();

    if (testError) {
      console.error('❌ Error finding test partner:', testError);
      return;
    }

    if (testPartner) {
      const { error: updateError } = await supabase
        .from('users')
        .update({
          partner_status: 'temporary',
          temporary_approval: true,
          approval_date: new Date().toISOString()
        })
        .eq('id', testPartner.id);

      if (updateError) {
        console.error('❌ Error updating to temporary status:', updateError);
      } else {
        console.log('✅ Successfully updated partner to temporary status');
      }
    }

    // 4. Show current partner statuses
    console.log('\n4. Current partner statuses:');
    const { data: partnerStatuses, error: statusError } = await supabase
      .from('users')
      .select('partner_status')
      .eq('user_type', 'partner');

    if (statusError) {
      console.error('❌ Error fetching partner statuses:', statusError);
    } else {
      const statusCounts = partnerStatuses.reduce((acc, user) => {
        acc[user.partner_status] = (acc[user.partner_status] || 0) + 1;
        return acc;
      }, {});

      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`   ${status}: ${count}`);
      });
    }

    console.log('\n🎉 Partner status constraint fix completed!');

  } catch (error) {
    console.error('❌ Fix failed:', error);
  }
}

// Run the fix
fixPartnerStatusConstraint();
