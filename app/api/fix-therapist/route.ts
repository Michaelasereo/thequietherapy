import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Fixing therapist user...')
    
    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'michaelasereo@gmail.com')
      .single()

    let userResult = null
    let userAction = ''

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
        return NextResponse.json({ 
          error: 'Failed to create user', 
          details: createError.message 
        }, { status: 500 })
      }
      
      userResult = newUser
      userAction = 'created'
    } else {
      console.log('✅ User found:', user)
      userResult = user
      userAction = 'found'
      
      // Update user type if needed
      if (user.user_type !== 'therapist') {
        console.log('🔄 Updating user type to therapist...')
        
        const { error: updateError } = await supabase
          .from('users')
          .update({ user_type: 'therapist' })
          .eq('email', 'michaelasereo@gmail.com')

        if (updateError) {
          return NextResponse.json({ 
            error: 'Failed to update user', 
            details: updateError.message 
          }, { status: 500 })
        }
        
        userAction = 'updated'
      }
    }

    // Check enrollment
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('therapist_enrollments')
      .select('*')
      .eq('email', 'michaelasereo@gmail.com')
      .single()

    let enrollmentResult = null
    let enrollmentAction = ''

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
        return NextResponse.json({ 
          error: 'Failed to create enrollment', 
          details: createEnrollmentError.message 
        }, { status: 500 })
      }
      
      enrollmentAction = 'created'
    } else {
      console.log('✅ Enrollment found:', enrollment)
      enrollmentResult = enrollment
      enrollmentAction = 'found'
    }

    console.log('🎉 Therapist user setup complete!')

    return NextResponse.json({
      success: true,
      message: 'Therapist user fixed successfully!',
      user: {
        action: userAction,
        data: userResult
      },
      enrollment: {
        action: enrollmentAction,
        data: enrollmentResult
      },
      nextStep: 'Try logging in with michaelasereo@gmail.com'
    })

  } catch (error) {
    console.error('❌ Error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
