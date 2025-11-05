/**
 * Approve Therapist: asereope@gmail.com
 * 
 * This script approves the therapist and ensures all required fields
 * are set correctly for availability setup.
 * 
 * Usage:
 *   node approve-therapist-asereope.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('   Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const THERAPIST_EMAIL = 'asereope@gmail.com';

async function approveTherapist() {
  console.log('🔍 Starting therapist approval process for:', THERAPIST_EMAIL);
  console.log('='.repeat(60));
  
  try {
    // Step 1: Check current status
    console.log('\n📊 Step 1: Checking current status...');
    
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name, is_verified, is_active, user_type')
      .eq('email', THERAPIST_EMAIL)
      .eq('user_type', 'therapist')
      .single();
    
    if (userError && userError.code !== 'PGRST116') {
      console.error('❌ Error checking user:', userError);
      throw new Error(`Failed to check user: ${userError.message}`);
    }
    
    if (!user) {
      console.log('⚠️  User not found, will create during approval');
    } else {
      console.log('✅ User found:', {
        id: user.id,
        email: user.email,
        is_verified: user.is_verified,
        is_active: user.is_active
      });
    }
    
    // Check enrollments
    const { data: enrollments, error: enrollmentError } = await supabase
      .from('therapist_enrollments')
      .select('id, email, status, is_active, user_id, approved_at')
      .eq('email', THERAPIST_EMAIL)
      .order('created_at', { ascending: false });
    
    if (enrollmentError) {
      console.error('❌ Error checking enrollments:', enrollmentError);
      throw new Error(`Failed to check enrollments: ${enrollmentError.message}`);
    }
    
    if (!enrollments || enrollments.length === 0) {
      console.error('❌ No enrollments found for:', THERAPIST_EMAIL);
      throw new Error('Therapist enrollment not found. Please ensure the therapist has completed enrollment.');
    }
    
    console.log(`✅ Found ${enrollments.length} enrollment(s)`);
    enrollments.forEach((enrollment, index) => {
      console.log(`   Enrollment ${index + 1}:`, {
        id: enrollment.id,
        status: enrollment.status,
        is_active: enrollment.is_active,
        user_id: enrollment.user_id || 'NOT LINKED',
        approved_at: enrollment.approved_at || 'NOT APPROVED'
      });
    });
    
    // Step 2: Get or create user ID
    console.log('\n📝 Step 2: Ensuring user account exists...');
    
    let userId = user?.id;
    const enrollmentData = enrollments[0]; // Use most recent enrollment
    
    if (!userId) {
      console.log('   Creating new user account...');
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          email: THERAPIST_EMAIL,
          full_name: enrollmentData.full_name || 'Therapist',
          user_type: 'therapist',
          is_verified: true,
          is_active: true,
          credits: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single();
      
      if (createError) {
        console.error('❌ Failed to create user:', createError);
        throw new Error(`Failed to create user: ${createError.message}`);
      }
      
      userId = newUser.id;
      console.log('✅ Created user account with ID:', userId);
    } else {
      // Update existing user
      console.log('   Updating existing user account...');
      const { error: updateError } = await supabase
        .from('users')
        .update({
          is_verified: true,
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (updateError) {
        console.error('❌ Failed to update user:', updateError);
        throw new Error(`Failed to update user: ${updateError.message}`);
      }
      
      console.log('✅ Updated user account');
    }
    
    // Step 3: Update all enrollments
    console.log('\n📝 Step 3: Updating enrollments...');
    
    const { error: enrollmentUpdateError } = await supabase
      .from('therapist_enrollments')
      .update({
        status: 'approved',
        is_active: true,
        user_id: userId,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('email', THERAPIST_EMAIL);
    
    if (enrollmentUpdateError) {
      console.error('❌ Failed to update enrollments:', enrollmentUpdateError);
      throw new Error(`Failed to update enrollments: ${enrollmentUpdateError.message}`);
    }
    
    console.log('✅ Updated all enrollments');
    
    // Step 4: Clean up duplicate enrollments (keep only most recent)
    if (enrollments.length > 1) {
      console.log('\n🧹 Step 4: Cleaning up duplicate enrollments...');
      
      const enrollmentsToDelete = enrollments.slice(1); // Keep first, delete rest
      
      for (const enrollment of enrollmentsToDelete) {
        const { error: deleteError } = await supabase
          .from('therapist_enrollments')
          .delete()
          .eq('id', enrollment.id);
        
        if (deleteError) {
          console.warn(`⚠️  Failed to delete duplicate enrollment ${enrollment.id}:`, deleteError);
        } else {
          console.log(`✅ Deleted duplicate enrollment ${enrollment.id}`);
        }
      }
    }
    
    // Step 5: Create/update therapist_profiles
    console.log('\n📝 Step 5: Ensuring therapist_profiles exists...');
    
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('therapist_profiles')
      .select('id, user_id, verification_status, is_verified')
      .eq('user_id', userId)
      .single();
    
    if (profileCheckError && profileCheckError.code !== 'PGRST116') {
      console.error('❌ Error checking profile:', profileCheckError);
      throw new Error(`Failed to check profile: ${profileCheckError.message}`);
    }
    
    if (!existingProfile) {
      console.log('   Creating therapist profile...');
      
      // Get licensed_qualification from enrollment if available
      const { data: enrollmentData } = await supabase
        .from('therapist_enrollments')
        .select('licensed_qualification, mdcn_code')
        .eq('email', THERAPIST_EMAIL)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      const licensedQualification = enrollmentData?.licensed_qualification || enrollmentData?.mdcn_code || 'Not specified';
      
      const { error: createProfileError } = await supabase
        .from('therapist_profiles')
        .insert({
          user_id: userId,
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
      console.log('   Updating therapist profile...');
      const { error: updateProfileError } = await supabase
        .from('therapist_profiles')
        .update({
          verification_status: 'approved',
          is_verified: true,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
      
      if (updateProfileError) {
        console.error('❌ Failed to update profile:', updateProfileError);
        throw new Error(`Failed to update profile: ${updateProfileError.message}`);
      }
      
      console.log('✅ Updated therapist profile');
    }
    
    // Step 6: Verify final status
    console.log('\n✅ Step 6: Verifying final status...');
    
    const { data: finalUser, error: finalUserError } = await supabase
      .from('users')
      .select('id, email, is_verified, is_active')
      .eq('id', userId)
      .single();
    
    const { data: finalEnrollment, error: finalEnrollmentError } = await supabase
      .from('therapist_enrollments')
      .select('id, status, is_active, user_id, approved_at')
      .eq('email', THERAPIST_EMAIL)
      .eq('status', 'approved')
      .single();
    
    const { data: finalProfile, error: finalProfileError } = await supabase
      .from('therapist_profiles')
      .select('id, verification_status, is_verified')
      .eq('user_id', userId)
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
      user_id: finalEnrollment?.user_id || 'NOT LINKED',
      approved_at: finalEnrollment?.approved_at || 'NOT APPROVED'
    });
    console.log('   Profile:', {
      verification_status: finalProfile?.verification_status,
      is_verified: finalProfile?.is_verified
    });
    
    // Calculate availability_approved
    const availabilityApproved = finalUser?.is_verified && finalUser?.is_active;
    
    console.log('\n' + '='.repeat(60));
    if (availabilityApproved && finalEnrollment?.status === 'approved' && finalProfile?.is_verified) {
      console.log('✅ SUCCESS: Therapist approved and ready for availability setup!');
      console.log('   The therapist can now:');
      console.log('   - Log in to the dashboard');
      console.log('   - Access availability settings');
      console.log('   - Set weekly schedule');
      console.log('   - Accept session bookings');
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

// Run approval
approveTherapist().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});

