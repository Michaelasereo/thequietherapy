import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createMagicLinkForAuthType } from '@/lib/auth'

// Initialize Supabase client with error checking
const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey
    })
    throw new Error('Supabase configuration missing')
  }

  return createClient(supabaseUrl, supabaseKey)
}

export async function POST(request: NextRequest) {
  try {
    // Initialize Supabase client
    const supabase = getSupabaseClient()

    // Parse form data (supports both JSON and FormData for file uploads)
    const contentType = request.headers.get('content-type') || ''
    let email: string
    let fullName: string
    let phone: string
    let licensedQualification: string
    let specialization: any
    let languages: any
    let gender: string
    let age: string
    let maritalStatus: string
    let bio: string
    let profileImageFile: File | null = null
    let idDocumentFile: File | null = null // ✅ FIX: Add ID document file variable

    if (contentType.includes('multipart/form-data')) {
      // Handle FormData (with file upload)
      const formData = (await request.formData()) as any
      email = formData.get('email') as string
      fullName = formData.get('fullName') as string
      phone = formData.get('phone') as string
      licensedQualification = formData.get('licensedQualification') as string
      
      const specializationStr = formData.get('specialization') as string
      const languagesStr = formData.get('languages') as string
      
      specialization = specializationStr ? JSON.parse(specializationStr) : []
      languages = languagesStr ? JSON.parse(languagesStr) : []
      
      gender = formData.get('gender') as string
      age = formData.get('age') as string
      maritalStatus = formData.get('maritalStatus') as string
      bio = formData.get('bio') as string
      
      // Get profile image file if provided
      const imageFile = formData.get('profileImage') as File | null
      if (imageFile && imageFile.size > 0) {
        profileImageFile = imageFile
      }
      
      // ✅ FIX: Extract ID document file if provided
      const idDocFile = formData.get('idDocument') as File | null
      if (idDocFile && idDocFile.size > 0) {
        idDocumentFile = idDocFile
        console.log('📄 ID document extracted from form data:', idDocFile.name, idDocFile.size, 'bytes')
      } else {
        console.warn('⚠️ No ID document file found in form data')
      }
    } else {
      // Handle JSON (backward compatibility)
      const body = await request.json()
      email = body.email
      fullName = body.fullName
      phone = body.phone
      licensedQualification = body.licensedQualification
      specialization = body.specialization
      languages = body.languages
      gender = body.gender
      age = body.age
      maritalStatus = body.maritalStatus
      bio = body.bio
    }

    console.log('🔑 Therapist enrollment request for:', email)

    // Validate required fields
    if (!email || !fullName || !phone || !licensedQualification || !gender || !age || !maritalStatus || !bio) {
      return NextResponse.json({
        success: false,
        error: 'All required fields must be filled'
      }, { status: 400 })
    }

    // Check if enrollment already exists (with more robust duplicate prevention)
    // This prevents duplicate enrollments from React Strict Mode or double submissions
    const { data: existingEnrollment, error: checkError } = await supabase
      .from('therapist_enrollments')
      .select('id, created_at')
      .eq('email', email.toLowerCase())
      .order('created_at', { ascending: false })
      .limit(1)

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing enrollment:', checkError)
      return NextResponse.json({
        success: false,
        error: 'Database error while checking existing enrollment'
      }, { status: 500 })
    }

    // Check if enrollment was created in the last 5 seconds (prevents duplicate submissions)
    if (existingEnrollment && existingEnrollment.length > 0) {
      const enrollment = existingEnrollment[0]
      const enrollmentTime = new Date(enrollment.created_at).getTime()
      const now = Date.now()
      const timeDiff = now - enrollmentTime
      
      // If enrollment was created less than 5 seconds ago, it's likely a duplicate
      if (timeDiff < 5000) {
        console.warn('⚠️ Duplicate enrollment attempt detected (created', timeDiff, 'ms ago)')
        return NextResponse.json({
          success: false,
          error: 'An enrollment with this email was just created. Please wait a moment and try again.'
        }, { status: 400 })
      }
      
      // Otherwise, it's an old enrollment
      return NextResponse.json({
        success: false,
        error: 'An enrollment with this email already exists. Please use the login page.'
      }, { status: 400 })
    }

    // Handle profile picture upload if provided
    let profileImageUrl: string | null = null
    const DEFAULT_PROFILE_IMAGE = '/placeholder.svg' // Default placeholder
    
    if (profileImageFile) {
      try {
        console.log('📸 Uploading profile image during enrollment...')
        
        // Generate unique file name
        const fileExtension = profileImageFile.name.split('.').pop()?.toLowerCase() || 'jpg'
        const tempId = `enroll-${Date.now()}-${Math.random().toString(36).substring(7)}`
        const fileName = `therapist-${tempId}.${fileExtension}`
        const filePath = `therapist-profiles/enrollment/${fileName}`
        
        // Convert file to buffer
        const arrayBuffer = await profileImageFile.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        
        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('profile-images')
          .upload(filePath, buffer, {
            contentType: profileImageFile.type,
            upsert: false
          })
        
        if (uploadError) {
          console.error('❌ Profile image upload error:', uploadError)
          // Don't fail enrollment if image upload fails, just log it
          console.warn('⚠️  Continuing enrollment without profile image due to upload error')
        } else {
          // Get public URL
          const { data: urlData } = supabase.storage
            .from('profile-images')
            .getPublicUrl(filePath)
          
          profileImageUrl = urlData.publicUrl
          console.log('✅ Profile image uploaded:', profileImageUrl)
        }
      } catch (imageError) {
        console.error('❌ Error handling profile image:', imageError)
        // Don't fail enrollment if image processing fails
        console.warn('⚠️  Continuing enrollment without profile image due to processing error')
      }
    }
    
    // Use default placeholder if no image was uploaded
    if (!profileImageUrl) {
      profileImageUrl = DEFAULT_PROFILE_IMAGE
      console.log('ℹ️  Using default profile image:', profileImageUrl)
    }

    // ✅ FIX: Handle ID document upload if provided
    let idDocumentUrl: string | null = null
    
    if (idDocumentFile) {
      try {
        console.log('📄 Uploading ID document during enrollment...')
        
        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024 // 10MB
        if (idDocumentFile.size > maxSize) {
          console.error('❌ ID document too large:', idDocumentFile.size, 'bytes')
          // Don't fail enrollment, just log warning
          console.warn('⚠️  ID document exceeds 10MB limit, continuing without document')
        } else {
          // Validate file type
          const allowedTypes = [
            'application/pdf',
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/webp'
          ]
          
          if (!allowedTypes.includes(idDocumentFile.type)) {
            console.error('❌ Invalid ID document type:', idDocumentFile.type)
            console.warn('⚠️  ID document type not allowed, continuing without document')
          } else {
            // Generate unique file name
            const fileExtension = idDocumentFile.name.split('.').pop()?.toLowerCase() || 'pdf'
            const tempId = `enroll-${Date.now()}-${Math.random().toString(36).substring(7)}`
            const fileName = `id-document-${tempId}.${fileExtension}`
            const filePath = `therapist-documents/enrollment/${fileName}`
            
            // Convert file to buffer
            const arrayBuffer = await idDocumentFile.arrayBuffer()
            const buffer = Buffer.from(arrayBuffer)
            
            // Upload to Supabase Storage
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('therapist-documents')
              .upload(filePath, buffer, {
                contentType: idDocumentFile.type,
                upsert: false
              })
            
            if (uploadError) {
              console.error('❌ ID document upload error:', uploadError)
              // Don't fail enrollment if document upload fails, just log it
              console.warn('⚠️  Continuing enrollment without ID document due to upload error')
            } else {
              // Get public URL
              const { data: urlData } = supabase.storage
                .from('therapist-documents')
                .getPublicUrl(filePath)
              
              idDocumentUrl = urlData.publicUrl
              console.log('✅ ID document uploaded:', idDocumentUrl)
            }
          }
        }
      } catch (docError) {
        console.error('❌ Error handling ID document:', docError)
        // Don't fail enrollment if document processing fails
        console.warn('⚠️  Continuing enrollment without ID document due to processing error')
      }
    }

    // Create enrollment record with ALL fields
    // Use both specialization (for compatibility) and specializations (preferred)
    // Build insert object conditionally to handle optional fields
    // NOTE: user_id is NULL during enrollment (will be set after user account is created via magic link)
    const insertData: any = {
      full_name: fullName,
      email: email.toLowerCase(),
      phone: phone || null,
      // ✅ FIX: Truncate mdcn_code to 50 chars (VARCHAR(50) limit)
      // Use mdcn_code (matches schema). If column doesn't exist, try licensed_qualification
      mdcn_code: licensedQualification ? licensedQualification.substring(0, 50) : null,
      // Only use new array columns to avoid type conflicts
      specializations: Array.isArray(specialization) ? specialization : (specialization ? [specialization] : []), // Preferred TEXT[] column
      languages_array: Array.isArray(languages) ? languages : [], // Preferred TEXT[] column
      bio: bio || null,
      profile_image_url: profileImageUrl, // Set profile image (default or uploaded)
      status: 'pending', // Admin needs to approve before they can set availability
      is_active: true, // Ensure is_active is set
      is_verified: false, // Ensure is_verified is set
      // ✅ FIX: Include ID document data
      id_document: idDocumentUrl || null,
      id_uploaded_at: idDocumentUrl ? new Date().toISOString() : null,
      id_verified: false // Document verification pending admin review
      // user_id is intentionally omitted - will be NULL until user account is created
    }

    // Add optional fields - if columns don't exist, they'll be ignored on retry
    if (gender) insertData.gender = gender
    if (age) {
      const ageNum = parseInt(age)
      insertData.age = isNaN(ageNum) ? null : ageNum
    }
    if (maritalStatus) insertData.marital_status = maritalStatus
    
    // Also try licensed_qualification if mdcn_code doesn't exist
    // This handles both column name variations
    insertData.licensed_qualification = licensedQualification || null
    
    // Final duplicate check right before insert (race condition protection)
    const { data: lastCheck, error: lastCheckError } = await supabase
      .from('therapist_enrollments')
      .select('id, created_at')
      .eq('email', email.toLowerCase())
      .order('created_at', { ascending: false })
      .limit(1)

    if (!lastCheckError && lastCheck && lastCheck.length > 0) {
      const enrollment = lastCheck[0]
      const enrollmentTime = new Date(enrollment.created_at).getTime()
      const now = Date.now()
      const timeDiff = now - enrollmentTime
      
      // If enrollment was created less than 5 seconds ago, it's a duplicate
      if (timeDiff < 5000) {
        console.warn('⚠️ Duplicate enrollment prevented at last check (created', timeDiff, 'ms ago)')
        return NextResponse.json({
          success: false,
          error: 'An enrollment with this email was just created. Please wait a moment and try again.'
        }, { status: 400 })
      }
    }

    console.log('📝 Attempting to insert enrollment data:', {
      email: insertData.email,
      full_name: insertData.full_name,
      hasPhone: !!insertData.phone,
      hasBio: !!insertData.bio,
      hasSpecializations: Array.isArray(insertData.specializations) && insertData.specializations.length > 0,
      hasLanguages: Array.isArray(insertData.languages_array) && insertData.languages_array.length > 0,
      profileImageUrl: insertData.profile_image_url,
      dataKeys: Object.keys(insertData)
    })
    
    const { data: insertedEnrollment, error: enrollmentError } = await supabase
      .from('therapist_enrollments')
      .insert(insertData)
      .select('id')
      .single()

    if (enrollmentError) {
      // Check if it's a unique constraint violation (email already exists)
      const isDuplicateError = enrollmentError.code === '23505' && (
        enrollmentError.message?.includes('email') || 
        enrollmentError.message?.includes('therapist_enrollments_email_key') ||
        enrollmentError.details?.includes('email')
      )

      if (isDuplicateError) {
        console.warn('⚠️ Duplicate enrollment prevented by database constraint (email unique)')
        return NextResponse.json({
          success: false,
          error: 'An enrollment with this email already exists. Please wait a moment and try again, or use the login page if you already enrolled.'
        }, { status: 400 })
      }

      console.error('❌ Error creating enrollment:', enrollmentError)
      console.error('❌ Error details:', {
        message: enrollmentError.message,
        code: enrollmentError.code,
        details: enrollmentError.details,
        hint: enrollmentError.hint,
        fullError: JSON.stringify(enrollmentError, null, 2)
      })
      console.error('❌ Attempted insert data keys:', Object.keys(insertData))
      console.error('❌ Attempted insert data:', JSON.stringify(insertData, null, 2))
      
      // ✅ FIX: Cleanup uploaded files if enrollment failed
      // Cleanup profile image
      if (profileImageUrl && profileImageUrl !== '/placeholder.svg') {
        try {
          const urlParts = profileImageUrl.split('/')
          const bucketIndex = urlParts.findIndex((part: string) => part === 'profile-images')
          if (bucketIndex !== -1) {
            const filePath = urlParts.slice(bucketIndex + 1).join('/')
            await supabase.storage
              .from('profile-images')
              .remove([filePath])
            console.log('🧹 Cleaned up profile image:', filePath)
          }
        } catch (cleanupError) {
          console.error('Failed to cleanup uploaded image:', cleanupError)
        }
      }
      
      // Cleanup ID document
      if (idDocumentUrl) {
        try {
          const urlParts = idDocumentUrl.split('/')
          const bucketIndex = urlParts.findIndex((part: string) => part === 'therapist-documents')
          if (bucketIndex !== -1) {
            const filePath = urlParts.slice(bucketIndex + 1).join('/')
            await supabase.storage
              .from('therapist-documents')
              .remove([filePath])
            console.log('🧹 Cleaned up ID document:', filePath)
          }
        } catch (cleanupError) {
          console.error('Failed to cleanup uploaded ID document:', cleanupError)
        }
      }
      
      // Check for specific error types and provide helpful messages
      const errorMessage = enrollmentError.message || ''
      const errorCode = enrollmentError.code || ''
      
      // Check if error is about missing columns
      const isColumnError = errorMessage.includes('column') && (
        errorMessage.includes('does not exist') || 
        errorMessage.includes('cannot be null')
      )
      
      // Check for constraint violations
      const isConstraintError = errorCode === '23505' // Unique violation
      const isForeignKeyError = errorCode === '23503' // Foreign key violation
      const isNotNullError = errorCode === '23502' // Not null violation
      
      // Provide specific error messages
      let userMessage = 'Failed to save enrollment data. Please try again.'
      let technicalDetails = errorMessage
      
      if (isColumnError) {
        userMessage = 'Database configuration issue. Please contact support with error code: DB_SCHEMA_ERROR'
        technicalDetails = `Missing column: ${errorMessage}`
      } else if (isConstraintError) {
        // Check if it's email duplicate (this is the duplicate enrollment case)
        if (errorMessage.includes('email') || errorMessage.includes('therapist_enrollments_email_key')) {
          console.warn('⚠️ Duplicate enrollment prevented by database constraint (email unique)')
          userMessage = 'An enrollment with this email already exists. If you just submitted, please wait a moment.'
          technicalDetails = 'Email already enrolled - duplicate prevented'
        } else if (errorMessage.includes('user_id') || errorMessage.includes('therapist_enrollments_user_id_key')) {
          userMessage = 'Database configuration error. Please run fix-enrollment-constraint.sql in Supabase.'
          technicalDetails = 'UNIQUE constraint on user_id preventing enrollment'
        } else {
          userMessage = 'A record with this information already exists. Please contact support.'
          technicalDetails = `Unique constraint violation: ${errorMessage}`
        }
      } else if (isNotNullError) {
        userMessage = 'Required field is missing. Please fill out all required fields.'
        technicalDetails = `NOT NULL violation: ${errorMessage}`
      } else if (isForeignKeyError) {
        userMessage = 'Database configuration issue. Please contact support.'
        technicalDetails = `Foreign key violation: ${errorMessage}`
      }
      
      // Return detailed error for debugging in production (Netlify logs will show this)
      return NextResponse.json({
        success: false,
        error: userMessage,
        // Include technical details for debugging (visible in Netlify logs)
        details: technicalDetails,
        code: errorCode,
        hint: enrollmentError.hint,
        // Debug info (only in response for production debugging)
        debug: {
          insertDataKeys: Object.keys(insertData),
          errorCode: errorCode,
          errorMessage: errorMessage,
          // Include a sample of the data (without sensitive info)
          sampleData: {
            email: insertData.email,
            hasSpecializations: Array.isArray(insertData.specializations),
            hasLanguages: Array.isArray(insertData.languages_array),
            hasGender: !!insertData.gender,
            hasAge: !!insertData.age,
            hasMaritalStatus: !!insertData.marital_status
          }
        }
      }, { status: 500 })
    }

    console.log('✅ Enrollment saved successfully:', {
      profileImageUrl,
      idDocumentUrl,
      hasIdDocument: !!idDocumentUrl,
      idUploadedAt: insertData.id_uploaded_at
    })

    // Send magic link to create account and access dashboard
    // They can login but can't set availability until admin approves
    const magicLinkResult = await createMagicLinkForAuthType(
      email,
      'therapist',
      'signup',
      {
        user_type: 'therapist',
        first_name: fullName,
        email: email.toLowerCase(),
        fullName: fullName,
        phone,
        licensedQualification,
        specialization,
        languages,
        gender,
        age,
        maritalStatus,
        bio
      }
    )

    if (!magicLinkResult.success) {
      console.error('Failed to create magic link:', magicLinkResult.error)
      // Enrollment was created but magic link failed - still return success but warn
      return NextResponse.json({
        success: true,
        message: 'Enrollment submitted but magic link failed. Please try logging in manually.',
        enrollment_created: true,
        magic_link_error: magicLinkResult.error
      })
    }

    console.log('✅ Magic link sent to therapist:', email)

    return NextResponse.json({
      success: true,
      message: 'Enrollment submitted successfully. Magic link sent to your email.',
      email: email.toLowerCase()
    })

  } catch (error) {
    console.error('❌ Therapist enrollment error:', error)
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('❌ Full error:', JSON.stringify(error, null, 2))
    
    // Check if it's a Supabase configuration error
    if (error instanceof Error && error.message === 'Supabase configuration missing') {
      return NextResponse.json({
        success: false,
        error: 'Server configuration error. Please contact support.',
        details: 'Missing Supabase environment variables'
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: false,
      error: 'An error occurred during enrollment. Please try again.',
      details: error instanceof Error ? error.message : 'Unknown error',
      type: error instanceof Error ? error.constructor.name : typeof error
    }, { status: 500 })
  }
}

