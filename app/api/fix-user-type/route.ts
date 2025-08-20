import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, newUserType } = body

    console.log('🔧 Fixing user type for:', { email, newUserType })

    if (!email || !newUserType) {
      return NextResponse.json(
        { success: false, error: 'Email and newUserType are required' },
        { status: 400 }
      )
    }

    if (!['individual', 'therapist', 'partner', 'admin'].includes(newUserType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user type' },
        { status: 400 }
      )
    }

    // First, check current user data
    const { data: currentUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (fetchError) {
      console.error('❌ Error fetching user:', fetchError)
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    console.log('🔍 Current user data:', {
      id: currentUser.id,
      email: currentUser.email,
      current_user_type: currentUser.user_type,
      new_user_type: newUserType
    })

    // Update the user type
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ user_type: newUserType })
      .eq('email', email)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Error updating user:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to update user type' },
        { status: 500 }
      )
    }

    console.log('✅ User type updated successfully:', {
      id: updatedUser.id,
      email: updatedUser.email,
      user_type: updatedUser.user_type
    })

    return NextResponse.json({
      success: true,
      message: `User type updated from ${currentUser.user_type} to ${newUserType}`,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        user_type: updatedUser.user_type
      }
    })

  } catch (error) {
    console.error('❌ Fix user type error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email parameter is required' },
        { status: 400 }
      )
    }

    console.log('🔍 Checking user type for:', email)

    // Get user data
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, full_name, user_type, is_verified, is_active')
      .eq('email', email)
      .single()

    if (error) {
      console.error('❌ Error fetching user:', error)
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    console.log('✅ User found:', {
      id: user.id,
      email: user.email,
      user_type: user.user_type
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        user_type: user.user_type,
        is_verified: user.is_verified,
        is_active: user.is_active
      }
    })

  } catch (error) {
    console.error('❌ Check user type error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
