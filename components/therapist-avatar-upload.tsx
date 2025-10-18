'use client'

import { useState, useEffect } from 'react'
import { uploadTherapistAvatar } from '@/app/therapist/profile/actions'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Camera, Upload, X, Loader2 } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'

interface TherapistAvatarUploadProps {
  avatarUrl: string | null
  displayName: string
  isEditing: boolean
  onUploadComplete?: (url: string) => void
}

export default function TherapistAvatarUpload({ 
  avatarUrl, 
  displayName,
  isEditing,
  onUploadComplete 
}: TherapistAvatarUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [avatarVersion, setAvatarVersion] = useState(0)
  const { toast } = useToast()
  const router = useRouter()

  // Update version when avatar URL changes (for cache busting)
  useEffect(() => {
    if (avatarUrl) {
      setAvatarVersion(prev => prev + 1)
    }
  }, [avatarUrl])

  // Cache-busted avatar URL
  const avatarUrlWithCacheBust = avatarUrl 
    ? `${avatarUrl}?v=${avatarVersion}`
    : null

  const displayUrl = previewUrl || avatarUrlWithCacheBust

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a JPEG, PNG, or WebP image.',
        variant: 'destructive',
      })
      return
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      toast({
        title: 'File too large',
        description: 'Please upload an image smaller than 5MB.',
        variant: 'destructive',
      })
      return
    }

    // Set preview
    setPendingFile(file)
    const preview = URL.createObjectURL(file)
    setPreviewUrl(preview)

    toast({
      title: 'Image selected',
      description: 'Click "Upload Avatar" to save your new profile picture.',
    })
  }

  const handleUpload = async () => {
    if (!pendingFile) {
      toast({
        title: 'No image selected',
        description: 'Please select an image first.',
        variant: 'destructive',
      })
      return
    }

    try {
      setUploading(true)

      const formData = new FormData()
      formData.append('avatar', pendingFile)

      const result = await uploadTherapistAvatar(formData)

      if (result.success) {
        toast({
          title: 'Success',
          description: result.message || 'Avatar uploaded successfully!',
        })

        // Clean up
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl)
        }
        setPreviewUrl(null)
        setPendingFile(null)

        // Callback if provided
        if (onUploadComplete && result.imageUrl) {
          onUploadComplete(result.imageUrl)
        }

        // Force router refresh to get new data
        router.refresh()
      } else {
        throw new Error(result.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload avatar',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
    }
  }

  const handleCancel = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(null)
    setPendingFile(null)
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        {displayUrl ? (
          <div className="relative w-24 h-24" key={avatarVersion}>
            <Avatar className="w-24 h-24">
              <AvatarImage 
                src={displayUrl} 
                alt={displayName}
                key={avatarVersion}
                className="object-cover"
              />
              <AvatarFallback className="text-2xl">
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {previewUrl && (
              <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full px-2 py-0.5 text-xs font-medium">
                New
              </div>
            )}
            {isEditing && pendingFile && (
              <button
                type="button"
                onClick={handleCancel}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        ) : (
          <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
            <Camera className="h-8 w-8 text-gray-400" />
          </div>
        )}
      </div>

      {isEditing && (
        <div className="flex flex-col gap-2">
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
            id="avatar-upload"
            disabled={uploading}
          />
          <label
            htmlFor="avatar-upload"
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer disabled:opacity-50"
          >
            <Upload className="h-4 w-4" />
            Select Image
          </label>
          
          {pendingFile && (
            <Button
              type="button"
              onClick={handleUpload}
              disabled={uploading}
              size="sm"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Avatar
                </>
              )}
            </Button>
          )}
          
          <p className="text-xs text-gray-500">
            JPEG, PNG, WebP up to 5MB
          </p>
        </div>
      )}
    </div>
  )
}

