import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const therapistId = searchParams.get('therapistId')

    if (!therapistId) {
      return NextResponse.json({ error: 'Therapist ID is required' }, { status: 400 })
    }

    // Fetch therapist enrollment data which contains verification info
    // Try to find by user_id first, fallback to email if user_id column doesn't exist
    let enrollment, enrollmentError
    
    try {
      const { data, error } = await supabase
        .from('therapist_enrollments')
        .select('*')
        .eq('user_id', therapistId)
        .single()
      
      enrollment = data
      enrollmentError = error
    } catch (err) {
      // If user_id column doesn't exist, try to find by email
      console.log('user_id column not found, trying to find by email...')
      
      // Get user email first
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('email')
        .eq('id', therapistId)
        .single()
      
      if (userError || !userData) {
        enrollmentError = userError
      } else {
        // Find enrollment by email
        const { data, error } = await supabase
          .from('therapist_enrollments')
          .select('*')
          .eq('email', userData.email)
          .single()
        
        enrollment = data
        enrollmentError = error
      }
    }

    if (enrollmentError) {
      console.error('Error fetching therapist enrollment:', enrollmentError)
      return NextResponse.json({ error: 'Therapist not found' }, { status: 404 })
    }

    // Determine verification status based on enrollment data
    const verificationData = {
      license_verified: enrollment.status === 'approved' || enrollment.license_verified === true,
      id_verified: enrollment.status === 'approved' || enrollment.id_verified === true,
      license_document: enrollment.license_document || enrollment.id_document_url || null,
      id_document: enrollment.id_document || null,
      license_uploaded_at: enrollment.license_uploaded_at || null,
      id_uploaded_at: enrollment.id_uploaded_at || null,
      verified_at: enrollment.approved_at || null,
      fully_verified: enrollment.status === 'approved',
      status: enrollment.status || 'pending',
      rejection_reason: enrollment.rejection_reason || null
    }

    return NextResponse.json(verificationData)

  } catch (error) {
    console.error('Error fetching verification status:', error)
    return NextResponse.json({
      error: 'Failed to fetch verification status'
    }, { status: 500 })
  }
}
