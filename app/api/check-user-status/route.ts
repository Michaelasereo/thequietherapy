import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Check user in users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    // Check therapist enrollment
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('therapist_enrollments')
      .select('*')
      .eq('email', email)
      .single()

    return NextResponse.json({
      user: user || null,
      enrollment: enrollment || null,
      userError: userError?.message || null,
      enrollmentError: enrollmentError?.message || null
    })

  } catch (error) {
    console.error('Error checking user status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
