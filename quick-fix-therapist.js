// Quick Fix Therapist User
// Run this with: node quick-fix-therapist.js

const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function fixTherapistUser() {
  try {
    console.log('🔍 Checking therapist user...')
    
    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'michaelasereo@gmail.com')
      .single()

    if (userError) {
      console.log('❌ User not found, creating...')
      
      // Create user
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          email: 'michaelasereo@gmail.com',
          full_name: 'Dr. Sarah Johnson',
          user_type: 'therapist',
          is_verified: false,
          credits: 0,
          package_type: 'Therapist'
        })
        .select()
        .single()

      if (createError) {
        console.error('❌ Error creating user:', createError)
        return
      }
      
      console.log('✅ User created:', newUser)
    } else {
      console.log('✅ User found:', user)
      
      // Update user type if needed
      if (user.user_type !== 'therapist') {
        console.log('🔄 Updating user type to therapist...')
        
        const { error: updateError } = await supabase
          .from('users')
          .update({ user_type: 'therapist' })
          .eq('email', 'michaelasereo@gmail.com')

        if (updateError) {
          console.error('❌ Error updating user:', updateError)
          return
        }
        
        console.log('✅ User type updated to therapist')
      }
    }

    // Check enrollment
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('therapist_enrollments')
      .select('*')
      .eq('email', 'michaelasereo@gmail.com')
      .single()

    if (enrollmentError) {
      console.log('❌ Enrollment not found, creating...')
      
      const { error: createEnrollmentError } = await supabase
        .from('therapist_enrollments')
        .insert({
          full_name: 'Dr. Sarah Johnson',
          email: 'michaelasereo@gmail.com',
          phone: '+234 801 234 5678',
          mdcn_code: 'MDCN12345',
          specialization: ['Cognitive Behavioral Therapy (CBT)', 'Anxiety & Stress Management'],
          languages: ['English', 'Yoruba'],
          status: 'pending'
        })

      if (createEnrollmentError) {
        console.error('❌ Error creating enrollment:', createEnrollmentError)
        return
      }
      
      console.log('✅ Enrollment created')
    } else {
      console.log('✅ Enrollment found:', enrollment)
    }

    console.log('🎉 Therapist user setup complete!')
    console.log('📧 Try logging in with: michaelasereo@gmail.com')

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

fixTherapistUser()
