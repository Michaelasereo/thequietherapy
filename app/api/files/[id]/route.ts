import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { readFile } from 'fs/promises'
import { join } from 'path'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: fileId } = await params
    const { searchParams } = new URL(request.url)
    const download = searchParams.get('download') === 'true'

    // Fetch file metadata from database
    const { data: fileData, error } = await supabase
      .from('uploaded_files')
      .select('*')
      .eq('id', fileId)
      .single()

    if (error || !fileData) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    // Read file from storage
    const filePath = fileData.file_path
    
    try {
      const fileBuffer = await readFile(filePath)
      
      // Determine content type
      const contentType = fileData.type || 'application/octet-stream'
      
      // Create response headers
      const headers = new Headers({
        'Content-Type': contentType,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      })

      // Add download headers if requested
      if (download) {
        headers.set('Content-Disposition', `attachment; filename="${fileData.original_name}"`)
      } else {
        headers.set('Content-Disposition', `inline; filename="${fileData.original_name}"`)
      }

      return new NextResponse(fileBuffer as any, {
        status: 200,
        headers
      })

    } catch (fileError) {
      console.error('Error reading file:', fileError)
      return NextResponse.json(
        { error: 'File not accessible' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('💥 Error serving file:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE endpoint for file deletion
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: fileId } = await params
    
    // Fetch file metadata
    const { data: fileData, error: fetchError } = await supabase
      .from('uploaded_files')
      .select('*')
      .eq('id', fileId)
      .single()

    if (fetchError || !fileData) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    // TODO: Add authorization check here
    // Ensure user can delete this file

    // Delete file from storage
    try {
      const fs = require('fs').promises
      await fs.unlink(fileData.file_path)
    } catch (fileError) {
      console.warn('Could not delete physical file:', fileError)
      // Continue with database deletion even if file doesn't exist
    }

    // Delete file record from database
    const { error: deleteError } = await supabase
      .from('uploaded_files')
      .delete()
      .eq('id', fileId)

    if (deleteError) {
      console.error('Database error deleting file:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete file record' },
        { status: 500 }
      )
    }

    console.log(`✅ File deleted successfully: ${fileId}`)

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully'
    })

  } catch (error) {
    console.error('💥 Error deleting file:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
