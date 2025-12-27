'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { CommentSection } from './comment-section'
import { PostActions } from './post-actions'
import { ImageLightbox } from './image-lightbox'
import { formatDate } from '@/lib/utils'

interface PostCardProps {
  post: {
    id: string
    content: string
    mediaUrls: string[]
    mediaType: string
    likeCount: number
    commentCount: number
    repostCount?: number
    saveCount?: number
    hasLiked: boolean
    createdAt: string
    reactions?: {
      love: number
      applaud: number
      salute: number
      shine: number
    }
    userReactions?: string[]
    hasReposted?: boolean
    hasSaved?: boolean
    author: {
      id: string
      username: string
      displayName: string
      avatar?: string | null
    }
  }
  onLike?: (postId: string, liked: boolean) => void
}

export function PostCard({ post }: PostCardProps) {
  const [commentCount, setCommentCount] = useState(post.commentCount)
  const [showComments, setShowComments] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const initials = post.author.displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  const handleImageClick = (index: number) => {
    setCurrentImageIndex(index)
    setLightboxOpen(true)
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-start space-x-3">
        <Link href={`/users/${post.author.id}`}>
          <Avatar className="w-12 h-12">
            <AvatarImage src={post.author.avatar || undefined} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <Link
                href={`/users/${post.author.id}`}
                className="font-semibold text-gray-900 dark:text-gray-100 hover:underline block truncate"
              >
                {post.author.displayName}
              </Link>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">@{post.author.username}</p>
            </div>
            <span className="text-xs md:text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">{formatDate(post.createdAt)}</span>
          </div>

          <div className="mt-3">
            <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{post.content}</p>

            {post.mediaUrls.length > 0 && (
              <div className={`mt-3 grid gap-2 ${post.mediaUrls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                {post.mediaUrls.map((url, index) => (
                  <div key={index} className={`relative rounded-lg overflow-hidden ${post.mediaUrls.length === 1 ? 'aspect-[16/10]' : 'aspect-video'}`}>
                    {post.mediaType === 'IMAGE' ? (
                      <button
                        type="button"
                        onClick={() => handleImageClick(index)}
                        className="relative w-full h-full cursor-pointer hover:opacity-90 transition-opacity"
                        aria-label={`View image ${index + 1}`}
                      >
                        <Image
                          src={url}
                          alt="Post media"
                          fill
                          className="object-cover"
                        />
                      </button>
                    ) : (
                      <video
                        src={url}
                        controls
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <PostActions
            postId={post.id}
            post={{
              id: post.id,
              content: post.content,
              author: {
                displayName: post.author.displayName,
                username: post.author.username,
                avatar: post.author.avatar,
              },
            }}
            initialReactions={
              post.reactions || { love: 0, applaud: 0, salute: 0, shine: 0 }
            }
            initialCommentCount={commentCount}
            initialRepostCount={post.repostCount || 0}
            initialSaveCount={post.saveCount || 0}
            userReactions={post.userReactions || []}
            hasReposted={post.hasReposted || false}
            hasSaved={post.hasSaved || false}
            onCommentClick={() => setShowComments(!showComments)}
          />

          <CommentSection
            postId={post.id}
            commentCount={commentCount}
            showComments={showComments}
            onToggleComments={() => setShowComments(!showComments)}
            onCommentAdded={() => setCommentCount(prev => prev + 1)}
          />
        </div>
      </div>

      {/* Image Lightbox */}
      {lightboxOpen && post.mediaType === 'IMAGE' && (
        <ImageLightbox
          images={post.mediaUrls}
          currentIndex={currentImageIndex}
          onClose={() => setLightboxOpen(false)}
          onNavigate={(index) => setCurrentImageIndex(index)}
        />
      )}
    </div>
  )
}
