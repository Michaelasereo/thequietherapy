/**
 * Fix Asereope Therapist Approval
 * 
 * This script ensures asereope@gmail.com is fully approved
 * and can set availability.
 * 
 * Usage:
 *   node fix-asereope-approval.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const THERAPIST_EMAIL = 'asereope@gmail.com';

async function fixApproval() {
  console.log('🔧 Fixing therapist approval for:', THERAPIST_EMAIL);
  console.log('='.repeat(60));
  
  try {
    // Step 1: Check current status
    console.log('\n📊 Step 1: Checking current status...');
    
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name, is_verified, is_active, user_type')
      .eq('email', THERAPIST_EMAIL)
      .single();
    
    if (userError || !user) {
      console.error('❌ User not found:', userError);
      throw new Error('Therapist not found in users table');
    }
    
    console.log('✅ User found:', {
      id: user.id,
      email: user.email,
      is_verified: user.is_verified,
      is_active: user.is_active,
      user_type: user.user_type
    });
    
    // Step 2: Update user to approved
    console.log('\n📝 Step 2: Updating user to approved...');
    
    const { error: updateUserError } = await supabase
      .from('users')
      .update({
        is_verified: true,
        is_active: true,
        user_type: 'therapist',
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);
    
    if (updateUserError) {
      console.error('❌ Failed to update user:', updateUserError);
      throw new Error(`Failed to update user: ${updateUserError.message}`);
    }
    
    console.log('✅ User updated to approved');
    
    // Step 3: Check and update enrollment
    console.log('\n📝 Step 3: Checking enrollment...');
    
    const { data: enrollments, error: enrollmentError } = await supabase
      .from('therapist_enrollments')
      .select('id, email, status, is_active, user_id')
      .eq('email', THERAPIST_EMAIL)
      .order('created_at', { ascending: false });
    
    if (enrollmentError) {
      console.error('❌ Error checking enrollments:', enrollmentError);
      throw new Error(`Failed to check enrollments: ${enrollmentError.message}`);
    }
    
    if (!enrollments || enrollments.length === 0) {
      console.error('❌ No enrollments found');
      throw new Error('No enrollments found for therapist');
    }
    
    console.log(`✅ Found ${enrollments.length} enrollment(s)`);
    
    // Update all enrollments
    const { error: updateEnrollmentError } = await supabase
      .from('therapist_enrollments')
      .update({
        status: 'approved',
        is_active: true,
        user_id: user.id,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('email', THERAPIST_EMAIL);
    
    if (updateEnrollmentError) {
      console.error('❌ Failed to update enrollments:', updateEnrollmentError);
      throw new Error(`Failed to update enrollments: ${updateEnrollmentError.message}`);
    }
    
    console.log('✅ Enrollments updated to approved');
    
    // Step 4: Check and create/update therapist_profiles
    console.log('\n📝 Step 4: Checking therapist profile...');
    
    const { data: profile, error: profileError } = await supabase
      .from('therapist_profiles')
      .select('id, user_id, verification_status, is_verified, licensed_qualification')
      .eq('user_id', user.id)
      .single();
    
    if (profileError && profileError.code !== 'PGRST116') {
      console.error('❌ Error checking profile:', profileError);
      throw new Error(`Failed to check profile: ${profileError.message}`);
    }
    
    // Get licensed_qualification from enrollment
    const enrollment = enrollments[0];
    const licensedQualification = enrollment.licensed_qualification || enrollment.mdcn_code || 'Not specified';
    
    if (!profile) {
      // Create profile
      console.log('   Creating therapist profile...');
      const { error: createProfileError } = await supabase
        .from('therapist_profiles')
        .insert({
          user_id: user.id,
          licensed_qualification: licensedQualification,
          verification_status: 'approved',
          is_verified: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (createProfileError) {
        console.error('❌ Failed to create profile:', createProfileError);
        throw new Error(`Failed to create profile: ${createProfileError.message}`);
      }
      
      console.log('✅ Created therapist profile');
    } else {
      // Update profile
      console.log('   Updating therapist profile...');
      const { error: updateProfileError } = await supabase
        .from('therapist_profiles')
        .update({
          verification_status: 'approved',
          is_verified: true,
          licensed_qualification: profile.licensed_qualification || licensedQualification,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);
      
      if (updateProfileError) {
        console.error('❌ Failed to update profile:', updateProfileError);
        throw new Error(`Failed to update profile: ${updateProfileError.message}`);
      }
      
      console.log('✅ Updated therapist profile');
    }
    
    // Step 5: Verify final status
    console.log('\n✅ Step 5: Verifying final status...');
    
    const { data: finalUser } = await supabase
      .from('users')
      .select('id, email, is_verified, is_active')
      .eq('id', user.id)
      .single();
    
    const { data: finalEnrollment } = await supabase
      .from('therapist_enrollments')
      .select('id, status, is_active, user_id')
      .eq('email', THERAPIST_EMAIL)
      .eq('status', 'approved')
      .single();
    
    const { data: finalProfile } = await supabase
      .from('therapist_profiles')
      .select('id, verification_status, is_verified')
      .eq('user_id', user.id)
      .single();
    
    console.log('\n📊 Final Status:');
    console.log('   User:', {
      is_verified: finalUser?.is_verified,
      is_active: finalUser?.is_active,
      availability_approved: finalUser?.is_verified && finalUser?.is_active
    });
    console.log('   Enrollment:', {
      status: finalEnrollment?.status,
      is_active: finalEnrollment?.is_active,
      user_id: finalEnrollment?.user_id === user.id ? '✅ Linked' : '❌ Not linked'
    });
    console.log('   Profile:', {
      verification_status: finalProfile?.verification_status,
      is_verified: finalProfile?.is_verified
    });
    
    // Calculate availability_approved
    const availabilityApproved = finalUser?.is_verified && finalUser?.is_active;
    
    console.log('\n' + '='.repeat(60));
    if (availabilityApproved && finalEnrollment?.status === 'approved' && finalProfile?.is_verified) {
      console.log('✅ SUCCESS: Therapist fully approved!');
      console.log('\n📝 Next steps:');
      console.log('   1. Therapist should log out and log back in');
      console.log('   2. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)');
      console.log('   3. Therapist can now set availability');
      console.log('   4. Check availability page: /therapist/dashboard/availability');
    } else {
      console.log('⚠️  WARNING: Some checks failed. Review the status above.');
    }
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run fix
fixApproval().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});

