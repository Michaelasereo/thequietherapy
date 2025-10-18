import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { ServerSessionManager } from '@/lib/server-session-manager'

export async function POST(request: NextRequest) {
  try {
    // Get the user's session from our auth system
    const session = await ServerSessionManager.getSession()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is a therapist
    const supabase = createServerClient()
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('user_type')
      .eq('id', session.id)
      .single()

    if (userError || !userData || userData.user_type !== 'therapist') {
      return NextResponse.json(
        { error: 'Therapist access required' },
        { status: 403 }
      )
    }

    // Parse the form data
    const formData = await request.formData()
    const file = (formData as any).get('profileImage') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a JPEG, PNG, or WebP image.' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Please upload an image smaller than 5MB.' },
        { status: 400 }
      )
    }

    // Get user's email to find their enrollment
    const { data: userInfo } = await supabase
      .from('users')
      .select('email')
      .eq('id', session.id)
      .single()

    // Get current enrollment (for both old image deletion AND tracking)
    const { data: currentEnrollment } = await supabase
      .from('therapist_enrollments')
      .select('*')
      .eq('email', userInfo?.email || session.email)
      .single()

    // Delete old image if exists (cleanup old files)
    if (currentEnrollment?.profile_image_url) {
      try {
        const oldImageUrl = currentEnrollment.profile_image_url
        // Extract file path from URL
        const urlParts = oldImageUrl.split('/')
        const bucketIndex = urlParts.findIndex((part: string) => part === 'profile-images')
        if (bucketIndex !== -1) {
          const oldFilePath = urlParts.slice(bucketIndex + 1).join('/')
          console.log('🗑️  Deleting old image:', oldFilePath)
          
          await supabase.storage
            .from('profile-images')
            .remove([oldFilePath])
          
          console.log('✅ Old image deleted successfully')
        }
      } catch (error) {
        console.error('⚠️  Failed to delete old image (continuing anyway):', error)
        // Don't fail upload if cleanup fails
      }
    }

    // Generate UNIQUE filename with timestamp and random string
    // This makes cache busting unnecessary!
    const fileExtension = file.name.split('.').pop()
    const randomString = Math.random().toString(36).substring(2, 9)
    const fileName = `therapist-${session.id}-${Date.now()}-${randomString}.${fileExtension}`
    const filePath = `therapist-profiles/${session.id}/${fileName}` // Organize by user ID

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('profile-images')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false, // Never overwrite - always create new file
        cacheControl: '3600' // Cache for 1 hour (safe since filename is unique)
      })

    if (uploadError) {
      console.error('❌ Upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload image' },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('profile-images')
      .getPublicUrl(filePath)

    const imageUrl = urlData.publicUrl
    console.log('✅ New image uploaded:', imageUrl)

    // Preserve original enrollment data on first image upload
    let originalEnrollmentData = currentEnrollment?.original_enrollment_data
    if (!originalEnrollmentData && currentEnrollment) {
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

    // Track profile_image_url as edited
    const editedFields = new Set(currentEnrollment?.edited_fields || [])
    editedFields.add('profile_image_url')

    // Update therapist enrollment with profile image URL and edit tracking
    const { error: updateError } = await supabase
      .from('therapist_enrollments')
      .update({ 
        profile_image_url: imageUrl,
        updated_at: new Date().toISOString(),
        profile_updated_at: new Date().toISOString(),
        original_enrollment_data: originalEnrollmentData,
        edited_fields: Array.from(editedFields)
      })
      .eq('email', userInfo?.email || session.email)

    if (updateError) {
      console.error('❌ Database update error:', updateError)
      
      // ROLLBACK: Delete the uploaded image since DB update failed
      console.log('🔄 Rolling back: Deleting uploaded image...')
      try {
        const { error: deleteError } = await supabase.storage
          .from('profile-images')
          .remove([filePath])
        
        if (deleteError) {
          console.error('⚠️ Rollback failed (orphaned file will remain):', deleteError)
        } else {
          console.log('✅ Rollback successful: Uploaded image deleted')
        }
      } catch (rollbackError) {
        console.error('⚠️ Rollback exception (orphaned file):', rollbackError)
      }
      
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to update enrollment with image',
          details: updateError.message 
        },
        { status: 500 }
      )
    }

    console.log('✅ Profile image uploaded successfully:', imageUrl)

    return NextResponse.json({
      success: true,
      message: 'Profile image uploaded successfully',
      imageUrl: imageUrl
    })

  } catch (error) {
    console.error('Error uploading profile image:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Get the user's session from our auth system
    const session = await ServerSessionManager.getSession()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is a therapist
    const supabase = createServerClient()
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('user_type')
      .eq('id', session.id)
      .single()

    if (userError || !userData || userData.user_type !== 'therapist') {
      return NextResponse.json(
        { error: 'Therapist access required' },
        { status: 403 }
      )
    }

    // Get current profile image URL
    const { data: profileData, error: profileError } = await supabase
      .from('therapist_profiles')
      .select('profile_image_url')
      .eq('user_id', session.id)
      .single()

    if (profileError || !profileData) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // Remove image from storage if it exists
    if (profileData.profile_image_url) {
      // Extract file path from URL
      const url = new URL(profileData.profile_image_url)
      const filePath = url.pathname.split('/').slice(-2).join('/') // Get last two path segments
      
      await supabase.storage
        .from('profile-images')
        .remove([filePath])
    }

    // Update profile to remove image URL
    const { error: updateError } = await supabase
      .from('therapist_profiles')
      .update({ 
        profile_image_url: null,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', session.id)

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to remove profile image' },
        { status: 500 }
      )
    }

    console.log('✅ Profile image removed successfully')

    return NextResponse.json({
      success: true,
      message: 'Profile image removed successfully'
    })

  } catch (error) {
    console.error('Error removing profile image:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
