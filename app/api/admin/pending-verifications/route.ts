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
    // Fetch pending therapist enrollments
    const { data: therapistApplications, error: therapistError } = await supabase
      .from('therapist_enrollments')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (therapistError) throw therapistError

    // Fetch pending partner users (users with user_type = 'partner' and is_verified = false)
    const { data: partnerApplications, error: partnerError } = await supabase
      .from('users')
      .select('*')
      .eq('user_type', 'partner')
      .eq('is_verified', false)
      .order('created_at', { ascending: false })

    if (partnerError) throw partnerError

    // Format therapist applications
    const formattedTherapistApplications = therapistApplications?.map(app => ({
      id: app.id,
      full_name: app.full_name,
      email: app.email,
      phone: app.phone || '',
      mdcn_code: app.mdcn_code || '',
      specialization: app.specialization || [],
      languages: app.languages || [],
      status: app.status,
      created_at: app.created_at,
      submitted_at: app.created_at,
      type: 'therapist'
    })) || []

    // Format partner applications
    const formattedPartnerApplications = partnerApplications?.map(app => ({
      id: app.id,
      full_name: app.full_name || app.email.split('@')[0],
      email: app.email,
      phone: '',
      mdcn_code: '',
      specialization: [],
      languages: [],
      status: 'pending',
      created_at: app.created_at,
      submitted_at: app.created_at,
      type: 'partner'
    })) || []

    // Combine and sort by creation date
    const allApplications = [...formattedTherapistApplications, ...formattedPartnerApplications]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return NextResponse.json(allApplications)
  } catch (error) {
    console.error('Error fetching pending verifications:', error)
    return NextResponse.json([], { status: 500 })
  }
}
