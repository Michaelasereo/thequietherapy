import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get user ID from cookies
    const cookieHeader = request.headers.get('cookie')
    if (!cookieHeader) {
      return NextResponse.json({ success: false, error: 'No cookies found' }, { status: 401 })
    }

    // Parse cookies to find user ID
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=')
      acc[key] = value
      return acc
    }, {} as Record<string, string>)

    // Find individual user cookie
    const individualUserCookie = cookies['trpi_individual_user']
    if (!individualUserCookie) {
      return NextResponse.json({ success: false, error: 'No individual user cookie found' }, { status: 401 })
    }

    // Decode the cookie
    const userData = JSON.parse(decodeURIComponent(individualUserCookie))
    const userId = userData.id
    const userEmail = userData.email

    console.log('Syncing user to auth.users:', { userId, userEmail })

    // Check if user already exists in auth.users
    const { data: existingAuthUser, error: checkError } = await supabase.auth.admin.getUserById(userId)

    if (existingAuthUser.user) {
      console.log('User already exists in auth.users')
      return NextResponse.json({ 
        success: true, 
        message: 'User already exists in auth.users',
        user: existingAuthUser.user
      })
    }

    // Create user in auth.users table
    const { data: authUser, error: createError } = await supabase.auth.admin.createUser({
      email: userEmail,
      user_metadata: {
        full_name: userData.name,
        user_type: 'individual'
      },
      email_confirm: true,
      user_id: userId // Use the same ID as your custom auth
    })

    if (createError) {
      console.error('Error creating user in auth.users:', createError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to create user in auth.users',
        details: createError.message 
      }, { status: 500 })
    }

    console.log('Successfully created user in auth.users:', authUser.user)

    return NextResponse.json({ 
      success: true, 
      message: 'User synced to auth.users successfully',
      user: authUser.user
    })
  } catch (error) {
    console.error('Error in sync-user-to-auth:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
