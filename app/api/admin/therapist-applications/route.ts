import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireApiAuth } from '@/lib/server-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // SECURE Authentication Check - only admins can access therapist applications
    const authResult = await requireApiAuth(['admin'])
    if ('error' in authResult) {
      return authResult.error
    }

    const { session } = authResult
    console.log('🔍 Therapist applications accessed by admin:', session.user.email)
    // Fetch all therapist applications from therapist_enrollments table
    const { data: applications, error } = await supabase
      .from('therapist_enrollments')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching therapist applications:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch applications' },
        { status: 500 }
      )
    }

    // Transform the data to match the expected interface
    const transformedApplications = applications?.map(app => ({
      id: app.id,
      full_name: app.full_name,
      email: app.email,
      phone: app.phone,
      mdcn_code: app.mdcn_code || app.license_number || app.registration_number || 'N/A',
      specialization: Array.isArray(app.specialization) ? app.specialization : [],
      languages: Array.isArray(app.languages) ? app.languages : [],
      status: app.status || 'pending',
      created_at: app.created_at,
      submitted_at: app.created_at
    })) || []

    return NextResponse.json({
      success: true,
      applications: transformedApplications
    })

  } catch (error) {
    console.error('Error in therapist applications API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
