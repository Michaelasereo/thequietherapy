import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    console.log('🧹 Clearing test users and setting up fresh users...')

    // Clear therapist enrollments
    const { error: deleteEnrollmentsError } = await supabase
      .from('therapist_enrollments')
      .delete()
      .in('email', [
        'test@example.com',
        'therapist@test.com', 
        'michaelasereo@gmail.com',
        'asereope@gmail.com',
        'asereopeyemimichael@gmail.com'
      ])

    if (deleteEnrollmentsError) {
      console.error('Error deleting enrollments:', deleteEnrollmentsError)
    }

    // Clear users
    const { error: deleteUsersError } = await supabase
      .from('users')
      .delete()
      .in('email', [
        'test@example.com',
        'therapist@test.com',
        'user@test.com',
        'admin@test.com',
        'michaelasereo@gmail.com',
        'asereope@gmail.com', 
        'asereopeyemimichael@gmail.com'
      ])

    if (deleteUsersError) {
      console.error('Error deleting users:', deleteUsersError)
    }

    // Create fresh users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .upsert([
        {
          email: 'asereopeyemimichael@gmail.com',
          full_name: 'Admin User',
          user_type: 'admin',
          is_verified: true
        },
        {
          email: 'michaelasereo@gmail.com',
          full_name: 'Dr. Sarah Johnson',
          user_type: 'therapist',
          is_verified: true
        },
        {
          email: 'asereope@gmail.com',
          full_name: 'John Doe',
          user_type: 'individual',
          is_verified: true
        }
      ])
      .select()

    if (usersError) {
      console.error('Error creating users:', usersError)
      return NextResponse.json({ success: false, error: 'Failed to create users' }, { status: 500 })
    }

    // Create therapist enrollment
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('therapist_enrollments')
      .upsert({
        full_name: 'Dr. Sarah Johnson',
        email: 'michaelasereo@gmail.com',
        phone: '+234 801 234 5678',
        mdcn_code: 'MDCN12345',
        specialization: ['Cognitive Behavioral Therapy (CBT)', 'Anxiety & Stress Management'],
        languages: ['English', 'Yoruba'],
        status: 'pending'
      })
      .select()

    if (enrollmentError) {
      console.error('Error creating enrollment:', enrollmentError)
      return NextResponse.json({ success: false, error: 'Failed to create enrollment' }, { status: 500 })
    }

    console.log('✅ Fresh users created successfully')
    console.log('Users:', users?.length)
    console.log('Enrollment:', enrollment?.length)

    return NextResponse.json({ 
      success: true, 
      message: 'Test users cleared and fresh users created',
      users: users?.length || 0,
      enrollment: enrollment?.length || 0
    })

  } catch (error) {
    console.error('Error in clear-and-setup-users:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

