'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Upload, 
  File, 
  Image, 
  FileText, 
  Music, 
  Video, 
  X, 
  Download,
  AlertCircle,
  CheckCircle,
  Loader2
} from "lucide-react"
import { toast } from "sonner"

export interface FileUploadProps {
  category?: 'images' | 'documents' | 'csv' | 'audio' | 'video'
  userId?: string
  maxFiles?: number
  onUploadComplete?: (files: UploadedFile[]) => void
  onUploadError?: (error: string) => void
  className?: string
}

export interface UploadedFile {
  id: string
  filename: string
  originalName: string
  size: number
  type: string
  category: string
  url: string
  uploadedAt: string
}

interface UploadProgress {
  file: File
  progress: number
  status: 'uploading' | 'completed' | 'error'
  error?: string
  result?: UploadedFile
}

const FILE_TYPE_ICONS = {
  'image/': Image,
  'application/pdf': FileText,
  'text/': FileText,
  'audio/': Music,
  'video/': Video,
  'default': File
}

const FILE_CONFIGS = {
  images: {
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    maxSize: 5 * 1024 * 1024, // 5MB
    description: 'Images (JPG, PNG, GIF, WebP) - Max 5MB'
  },
  documents: {
    extensions: ['.pdf', '.doc', '.docx', '.txt'],
    maxSize: 10 * 1024 * 1024, // 10MB
    description: 'Documents (PDF, DOC, DOCX, TXT) - Max 10MB'
  },
  csv: {
    extensions: ['.csv'],
    maxSize: 2 * 1024 * 1024, // 2MB
    description: 'CSV files - Max 2MB'
  },
  audio: {
    extensions: ['.mp3', '.wav', '.m4a', '.webm'],
    maxSize: 50 * 1024 * 1024, // 50MB
    description: 'Audio files (MP3, WAV, M4A, WebM) - Max 50MB'
  },
  video: {
    extensions: ['.mp4', '.webm', '.mov'],
    maxSize: 100 * 1024 * 1024, // 100MB
    description: 'Video files (MP4, WebM, MOV) - Max 100MB'
  }
}

export default function FileUpload({
  category = 'documents',
  userId,
  maxFiles = 5,
  onUploadComplete,
  onUploadError,
  className = ''
}: FileUploadProps) {
  const [uploads, setUploads] = useState<UploadProgress[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const config = FILE_CONFIGS[category]

  const validateFile = (file: File): string | null => {
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
    
    if (!config.extensions.includes(fileExtension)) {
      return `Invalid file type. Allowed: ${config.extensions.join(', ')}`
    }
    
    if (file.size > config.maxSize) {
      return `File too large. Maximum size: ${config.maxSize / (1024 * 1024)}MB`
    }
    
    return null
  }

  const uploadFile = async (file: File): Promise<UploadedFile> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('category', category)
    if (userId) formData.append('user_id', userId)
    formData.append('metadata', JSON.stringify({
      originalName: file.name,
      uploadedBy: userId || 'anonymous'
    }))

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    })

    const result = await response.json()

    if (!result.success) {
      throw new Error(result.error || 'Upload failed')
    }

    return result.file
  }

  const handleFiles = useCallback(async (files: FileList) => {
    const fileArray = Array.from(files)
    
    // Check max files limit
    if (uploads.length + fileArray.length > maxFiles) {
      const error = `Maximum ${maxFiles} files allowed`
      toast.error(error)
      onUploadError?.(error)
      return
    }

    // Validate files
    const validFiles: File[] = []
    for (const file of fileArray) {
      const error = validateFile(file)
      if (error) {
        toast.error(`${file.name}: ${error}`)
        onUploadError?.(error)
        continue
      }
      validFiles.push(file)
    }

    if (validFiles.length === 0) return

    // Initialize upload progress
    const newUploads: UploadProgress[] = validFiles.map(file => ({
      file,
      progress: 0,
      status: 'uploading'
    }))

    setUploads(prev => [...prev, ...newUploads])

    // Upload files
    const uploadPromises = validFiles.map(async (file, index) => {
      try {
        // Simulate progress
        const uploadIndex = uploads.length + index
        
        // Update progress periodically
        const progressInterval = setInterval(() => {
          setUploads(prev => prev.map((upload, i) => 
            i === uploadIndex && upload.status === 'uploading'
              ? { ...upload, progress: Math.min(upload.progress + 10, 90) }
              : upload
          ))
        }, 200)

        const result = await uploadFile(file)
        
        clearInterval(progressInterval)
        
        // Update with completion
        setUploads(prev => prev.map((upload, i) => 
          i === uploadIndex
            ? { ...upload, progress: 100, status: 'completed', result }
            : upload
        ))

        toast.success(`${file.name} uploaded successfully`)

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Upload failed'
        
        setUploads(prev => prev.map((upload, i) => 
          i === uploads.length + index
            ? { ...upload, status: 'error', error: errorMessage }
            : upload
        ))

        toast.error(`${file.name}: ${errorMessage}`)
        onUploadError?.(errorMessage)
      }
    })

    // Wait for all uploads to complete
    await Promise.allSettled(uploadPromises)

    // Call completion callback with successful uploads
    const completedFiles = uploads
      .filter(upload => upload.status === 'completed' && upload.result)
      .map(upload => upload.result!)
    
    if (completedFiles.length > 0) {
      onUploadComplete?.(completedFiles)
    }
  }, [uploads, maxFiles, category, userId, onUploadComplete, onUploadError])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files)
    }
  }, [handleFiles])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const removeUpload = (index: number) => {
    setUploads(prev => prev.filter((_, i) => i !== index))
  }

  const getFileIcon = (type: string) => {
    const IconComponent = Object.entries(FILE_TYPE_ICONS).find(([key]) => 
      type.startsWith(key)
    )?.[1] || FILE_TYPE_ICONS.default
    
    return IconComponent
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            File Upload
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium mb-2">
              Drop files here or click to browse
            </p>
            <p className="text-sm text-gray-500 mb-4">
              {config.description}
            </p>
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
            >
              Select Files
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={config.extensions.join(',')}
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
              className="hidden"
            />
          </div>

          {/* Upload Progress */}
          {uploads.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium">Upload Progress</h4>
              {uploads.map((upload, index) => {
                const IconComponent = getFileIcon(upload.file.type)
                
                return (
                  <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                    <IconComponent className="h-8 w-8 text-gray-500 flex-shrink-0" />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium truncate">
                          {upload.file.name}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            upload.status === 'completed' ? 'default' :
                            upload.status === 'error' ? 'destructive' : 'secondary'
                          }>
                            {upload.status === 'uploading' && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                            {upload.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                            {upload.status === 'error' && <AlertCircle className="h-3 w-3 mr-1" />}
                            {upload.status}
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeUpload(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{formatFileSize(upload.file.size)}</span>
                        {upload.result && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2"
                            onClick={() => window.open(upload.result!.url, '_blank')}
                          >
                            <Download className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        )}
                      </div>
                      
                      {upload.status === 'uploading' && (
                        <Progress value={upload.progress} className="mt-2" />
                      )}
                      
                      {upload.error && (
                        <Alert className="mt-2">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{upload.error}</AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Upload Limits Info */}
          <div className="text-xs text-gray-500 space-y-1">
            <p>• Maximum {maxFiles} files per upload</p>
            <p>• {config.description}</p>
            <p>• Files are stored securely and can be accessed via direct links</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
