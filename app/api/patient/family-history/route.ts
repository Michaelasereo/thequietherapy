import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
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

    // Check if user exists in auth.users by email
    const { data: existingAuthUser, error: checkError } = await supabase.auth.admin.listUsers()
    
    let authUserId = userId
    
    if (existingAuthUser.users) {
      const existingUser = existingAuthUser.users.find(user => user.email === userData.email)
      if (existingUser) {
        console.log('User found in auth.users by email:', existingUser.id)
        authUserId = existingUser.id
      }
    }

    // Fetch family history
    const { data, error } = await supabase
      .from('patient_family_history')
      .select('*')
      .eq('user_id', authUserId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error fetching family history:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      data: data || null 
    })
  } catch (error) {
    console.error('Error in family history GET:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

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

    // First, ensure user exists in auth.users table
    console.log('Ensuring user exists in auth.users:', userId)
    
    // Check if user exists in auth.users by email
    const { data: existingAuthUser, error: checkError } = await supabase.auth.admin.listUsers()
    
    let authUserId = userId
    
    if (existingAuthUser.users) {
      const existingUser = existingAuthUser.users.find(user => user.email === userData.email)
      if (existingUser) {
        console.log('User found in auth.users by email:', existingUser.id)
        authUserId = existingUser.id
      } else {
        console.log('User not found in auth.users, creating...')
        // Create user in auth.users table
        const { data: authUser, error: createError } = await supabase.auth.admin.createUser({
          email: userData.email,
          user_metadata: {
            full_name: userData.name,
            user_type: 'individual'
          },
          email_confirm: true
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
        authUserId = authUser.user.id
      }
    } else {
      console.log('User already exists in auth.users')
    }

    // Get the family history from request body
    const familyHistory = await request.json()

    // Upsert family history
    const { data, error } = await supabase
      .from('patient_family_history')
      .upsert({
        user_id: authUserId,
        ...familyHistory
      })
      .select()
      .single()

    if (error) {
      console.error('Error upserting family history:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      data: data 
    })
  } catch (error) {
    console.error('Error in family history POST:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
