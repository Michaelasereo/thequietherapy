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

    // Generate unique filename
    const fileExtension = file.name.split('.').pop()
    const fileName = `therapist-${session.id}-${Date.now()}.${fileExtension}`
    const filePath = `therapist-profiles/${fileName}`

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('profile-images')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
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

    // Update therapist profile with new image URL
    const { error: updateError } = await supabase
      .from('therapist_profiles')
      .update({ 
        profile_image_url: imageUrl,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', session.id)

    if (updateError) {
      console.error('Update error:', updateError)
      // Try to delete the uploaded file if profile update fails
      await supabase.storage
        .from('profile-images')
        .remove([filePath])
      
      return NextResponse.json(
        { error: 'Failed to update profile with image' },
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
