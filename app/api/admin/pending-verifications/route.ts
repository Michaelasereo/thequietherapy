import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString()
}

export async function GET(request: Request) {
  try {
    // Add cache control headers to prevent stale data
    const headers = {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }

    // Fetch pending therapist enrollments
    const { data: therapistApplications, error: therapistError } = await supabase
      .from('therapist_enrollments')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (therapistError) throw therapistError

    // Fetch pending partner users (users with user_type = 'partner' and partner_status = 'pending')
    const { data: partnerApplications, error: partnerError } = await supabase
      .from('users')
      .select('*')
      .eq('user_type', 'partner')
      .eq('partner_status', 'pending')
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
    const formattedPartnerApplications = partnerApplications?.map(app => {
      const onboardingData = app.onboarding_data || {}
      return {
        id: app.id,
        full_name: app.full_name || app.company_name || app.email.split('@')[0],
        email: app.email,
        phone: onboardingData.phone || '',
        mdcn_code: '',
        specialization: [],
        languages: [],
        status: 'pending',
        created_at: app.created_at,
        submitted_at: app.created_at,
        type: 'partner',
        company_name: app.company_name || '',
        organization_type: app.organization_type || '',
        onboarding_data: onboardingData
      }
    }) || []

    // Combine and sort by creation date
    const allApplications = [...formattedTherapistApplications, ...formattedPartnerApplications]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return NextResponse.json(allApplications, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    console.error('Error fetching pending verifications:', error)
    return NextResponse.json([], { status: 500 })
  }
}
