import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // Fetch all users with their details
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    // Transform the data to match the expected interface
    const transformedUsers = users?.map(user => ({
      id: user.id,
      full_name: user.full_name || 'Unknown User',
      email: user.email,
      user_type: user.user_type || 'individual',
      is_active: user.is_active || false,
      is_verified: user.is_verified || false,
      status: user.is_active ? 'active' : 'inactive',
      created_at: user.created_at,
      last_activity: user.last_login_at || user.updated_at,
      phone: user.phone || null
    })) || []

    return NextResponse.json(transformedUsers)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json([], { status: 500 })
  }
}
