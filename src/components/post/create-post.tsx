'use client'

import { useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Image as ImageIcon, Video as VideoIcon, Loader2, X } from 'lucide-react'
import Image from 'next/image'

interface CreatePostProps {
  onPostCreated?: () => void
}

export function CreatePost({ onPostCreated }: CreatePostProps) {
  const { data: session } = useSession()
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mediaFiles, setMediaFiles] = useState<File[]>([])
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([])
  const [mediaType, setMediaType] = useState<'NONE' | 'IMAGE' | 'VIDEO'>('NONE')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!session?.user) return null

  const initials = session.user.displayName
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || 'U'

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'IMAGE' | 'VIDEO') => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // Validate file types
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo']
    const allowedTypes = type === 'IMAGE' ? allowedImageTypes : allowedVideoTypes

    const validFiles = files.filter(file => allowedTypes.includes(file.type))
    if (validFiles.length === 0) {
      const fileTypes = files.map(f => f.type).join(', ')
      console.log('Invalid file types:', fileTypes)
      setError(`Please select valid ${type.toLowerCase()} files. Selected: ${fileTypes}`)
      return
    }

    // Validate file sizes
    const maxSize = type === 'IMAGE' ? 10 * 1024 * 1024 : 50 * 1024 * 1024 // 10MB for images, 50MB for videos
    const oversizedFiles = validFiles.filter(file => file.size > maxSize)
    if (oversizedFiles.length > 0) {
      setError(`File size must be less than ${type === 'IMAGE' ? '10MB' : '50MB'}`)
      return
    }

    // Limit to 4 images or 1 video
    if (type === 'IMAGE' && validFiles.length > 4) {
      setError('You can upload up to 4 images')
      return
    }
    if (type === 'VIDEO' && validFiles.length > 1) {
      setError('You can upload only 1 video')
      return
    }

    setMediaFiles(validFiles)
    setMediaType(type)
    setError('')

    // Create previews
    const previews: string[] = []
    validFiles.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        previews.push(reader.result as string)
        if (previews.length === validFiles.length) {
          setMediaPreviews(previews)
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const handleRemoveMedia = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index))
    setMediaPreviews(prev => prev.filter((_, i) => i !== index))
    if (mediaFiles.length === 1) {
      setMediaType('NONE')
    }
  }

  const handleRemoveAllMedia = () => {
    setMediaFiles([])
    setMediaPreviews([])
    setMediaType('NONE')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const uploadMediaFiles = async (): Promise<string[]> => {
    const uploadedUrls: string[] = []

    for (const file of mediaFiles) {
      try {
        // Get presigned URL
        const presignedResponse = await fetch('/api/upload/presigned', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type,
            uploadType: 'post',
          }),
        })

        if (!presignedResponse.ok) {
          throw new Error('Failed to get upload URL')
        }

        const { uploadUrl, fileUrl } = await presignedResponse.json()

        // Upload to S3
        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type,
          },
        })

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload file')
        }

        uploadedUrls.push(fileUrl)
      } catch (error) {
        console.error('Error uploading file:', error)
        throw error
      }
    }

    return uploadedUrls
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Allow posting if there's either content or media files
    if (!content.trim() && mediaFiles.length === 0) return

    setLoading(true)
    setUploading(true)
    setError('')

    try {
      // Upload media files if any
      let mediaUrls: string[] = []
      if (mediaFiles.length > 0) {
        try {
          mediaUrls = await uploadMediaFiles()
        } catch (error) {
          throw new Error('Failed to upload media files')
        }
      }

      // Create post with media URLs
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content.trim() || '', // Allow empty content if media is present
          mediaUrls,
          mediaType,
          privacyLevel: 'PUBLIC',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create post')
      }

      // Reset form
      setContent('')
      handleRemoveAllMedia()

      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('postCreated'))

      if (onPostCreated) {
        onPostCreated()
      }
    } catch (err) {
      setError('Failed to create post. Please try again.')
      console.error('Error creating post:', err)
    } finally {
      setLoading(false)
      setUploading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4 mb-6">
      <div className="flex items-start space-x-3">
        <Avatar className="w-10 h-10">
          <AvatarImage src={session.user.avatar || undefined} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>

        <form onSubmit={handleSubmit} className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-yellow-500 focus:border-transparent"
            rows={3}
            maxLength={5000}
            disabled={loading}
          />

          {error && (
            <div className="mt-2 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Media Preview */}
          {mediaPreviews.length > 0 && (
            <div className="mt-3 relative">
              <div className={`grid gap-2 ${mediaPreviews.length === 1 ? 'grid-cols-1' : mediaPreviews.length === 2 ? 'grid-cols-2' : 'grid-cols-2'}`}>
                {mediaPreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    {mediaType === 'IMAGE' ? (
                      <div className={`relative w-full rounded-lg overflow-hidden bg-gray-100 dark:bg-zinc-800 ${mediaPreviews.length === 1 ? 'h-96' : 'h-48'}`}>
                        <Image
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <video
                        src={preview}
                        className={`w-full rounded-lg object-cover bg-gray-100 dark:bg-zinc-800 ${mediaPreviews.length === 1 ? 'h-96' : 'h-48'}`}
                        controls
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveMedia(index)}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                      aria-label={`Remove ${mediaType.toLowerCase()} ${index + 1}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={handleRemoveAllMedia}
                className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
              >
                Remove all media
              </button>
            </div>
          )}

          {/* Hidden file inputs */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            aria-label="Upload media files"
          />

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.accept = 'image/jpeg,image/jpg,image/png,image/gif,image/webp'
                    fileInputRef.current.multiple = true
                    fileInputRef.current.onchange = (e: Event) => {
                      const target = e.target as HTMLInputElement
                      handleMediaSelect({ target } as React.ChangeEvent<HTMLInputElement>, 'IMAGE')
                    }
                    fileInputRef.current.click()
                  }
                }}
                className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading || mediaType === 'VIDEO'}
                title="Upload images (up to 4)"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.accept = 'video/mp4,video/webm,video/quicktime'
                    fileInputRef.current.multiple = false
                    fileInputRef.current.onchange = (e: Event) => {
                      const target = e.target as HTMLInputElement
                      handleMediaSelect({ target } as React.ChangeEvent<HTMLInputElement>, 'VIDEO')
                    }
                    fileInputRef.current.click()
                  }
                }}
                className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading || mediaType === 'IMAGE'}
                title="Upload video (max 1)"
              >
                <VideoIcon className="w-5 h-5" />
              </button>
              {mediaFiles.length > 0 && (
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {mediaFiles.length} {mediaType.toLowerCase()}{mediaFiles.length > 1 ? 's' : ''} selected
                </span>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading || (content.trim() === '' && mediaFiles.length === 0)}
              size="sm"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Posting...
                </>
              ) : (
                'Post'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
