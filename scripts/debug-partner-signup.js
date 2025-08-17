require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugPartnerSignup() {
  console.log('🔍 Debugging Partner Signup Process...\n');

  try {
    // 1. Check what columns exist in users table
    console.log('1. Checking users table structure...');
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'users')
      .eq('table_schema', 'public')
      .order('column_name');

    if (columnsError) {
      console.error('❌ Error checking table structure:', columnsError);
    } else {
      console.log('✅ Users table columns:');
      columns.forEach(col => {
        console.log(`   ${col.column_name}: ${col.data_type}`);
      });
    }

    // 2. Test creating a basic user first
    console.log('\n2. Testing basic user creation...');
    const testEmail = `test-partner-${Date.now()}@example.com`;
    
    const basicUserData = {
      email: testEmail,
      full_name: 'Test Partner Debug',
      user_type: 'partner',
      is_verified: false,
      is_active: true,
      credits: 0,
      package_type: 'Partner'
    };

    console.log('📤 Basic user data:', basicUserData);

    const { data: basicUser, error: basicUserError } = await supabase
      .from('users')
      .insert(basicUserData)
      .select()
      .single();

    if (basicUserError) {
      console.error('❌ Error creating basic user:', basicUserError);
      console.error('❌ Error details:', {
        message: basicUserError.message,
        details: basicUserError.details,
        hint: basicUserError.hint,
        code: basicUserError.code
      });
      return;
    }

    console.log('✅ Basic user created successfully:', basicUser.id);

    // 3. Test updating with partner data
    console.log('\n3. Testing partner data update...');
    
    const updateData = {
      company_name: 'Test Company Debug',
      organization_type: 'Corporate HR',
      contact_person: 'Test Contact',
      address: '',
      notify_purchases: true,
      notify_usage: true,
      partner_credits: 0,
      partner_status: 'temporary',
      temporary_approval: true,
      approval_date: new Date().toISOString()
    };

    console.log('📤 Update data:', updateData);

    const { data: updateResult, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', basicUser.id)
      .select();

    if (updateError) {
      console.error('❌ Error updating partner data:', updateError);
      console.error('❌ Update error details:', {
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
        code: updateError.code
      });
    } else {
      console.log('✅ Partner data updated successfully');
      console.log('📋 Updated user data:', updateResult);
    }

    // 4. Clean up test user
    console.log('\n4. Cleaning up test user...');
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', basicUser.id);

    if (deleteError) {
      console.warn('⚠️ Could not delete test user:', deleteError.message);
    } else {
      console.log('✅ Test user cleaned up');
    }

    // 5. Test the actual partner onboarding API
    console.log('\n5. Testing partner onboarding API...');
    try {
      const onboardingResponse = await fetch('http://localhost:3001/api/partner/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationName: 'Test Company API',
          contactName: 'Test Contact API',
          email: `test-api-${Date.now()}@example.com`,
          employeeCount: '11-50',
          industry: 'Corporate HR',
          termsAccepted: true
        })
      });

      const onboardingData = await onboardingResponse.json();
      console.log('   Response status:', onboardingResponse.status);
      console.log('   Response:', onboardingData);

      if (onboardingResponse.ok && onboardingData.success) {
        console.log('✅ Partner onboarding API working');
      } else {
        console.log('❌ Partner onboarding API failed:', onboardingData.error);
      }
    } catch (error) {
      console.log('⚠️ Could not test partner onboarding API:', error.message);
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

// Run the debug
debugPartnerSignup();
