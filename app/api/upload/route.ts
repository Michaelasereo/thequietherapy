import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Supported file types and their configurations
const FILE_CONFIGS = {
  images: {
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    maxSize: 5 * 1024 * 1024, // 5MB
    folder: 'images'
  },
  documents: {
    extensions: ['.pdf', '.doc', '.docx', '.txt'],
    maxSize: 10 * 1024 * 1024, // 10MB
    folder: 'documents'
  },
  csv: {
    extensions: ['.csv'],
    maxSize: 2 * 1024 * 1024, // 2MB
    folder: 'csv'
  },
  audio: {
    extensions: ['.mp3', '.wav', '.m4a', '.webm'],
    maxSize: 50 * 1024 * 1024, // 50MB
    folder: 'audio'
  },
  video: {
    extensions: ['.mp4', '.webm', '.mov'],
    maxSize: 100 * 1024 * 1024, // 100MB
    folder: 'video'
  }
}

export interface UploadResponse {
  success: boolean
  file?: {
    id: string
    filename: string
    originalName: string
    size: number
    type: string
    category: string
    url: string
    uploadedAt: string
  }
  error?: string
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = (formData as any).get('file') as File
    const category = (formData as any).get('category') as string || 'documents'
    const userId = (formData as any).get('user_id') as string
    const metadata = (formData as any).get('metadata') ? JSON.parse((formData as any).get('metadata') as string) : {}

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file category
    if (!FILE_CONFIGS[category as keyof typeof FILE_CONFIGS]) {
      return NextResponse.json(
        { success: false, error: 'Invalid file category' },
        { status: 400 }
      )
    }

    const config = FILE_CONFIGS[category as keyof typeof FILE_CONFIGS]
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()

    // Validate file extension
    if (!config.extensions.includes(fileExtension)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid file type. Allowed: ${config.extensions.join(', ')}` 
        },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > config.maxSize) {
      return NextResponse.json(
        { 
          success: false, 
          error: `File too large. Maximum size: ${config.maxSize / (1024 * 1024)}MB` 
        },
        { status: 400 }
      )
    }

    // Generate unique filename
    const fileId = uuidv4()
    const filename = `${fileId}${fileExtension}`
    const uploadPath = join(process.cwd(), 'uploads', config.folder)
    const filePath = join(uploadPath, filename)

    // Ensure upload directory exists
    try {
      await mkdir(uploadPath, { recursive: true })
    } catch (error) {
      // Directory might already exist, ignore error
    }

    // Save file to local storage
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    await writeFile(filePath, buffer)

    // Save file metadata to database
    const fileRecord = {
      id: fileId,
      filename,
      original_name: file.name,
      size: file.size,
      type: file.type,
      category,
      user_id: userId,
      file_path: filePath,
      url: `/api/files/${fileId}`,
      metadata: metadata,
      uploaded_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('uploaded_files')
      .insert(fileRecord)
      .select()
      .single()

    if (error) {
      console.error('Database error saving file record:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to save file record' },
        { status: 500 }
      )
    }

    console.log(`✅ File uploaded successfully: ${filename} (${file.size} bytes)`)

    const response: UploadResponse = {
      success: true,
      file: {
        id: data.id,
        filename: data.filename,
        originalName: data.original_name,
        size: data.size,
        type: data.type,
        category: data.category,
        url: data.url,
        uploadedAt: data.uploaded_at
      }
    }

    return NextResponse.json(response, { status: 201 })

  } catch (error) {
    console.error('💥 File upload error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error during file upload'
      },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve file information
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const category = searchParams.get('category')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    let query = supabase
      .from('uploaded_files')
      .select('*')
      .order('uploaded_at', { ascending: false })

    if (userId) {
      query = query.eq('user_id', userId)
    }

    if (category) {
      query = query.eq('category', category)
    }

    // Apply pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Database error fetching files:', error)
      return NextResponse.json(
        { error: 'Failed to fetch files' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      files: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('💥 Error fetching files:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
