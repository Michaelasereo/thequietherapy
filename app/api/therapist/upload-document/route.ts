import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ServerSessionManager } from '@/lib/server-session-manager'
import { handleApiError, successResponse } from '@/lib/api-response'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // SECURE Authentication - only therapists can upload documents
    const session = await ServerSessionManager.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    if (session.role !== 'therapist') {
      return NextResponse.json({ error: 'Access denied. Therapist role required' }, { status: 403 })
    }

    const therapistId = session.id
    const formData = await request.formData()
    const documentType = (formData as any).get('documentType') as string // 'license' or 'id'
    const file = (formData as any).get('file') as File

    if (!documentType || !file) {
      return NextResponse.json({ error: 'Document type and file are required' }, { status: 400 })
    }

    if (!['license', 'id'].includes(documentType)) {
      return NextResponse.json({ error: 'Invalid document type' }, { status: 400 })
    }

    console.log('🔍 Uploading document:', { therapistId, documentType, fileName: file.name })

    // For now, we'll just store the file name and mark as uploaded
    // In a real implementation, you'd upload to a file storage service like AWS S3
    const fileName = `${therapistId}_${documentType}_${Date.now()}_${file.name}`
    
    // Update therapist enrollment with document info
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (documentType === 'license') {
      updateData.license_document = fileName
      updateData.license_uploaded_at = new Date().toISOString()
    } else if (documentType === 'id') {
      updateData.id_document = fileName
      updateData.id_uploaded_at = new Date().toISOString()
    }

    // Try to update by user_id first, fallback to email if user_id column doesn't exist
    let updateError
    try {
      const { error } = await supabase
        .from('therapist_enrollments')
        .update(updateData)
        .eq('user_id', therapistId)
      
      updateError = error
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
        throw new Error('Could not find user email')
      }
      
      // Update by email
      const { error } = await supabase
        .from('therapist_enrollments')
        .update(updateData)
        .eq('email', userData.email)
      
      updateError = error
    }

    if (updateError) {
      console.error('❌ Error updating therapist enrollment:', updateError)
      return NextResponse.json({ error: 'Failed to save document info' }, { status: 500 })
    }

    console.log('✅ Document uploaded successfully:', fileName)

    return successResponse({
      message: 'Document uploaded successfully',
      documentType,
      fileName,
      uploadedAt: new Date().toISOString()
    })

  } catch (error) {
    return handleApiError(error)
  }
}
