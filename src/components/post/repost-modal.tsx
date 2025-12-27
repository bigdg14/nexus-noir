'use client'

import { useState } from 'react'
import { X, Repeat2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface RepostModalProps {
  post: {
    id: string
    content: string
    author: {
      displayName: string
      username: string
      avatar?: string | null
    }
  }
  onClose: () => void
  onRepost: (comment?: string) => Promise<void>
}

export function RepostModal({ post, onClose, onRepost }: RepostModalProps) {
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleRepost = async (withComment: boolean) => {
    setIsSubmitting(true)
    try {
      await onRepost(withComment && comment.trim() ? comment.trim() : undefined)
      onClose()
    } catch (error) {
      console.error('Error reposting:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const initials = post.author.displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Repost
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Comment Input */}
          <div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment... (optional)"
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-yellow-500 resize-none"
              rows={3}
              maxLength={500}
            />
            {comment.length > 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                {comment.length}/500
              </p>
            )}
          </div>

          {/* Original Post Preview */}
          <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-zinc-800">
            <div className="flex items-start space-x-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={post.author.avatar || undefined} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {post.author.displayName}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    @{post.author.username}
                  </p>
                </div>
                <p className="text-gray-700 dark:text-gray-300 mt-1 line-clamp-3">
                  {post.content}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={() => handleRepost(false)}
            disabled={isSubmitting}
            variant="outline"
            className="gap-2"
          >
            <Repeat2 className="w-4 h-4" />
            Repost
          </Button>
          <Button
            onClick={() => handleRepost(true)}
            disabled={isSubmitting || !comment.trim()}
            className="gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-yellow-500 dark:hover:bg-yellow-600 dark:text-black"
          >
            <Repeat2 className="w-4 h-4" />
            {comment.trim() ? 'Repost with Comment' : 'Add Comment to Repost'}
          </Button>
        </div>
      </div>
    </div>
  )
}
