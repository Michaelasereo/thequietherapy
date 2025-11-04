require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(color + message + colors.reset);
}

function success(message) {
  log('✅ ' + message, colors.green);
}

function error(message) {
  log('❌ ' + message, colors.red);
}

function warning(message) {
  log('⚠️  ' + message, colors.yellow);
}

function info(message) {
  log('ℹ️  ' + message, colors.blue);
}

function section(title) {
  console.log('\n' + colors.cyan + '='.repeat(60));
  log(title, colors.cyan);
  log('='.repeat(60), colors.cyan);
}

async function validateEnrollmentReadiness() {
  section('Therapist Enrollment Readiness Check');
  
  let allChecksPassed = true;

  // Check 1: Database connection
  section('1. Database Connection');
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error) throw error;
    success('Database connection successful');
  } catch (err) {
    error('Database connection failed: ' + err.message);
    return false;
  }

  // Check 2: Test actual enrollment data structure
  section('2. Enrollment Data Structure Test (CRITICAL)');
  try {
    const mockEnrollmentData = {
      full_name: 'Dr. Test Therapist',
      email: 'test-enrollment-' + Date.now() + '@validation.test',
      phone: '+2348012345678',
      licensed_qualification: 'MDCN12345',
      specializations: ['Anxiety Management', 'Stress Therapy'],
      languages_array: ['English', 'Yoruba'],
      gender: 'Male',
      age: 35,
      marital_status: 'Married',
      bio: 'This is a test bio for validation purposes. It should be at least 50 characters long to pass validation.',
      profile_image_url: '/placeholder.svg',
      status: 'pending',
      is_active: true,
      is_verified: false
    };

    info('Attempting to insert test enrollment with user_id = NULL...');
    const { data: testEnrollment, error: testError } = await supabase
      .from('therapist_enrollments')
      .insert(mockEnrollmentData)
      .select()
      .single();

    if (testError) {
      if (testError.code === '23505' && testError.constraint === 'therapist_enrollments_user_id_key') {
        error('❌ UNIQUE constraint on user_id still exists! Enrollment will FAIL.');
        error('ACTION REQUIRED: Run fix-enrollment-constraint.sql in Supabase SQL Editor');
        allChecksPassed = false;
      } else if (testError.code === '23505' && testError.constraint === 'therapist_enrollments_email_key') {
        error('Duplicate email (unexpected, but email constraint works)');
      } else if (testError.message.includes('column') && testError.message.includes('does not exist')) {
        error('Missing database column: ' + testError.message);
        error('ACTION REQUIRED: Run ensure-enrollment-table-complete.sql in Supabase');
        allChecksPassed = false;
      } else {
        error('Enrollment test insert failed: ' + testError.message);
        error('Error code: ' + testError.code);
        if (testError.details) error('Details: ' + testError.details);
        if (testError.hint) error('Hint: ' + testError.hint);
        allChecksPassed = false;
      }
    } else {
      success('✅ Enrollment data structure is valid!');
      info('Inserted test enrollment ID: ' + testEnrollment.id);
      info('user_id is NULL: ' + (testEnrollment.user_id === null ? 'YES ✅ (correct)' : 'NO ❌ (should be NULL)'));
      
      // Test: Try to insert second enrollment with NULL user_id (should work if constraint is removed)
      info('Testing if multiple NULL user_id values are allowed...');
      const mockEnrollmentData2 = {
        ...mockEnrollmentData,
        email: 'test-enrollment-' + Date.now() + '2@validation.test'
      };

      const { data: testEnrollment2, error: testError2 } = await supabase
        .from('therapist_enrollments')
        .insert(mockEnrollmentData2)
        .select()
        .single();

      if (testError2 && testError2.code === '23505' && testError2.constraint === 'therapist_enrollments_user_id_key') {
        error('❌ UNIQUE constraint on user_id prevents multiple NULL values!');
        error('ACTION REQUIRED: Run fix-enrollment-constraint.sql in Supabase SQL Editor');
        allChecksPassed = false;
      } else if (testError2) {
        warning('Second insert failed (may be expected): ' + testError2.message);
      } else {
        success('✅ Multiple enrollments with NULL user_id allowed!');
        // Cleanup second test
        if (testEnrollment2) {
          await supabase.from('therapist_enrollments').delete().eq('id', testEnrollment2.id);
        }
      }
      
      // Cleanup first test
      await supabase.from('therapist_enrollments').delete().eq('id', testEnrollment.id);
      info('Cleaned up test enrollment');
    }
  } catch (err) {
    error('Enrollment structure test failed: ' + err.message);
    allChecksPassed = false;
  }

  // Check 3: Verify email UNIQUE constraint exists (good)
  section('3. Email Uniqueness Validation');
  try {
    const testEmail = 'test-duplicate-' + Date.now() + '@test.com';
    const { data: firstInsert } = await supabase
      .from('therapist_enrollments')
      .insert({
        full_name: 'Test Duplicate 1',
        email: testEmail,
        phone: '+2348012345678',
        status: 'pending',
        bio: 'Test bio for duplicate check',
        specializations: ['Test'],
        languages_array: ['English']
      })
      .select()
      .single();

    if (firstInsert) {
      const { error: duplicateError } = await supabase
        .from('therapist_enrollments')
        .insert({
          full_name: 'Test Duplicate 2',
          email: testEmail,
          phone: '+2348012345679',
          status: 'pending',
          bio: 'Test bio',
          specializations: ['Test'],
          languages_array: ['English']
        });

      if (duplicateError && duplicateError.code === '23505') {
        success('Email UNIQUE constraint works correctly (prevents duplicates)');
      } else {
        warning('Email UNIQUE constraint may be missing');
      }

      // Cleanup
      await supabase.from('therapist_enrollments').delete().eq('id', firstInsert.id);
    }
  } catch (err) {
    warning('Could not verify email constraint: ' + err.message);
  }

  // Check 4: Verify auto-linking code exists
  section('4. Auto-Linking Code Check');
  try {
    const fs = require('fs');
    const authCode = fs.readFileSync('lib/auth.ts', 'utf8');
    
    if ((authCode.includes('Link therapist enrollment to user account') ||
         authCode.includes('Linking therapist enrollment to user account')) &&
        authCode.includes('therapist_enrollments') &&
        authCode.includes('user_id') &&
        authCode.includes('.update(') &&
        authCode.includes('authType === \'therapist\'')) {
      success('Auto-linking code is present in lib/auth.ts ✅');
      info('Therapist enrollments will be linked to user accounts after signup');
    } else {
      warning('Auto-linking code may be missing - check lib/auth.ts');
    }
  } catch (err) {
    warning('Could not verify auto-linking code: ' + err.message);
  }

  // Final summary
  section('Validation Summary');
  if (allChecksPassed) {
    success('All critical checks passed! Enrollment should work correctly.');
    info('You can safely deploy to production.');
    console.log('\n');
    info('Next steps:');
    info('1. Deploy your code changes');
    info('2. Test enrollment with a real therapist email');
  } else {
    error('Some checks failed. Please fix the issues above before deploying.');
    console.log('\n');
    warning('Critical actions needed:');
    warning('1. Run fix-enrollment-constraint.sql in Supabase SQL Editor');
    warning('2. Verify all required columns exist (run ensure-enrollment-table-complete.sql if needed)');
    warning('3. Run this validation script again: node scripts/validate-enrollment-readiness.js');
  }

  return allChecksPassed;
}

// Run validation
validateEnrollmentReadiness()
  .then((passed) => {
    process.exit(passed ? 0 : 1);
  })
  .catch((error) => {
    console.error('\n❌ Validation script error:', error);
    process.exit(1);
  });
