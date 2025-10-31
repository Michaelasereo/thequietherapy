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

    console.log('📸 Avatar upload requested for:', userInfo?.email || session.email)

    // ✅ USE UNIFIED AVATAR SERVICE FOR 3-WAY SYNC
    // This ensures avatar is synced across all 3 tables
    const { AvatarService } = await import('@/lib/services/avatar-service')
    
    const result = await AvatarService.uploadAndSyncAvatar(
      file,
      userInfo?.email || session.email!,
      session.id
    )

    if (!result.success) {
      console.error('❌ Avatar upload failed:', result.error)
      return NextResponse.json(
        { 
          success: false,
          error: result.error 
        },
        { status: 500 }
      )
    }

    console.log('✅ Avatar uploaded and synced to all tables:', {
      imageUrl: result.imageUrl,
      syncedTables: result.syncedTables,
      warnings: result.warnings
    })

    // Track profile_image_url as edited
    const editedFields = new Set(currentEnrollment?.edited_fields || [])
    editedFields.add('profile_image_url')

    await supabase
      .from('therapist_enrollments')
      .update({
        profile_updated_at: new Date().toISOString(),
        edited_fields: Array.from(editedFields)
      })
      .eq('email', userInfo?.email || session.email)

    console.log('✅ Edit tracking updated')

    return NextResponse.json({
      success: true,
      message: 'Profile image uploaded and synced successfully',
      imageUrl: result.imageUrl,
      syncedTables: result.syncedTables,
      warnings: result.warnings
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
