import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { email, full_name } = await request.json()

    if (!email || !full_name) {
      return NextResponse.json(
        { error: 'Email and full name are required' },
        { status: 400 }
      )
    }

    console.log('🧪 Creating test user:', { email, full_name })

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (existingUser) {
      console.log('✅ Test user already exists:', existingUser.id)
      return NextResponse.json({
        success: true,
        user: existingUser,
        existed: true
      })
    }

    // Create new test user
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        email,
        full_name,
        user_type: 'individual',
        is_active: true,
        is_verified: true,
        credits: 5, // Give test user some credits
        package_type: 'basic',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (createError) {
      console.error('❌ Error creating test user:', createError)
      return NextResponse.json(
        { error: 'Failed to create test user' },
        { status: 500 }
      )
    }

    console.log('✅ Test user created successfully:', newUser.id)

    // Create patient biodata for test user
    await supabase
      .from('patient_biodata')
      .insert({
        user_id: newUser.id,
        age: 30,
        gender: 'Male',
        marital_status: 'Single',
        occupation: 'Test Patient',
        therapy_goals: ['Testing video session'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    return NextResponse.json({
      success: true,
      user: newUser,
      existed: false
    })

  } catch (error) {
    console.error('❌ Error in create-test-user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

