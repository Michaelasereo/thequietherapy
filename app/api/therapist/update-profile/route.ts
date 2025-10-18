import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ServerSessionManager } from '@/lib/server-session-manager'
import { handleApiError, successResponse } from '@/lib/api-response'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PUT(request: NextRequest) {
  try {
    // SECURE Authentication - only therapists can update their profile
    const session = await ServerSessionManager.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    if (session.role !== 'therapist') {
      return NextResponse.json({ error: 'Access denied. Therapist role required' }, { status: 403 })
    }

    const therapistId = session.id
    const body = await request.json()
    const { phone, mdcnCode, bio, specialization, languages, gender, maritalStatus, age } = body

    console.log('🔍 Updating therapist profile:', { therapistId, phone, mdcnCode, bio, specialization, languages, gender, maritalStatus, age })

    // Get current enrollment data to check for original_enrollment_data and edited_fields
    const { data: currentEnrollment, error: fetchError } = await supabase
      .from('therapist_enrollments')
      .select('*')
      .eq('email', session.email)
      .single()

    if (fetchError || !currentEnrollment) {
      console.error('❌ Error fetching current enrollment:', fetchError)
      return NextResponse.json({ 
        error: 'Enrollment record not found',
        details: fetchError?.message 
      }, { status: 404 })
    }

    console.log('🔍 Current enrollment data:', currentEnrollment)

    // Preserve original enrollment data on first edit (if not already preserved)
    let originalEnrollmentData = currentEnrollment.original_enrollment_data
    if (!originalEnrollmentData) {
      console.log('🔍 Preserving original enrollment data (first edit)')
      originalEnrollmentData = {
        full_name: currentEnrollment.full_name,
        phone: currentEnrollment.phone || '',
        licensed_qualification: currentEnrollment.licensed_qualification || '',
        bio: currentEnrollment.bio || '',
        specialization: currentEnrollment.specialization || [],
        languages: currentEnrollment.languages || [],
        gender: currentEnrollment.gender || '',
        age: currentEnrollment.age || null,
        marital_status: currentEnrollment.marital_status || '',
        profile_image_url: currentEnrollment.profile_image_url || ''
      }
    }

    // Track which fields are being edited
    const editedFields = new Set(currentEnrollment.edited_fields || [])
    const fieldMapping: Record<string, string> = {
      phone: 'phone',
      mdcnCode: 'licensed_qualification',
      bio: 'bio',
      specialization: 'specialization',
      languages: 'languages',
      gender: 'gender',
      maritalStatus: 'marital_status',
      age: 'age'
    }

    // Update therapist profile (name and email are read-only from enrollment data)
    const updateData: any = {
      updated_at: new Date().toISOString(),
      profile_updated_at: new Date().toISOString(),
      original_enrollment_data: originalEnrollmentData
    }
    
    // Only update fields that have meaningful values and track them as edited
    if (phone !== undefined && phone !== '') {
      updateData.phone = phone
      if (phone !== originalEnrollmentData.phone) {
        editedFields.add('phone')
      }
    }
    if (mdcnCode !== undefined && mdcnCode !== '') {
      updateData.licensed_qualification = mdcnCode
      if (mdcnCode !== originalEnrollmentData.licensed_qualification) {
        editedFields.add('licensed_qualification')
      }
    }
    if (bio !== undefined && bio !== '') {
      updateData.bio = bio
      if (bio !== originalEnrollmentData.bio) {
        editedFields.add('bio')
      }
    }
    if (specialization !== undefined && Array.isArray(specialization) && specialization.length > 0) {
      updateData.specialization = specialization
      // Compare arrays
      const originalSpec = Array.isArray(originalEnrollmentData.specialization) 
        ? originalEnrollmentData.specialization 
        : []
      if (JSON.stringify(specialization.sort()) !== JSON.stringify(originalSpec.sort())) {
        editedFields.add('specialization')
      }
    }
    if (languages !== undefined && Array.isArray(languages) && languages.length > 0) {
      updateData.languages = languages
      // Compare arrays
      const originalLangs = Array.isArray(originalEnrollmentData.languages) 
        ? originalEnrollmentData.languages 
        : []
      if (JSON.stringify(languages.sort()) !== JSON.stringify(originalLangs.sort())) {
        editedFields.add('languages')
      }
    }
    if (gender !== undefined && gender !== '') {
      updateData.gender = gender
      if (gender !== originalEnrollmentData.gender) {
        editedFields.add('gender')
      }
    }
    if (maritalStatus !== undefined && maritalStatus !== '') {
      updateData.marital_status = maritalStatus
      if (maritalStatus !== originalEnrollmentData.marital_status) {
        editedFields.add('marital_status')
      }
    }
    if (age !== undefined && age !== '') {
      updateData.age = age
      if (age !== originalEnrollmentData.age) {
        editedFields.add('age')
      }
    }

    // Update the edited_fields array
    updateData.edited_fields = Array.from(editedFields)

    console.log('🔍 Update data being sent to database:', updateData)
    console.log('🔍 Edited fields:', updateData.edited_fields)

    // Update therapist_enrollments table instead of therapist_profiles
    const { error: profileError } = await supabase
      .from('therapist_enrollments')
      .update(updateData)
      .eq('email', session.email)

    if (profileError) {
      console.error('❌ Error updating therapist profile:', profileError)
      
      // Check if it's a column not found error
      if (profileError.message.includes('gender') || 
          profileError.message.includes('marital_status') || 
          profileError.message.includes('age')) {
        return NextResponse.json({ 
          error: 'Database columns not found. Please add gender, marital_status, and age columns to therapist_enrollments table.',
          details: profileError.message,
          sql_script: `ALTER TABLE therapist_enrollments ADD COLUMN IF NOT EXISTS gender VARCHAR(50);
ALTER TABLE therapist_enrollments ADD COLUMN IF NOT EXISTS marital_status VARCHAR(50);
ALTER TABLE therapist_enrollments ADD COLUMN IF NOT EXISTS age INTEGER;`
        }, { status: 500 })
      }
      
      return NextResponse.json({ 
        error: 'Failed to update therapist profile',
        details: profileError.message 
      }, { status: 500 })
    }

    console.log('✅ Therapist profile updated successfully')

    return successResponse({
      message: 'Profile updated successfully',
      updated: {
        phone,
        mdcnCode,
        bio,
        specialization,
        languages,
        gender,
        maritalStatus,
        age
      },
      editTracking: {
        edited_fields: updateData.edited_fields,
        profile_updated_at: updateData.profile_updated_at,
        has_original_data: !!originalEnrollmentData
      }
    })

  } catch (error) {
    return handleApiError(error)
  }
}
