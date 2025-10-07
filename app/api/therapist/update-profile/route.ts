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

    // Update therapist profile (name and email are read-only from enrollment data)
    const updateData: any = {
      phone: phone,
      mdcn_code: mdcnCode,
      bio: bio,
      specialization: specialization && specialization.length > 0 ? specialization.join(', ') : null,
      languages: languages && languages.length > 0 ? JSON.stringify(languages) : null,
      updated_at: new Date().toISOString()
    }

    // Add new fields to the update data
    if (gender !== undefined) {
      updateData.gender = gender || null
    }
    if (maritalStatus !== undefined) {
      updateData.marital_status = maritalStatus || null
    }
    if (age !== undefined) {
      updateData.age = age || null
    }

    console.log('🔍 Update data being sent to database:', updateData)

    const { error: profileError } = await supabase
      .from('therapist_profiles')
      .update(updateData)
      .eq('user_id', therapistId)

    if (profileError) {
      console.error('❌ Error updating therapist profile:', profileError)
      
      // Check if it's a column not found error
      if (profileError.message.includes('gender') || 
          profileError.message.includes('marital_status') || 
          profileError.message.includes('age')) {
        return NextResponse.json({ 
          error: 'Database columns not found. Please add gender, marital_status, and age columns to therapist_profiles table.',
          details: profileError.message,
          sql_script: `ALTER TABLE therapist_profiles ADD COLUMN IF NOT EXISTS gender VARCHAR(50);
ALTER TABLE therapist_profiles ADD COLUMN IF NOT EXISTS marital_status VARCHAR(50);
ALTER TABLE therapist_profiles ADD COLUMN IF NOT EXISTS age VARCHAR(10);`
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
      }
    })

  } catch (error) {
    return handleApiError(error)
  }
}
