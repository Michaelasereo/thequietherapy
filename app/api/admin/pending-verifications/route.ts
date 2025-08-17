import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString()
}

export async function GET() {
  try {
    const { data: applications, error } = await supabase
      .from('therapist_enrollments')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) throw error

    const formattedApplications = applications?.map(app => ({
      id: app.id,
      full_name: app.full_name,
      email: app.email,
      phone: app.phone || '',
      mdcn_code: app.mdcn_code || '',
      specialization: app.specialization || [],
      languages: app.languages || [],
      status: app.status,
      created_at: app.created_at,
      submitted_at: app.created_at
    })) || []

    return NextResponse.json(formattedApplications)
  } catch (error) {
    console.error('Error fetching pending verifications:', error)
    return NextResponse.json([], { status: 500 })
  }
}
