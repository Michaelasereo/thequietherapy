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

    // Check if enrollment already exists
    const { data: existingEnrollment, error: checkError } = await supabase
      .from('therapist_enrollments')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing enrollment:', checkError)
      return NextResponse.json({
        success: false,
        error: 'Database error while checking existing enrollment'
      }, { status: 500 })
    }

    if (existingEnrollment) {
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

    // Create enrollment record with ALL fields
    // Use both specialization (for compatibility) and specializations (preferred)
    // Build insert object conditionally to handle optional fields
    // NOTE: user_id is NULL during enrollment (will be set after user account is created via magic link)
    const insertData: any = {
      full_name: fullName,
      email: email.toLowerCase(),
      phone: phone || null,
      // Use mdcn_code (matches schema). If column doesn't exist, try licensed_qualification
      mdcn_code: licensedQualification || null,
      // Only use new array columns to avoid type conflicts
      specializations: Array.isArray(specialization) ? specialization : (specialization ? [specialization] : []), // Preferred TEXT[] column
      languages_array: Array.isArray(languages) ? languages : [], // Preferred TEXT[] column
      bio: bio || null,
      profile_image_url: profileImageUrl, // Set profile image (default or uploaded)
      status: 'pending', // Admin needs to approve before they can set availability
      is_active: true, // Ensure is_active is set
      is_verified: false // Ensure is_verified is set
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
    
    const { error: enrollmentError } = await supabase
      .from('therapist_enrollments')
      .insert(insertData)

    if (enrollmentError) {
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
      
      // If enrollment failed and we uploaded an image, try to clean it up
      if (profileImageUrl && profileImageUrl !== '/placeholder.svg') {
        try {
          const urlParts = profileImageUrl.split('/')
          const bucketIndex = urlParts.findIndex((part: string) => part === 'profile-images')
          if (bucketIndex !== -1) {
            const filePath = urlParts.slice(bucketIndex + 1).join('/')
            await supabase.storage
              .from('profile-images')
              .remove([filePath])
          }
        } catch (cleanupError) {
          console.error('Failed to cleanup uploaded image:', cleanupError)
        }
      }
      
      // Check if error is about missing columns
      const errorMessage = enrollmentError.message || ''
      const isColumnError = errorMessage.includes('column') && (
        errorMessage.includes('does not exist') || 
        errorMessage.includes('cannot be null')
      )
      
      // Return more detailed error for debugging
      return NextResponse.json({
        success: false,
        error: isColumnError 
          ? 'Database schema mismatch. Please contact support.'
          : 'Failed to save enrollment data. Please try again.',
        details: enrollmentError.message,
        code: enrollmentError.code,
        hint: enrollmentError.hint,
        // Include the insert data that failed (for debugging) - always include in production for Netlify logs
        debug: {
          insertDataKeys: Object.keys(insertData),
          errorCode: enrollmentError.code,
          errorMessage: enrollmentError.message
        }
      }, { status: 500 })
    }

    console.log('✅ Enrollment saved successfully with profile image:', profileImageUrl)

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

