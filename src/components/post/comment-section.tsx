'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'

interface Comment {
  id: string
  content: string
  createdAt: string
  author: {
    id: string
    username: string
    displayName: string
    avatar?: string | null
  }
}

interface CommentSectionProps {
  postId: string
  commentCount: number
  showComments: boolean
  onToggleComments: () => void
  onCommentAdded?: () => void
}

export function CommentSection({ postId, commentCount, showComments, onToggleComments, onCommentAdded }: CommentSectionProps) {
  const { data: session } = useSession()
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const loadComments = async () => {
    if (comments.length > 0) return // Already loaded

    setLoading(true)
    try {
      const response = await fetch(`/api/posts/${postId}/comments`)
      const data = await response.json()
      setComments(data.comments || [])
    } catch (error) {
      console.error('Error loading comments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleShowComments = async () => {
    if (!showComments) {
      await loadComments()
    }
    onToggleComments()
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !session) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newComment.trim(),
        }),
      })

      if (response.ok) {
        const comment = await response.json()
        setComments([comment, ...comments])
        setNewComment('')
        if (onCommentAdded) {
          onCommentAdded()
        }
      }
    } catch (error) {
      console.error('Error posting comment:', error)
    } finally {
      setSubmitting(false)
    }
  }

  if (!session) return null

  const userInitials = session.user?.displayName
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || 'U'

  return (
    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
      <button
        onClick={handleShowComments}
        className="text-sm text-gray-600 hover:text-gray-900 font-medium"
      >
        {showComments ? 'Hide' : 'View'} {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
      </button>

      {showComments && (
        <div className="mt-4 space-y-4">
          {/* Comments list */}
          {loading ? (
            <div className="text-center text-gray-500 text-sm py-4">
              Loading comments...
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center text-gray-500 text-sm py-4">
              No comments yet. Be the first to comment!
            </div>
          ) : (
            <div className="space-y-3 mb-4">
              {comments.map((comment) => {
                const commentInitials = comment.author.displayName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()

                return (
                  <div key={comment.id} className="flex items-start space-x-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={comment.author.avatar || undefined} />
                      <AvatarFallback className="text-xs">{commentInitials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 bg-gray-100 rounded-lg px-3 py-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm">{comment.author.displayName}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(comment.createdAt)}</span>
                      </div>
                      <p className="text-sm text-gray-900 mt-1">{comment.content}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Add comment form */}
          <form onSubmit={handleSubmitComment} className="flex items-start space-x-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <Avatar className="w-8 h-8">
              <AvatarImage src={session.user?.avatar || undefined} />
              <AvatarFallback className="text-xs">{userInitials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={submitting}
              />
              <div className="mt-2 flex justify-end">
                <Button
                  type="submit"
                  size="sm"
                  disabled={submitting || !newComment.trim()}
                >
                  {submitting ? 'Posting...' : 'Comment'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
