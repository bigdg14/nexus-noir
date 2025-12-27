'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { MessageCircle, Repeat2, Bookmark, Share2 } from 'lucide-react'
import { formatCount } from '@/lib/utils'
import { useToast } from '@/contexts/toast-context'
import { RepostModal } from './repost-modal'

interface PostActionsProps {
  postId: string
  post: {
    id: string
    content: string
    author: {
      displayName: string
      username: string
      avatar?: string | null
    }
  }
  initialReactions: {
    love: number
    applaud: number
    salute: number
    shine: number
  }
  initialCommentCount: number
  initialRepostCount: number
  initialSaveCount: number
  userReactions: string[] // Array of reaction types the user has made
  hasReposted: boolean
  hasSaved: boolean
  onCommentClick: () => void
}

// Emoji variants for each reaction type
const reactionVariants = {
  love: [
    { variant: 'black', emoji: '🖤', label: 'Black Heart' },
    { variant: 'red', emoji: '❤️', label: 'Red Heart' },
    { variant: 'orange', emoji: '🧡', label: 'Orange Heart' },
    { variant: 'yellow', emoji: '💛', label: 'Yellow Heart' },
    { variant: 'purple', emoji: '💜', label: 'Purple Heart' },
    { variant: 'brown', emoji: '🤎', label: 'Brown Heart' },
  ],
  applaud: [
    { variant: 'dark', emoji: '👏🏿', label: 'Clap: Dark' },
    { variant: 'dark-medium', emoji: '👏🏾', label: 'Clap: Dark Medium' },
    { variant: 'medium', emoji: '👏🏽', label: 'Clap: Medium' },
    { variant: 'medium-light', emoji: '👏🏼', label: 'Clap: Medium Light' },
    { variant: 'light', emoji: '👏🏻', label: 'Clap: Light' },
    { variant: 'default', emoji: '👏', label: 'Clap: Default' },
  ],
  salute: [
    { variant: 'dark', emoji: '✊🏿', label: 'Fist: Dark' },
    { variant: 'dark-medium', emoji: '✊🏾', label: 'Fist: Dark Medium' },
    { variant: 'medium', emoji: '✊🏽', label: 'Fist: Medium' },
    { variant: 'medium-light', emoji: '✊🏼', label: 'Fist: Medium Light' },
    { variant: 'light', emoji: '✊🏻', label: 'Fist: Light' },
    { variant: 'default', emoji: '✊', label: 'Fist: Default' },
  ],
  shine: [
    { variant: 'star', emoji: '⭐', label: 'Star' },
    { variant: 'glowing', emoji: '🌟', label: 'Glowing Star' },
    { variant: 'sparkles', emoji: '✨', label: 'Sparkles' },
    { variant: 'dizzy', emoji: '💫', label: 'Dizzy' },
  ],
}

export function PostActions({
  postId,
  post,
  initialReactions,
  initialCommentCount,
  initialRepostCount,
  initialSaveCount,
  userReactions,
  hasReposted,
  hasSaved,
  onCommentClick,
}: PostActionsProps) {
  const { showToast } = useToast()
  const [reactions, setReactions] = useState(initialReactions)
  const [myReactions, setMyReactions] = useState<Set<string>>(new Set(userReactions))
  const [commentCount] = useState(initialCommentCount)
  const [repostCount, setRepostCount] = useState(initialRepostCount)
  const [saveCount, setSaveCount] = useState(initialSaveCount)
  const [reposted, setReposted] = useState(hasReposted)
  const [saved, setSaved] = useState(hasSaved)
  const [showVariants, setShowVariants] = useState<string | null>(null)
  const [showRepostModal, setShowRepostModal] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout>()

  const handleMouseEnter = (type: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      setShowVariants(type)
    }, 500) // Show variants after 500ms hover
  }

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      setShowVariants(null)
    }, 300)
  }

  const handleReaction = async (type: keyof typeof reactions, variant: string = 'default') => {
    const hadReaction = myReactions.has(type)
    const newMyReactions = new Set(myReactions)

    if (hadReaction) {
      newMyReactions.delete(type)
      setReactions((prev) => ({ ...prev, [type]: Math.max(0, prev[type] - 1) }))
    } else {
      newMyReactions.add(type)
      setReactions((prev) => ({ ...prev, [type]: prev[type] + 1 }))
    }

    setMyReactions(newMyReactions)
    setShowVariants(null)

    try {
      const response = await fetch(`/api/posts/${postId}/reactions`, {
        method: hadReaction ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: type.toUpperCase(), variant }),
      })

      if (!response.ok) {
        // Revert on error
        setMyReactions(myReactions)
        setReactions(initialReactions)
      }
    } catch (error) {
      // Revert on error
      setMyReactions(myReactions)
      setReactions(initialReactions)
    }
  }

  const handleRepostClick = () => {
    // If already reposted, undo it
    if (reposted) {
      handleRepost()
    } else {
      // Open modal to allow comment
      setShowRepostModal(true)
    }
  }

  const handleRepost = async (comment?: string) => {
    const newReposted = !reposted
    setReposted(newReposted)
    setRepostCount((prev) => (newReposted ? prev + 1 : Math.max(0, prev - 1)))

    try {
      const response = await fetch(`/api/posts/${postId}/repost`, {
        method: newReposted ? 'POST' : 'DELETE',
        headers: comment ? { 'Content-Type': 'application/json' } : {},
        body: comment ? JSON.stringify({ comment }) : undefined,
      })

      if (!response.ok) {
        setReposted(!newReposted)
        setRepostCount((prev) => (newReposted ? Math.max(0, prev - 1) : prev + 1))
        showToast('Failed to repost', 'error')
      } else if (newReposted) {
        showToast(comment ? 'Reposted with comment!' : 'Reposted!', 'success')
      }
    } catch (error) {
      setReposted(!newReposted)
      setRepostCount((prev) => (newReposted ? Math.max(0, prev - 1) : prev + 1))
      showToast('Failed to repost', 'error')
    }
  }

  const handleSave = async () => {
    const newSaved = !saved
    setSaved(newSaved)
    setSaveCount((prev) => (newSaved ? prev + 1 : Math.max(0, prev - 1)))

    try {
      const response = await fetch(`/api/posts/${postId}/save`, {
        method: newSaved ? 'POST' : 'DELETE',
      })

      if (!response.ok) {
        setSaved(!newSaved)
        setSaveCount((prev) => (newSaved ? Math.max(0, prev - 1) : prev + 1))
      }
    } catch (error) {
      setSaved(!newSaved)
      setSaveCount((prev) => (newSaved ? Math.max(0, prev - 1) : prev + 1))
    }
  }

  const handleShare = async () => {
    const postUrl = `${window.location.origin}/posts/${postId}`

    try {
      // Try to use native share API if available (mobile devices)
      if (navigator.share) {
        await navigator.share({
          title: 'Check out this post',
          url: postUrl,
        })
      } else {
        // Fallback: Copy to clipboard
        await navigator.clipboard.writeText(postUrl)
        showToast('Link copied to clipboard!', 'success')
      }
    } catch (error) {
      // User cancelled share or clipboard failed
      if ((error as Error).name !== 'AbortError') {
        console.error('Error sharing:', error)
        showToast('Failed to share post', 'error')
      }
    }
  }

  const totalReactions = Object.values(reactions).reduce((a, b) => a + b, 0)

  // Get the default emoji for each reaction type
  const getDefaultEmoji = (type: keyof typeof reactionVariants) => {
    const variants = reactionVariants[type]
    return variants[0].emoji // Return first variant as default
  }

  return (
    <div className="mt-4 space-y-3">
      {/* Reaction Buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        {Object.entries(reactionVariants).map(([type, variants]) => {
          const isActive = myReactions.has(type)
          const count = reactions[type as keyof typeof reactions]

          return (
            <div
              key={type}
              className="relative"
              onMouseEnter={() => handleMouseEnter(type)}
              onMouseLeave={handleMouseLeave}
            >
              <button
                type="button"
                onClick={() => handleReaction(type as keyof typeof reactions, variants[0].variant)}
                className={`
                  inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
                  transition-all duration-200 transform hover:scale-105
                  ${
                    isActive
                      ? 'bg-blue-100 dark:bg-yellow-900/30 text-blue-700 dark:text-yellow-400 ring-2 ring-blue-500 dark:ring-yellow-500'
                      : 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-700'
                  }
                `}
                title={type.charAt(0).toUpperCase() + type.slice(1)}
              >
                <span className="text-base">{getDefaultEmoji(type as keyof typeof reactionVariants)}</span>
                {count > 0 && <span>{formatCount(count)}</span>}
              </button>

              {/* Variant Picker */}
              {showVariants === type && (
                <div
                  className="absolute bottom-full left-0 mb-2 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2 z-50 flex gap-1"
                  onMouseEnter={() => {
                    if (timeoutRef.current) clearTimeout(timeoutRef.current)
                  }}
                  onMouseLeave={handleMouseLeave}
                >
                  {variants.map((v) => (
                    <button
                      key={v.variant}
                      type="button"
                      onClick={() => handleReaction(type as keyof typeof reactions, v.variant)}
                      className="text-2xl hover:scale-125 transition-transform p-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-700"
                      title={v.label}
                    >
                      {v.emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 md:gap-4 flex-wrap">
        <Button
          variant="ghost"
          size="sm"
          onClick={onCommentClick}
          className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-yellow-500 hover:bg-blue-50 dark:hover:bg-yellow-900/20 px-2 md:px-3"
        >
          <MessageCircle className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" />
          <span className="text-xs md:text-sm">{formatCount(commentCount)}</span>
          <span className="ml-1 text-xs md:text-sm hidden sm:inline">Comment</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleRepostClick}
          className={`px-2 md:px-3 ${
            reposted
              ? 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
              : 'text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
          }`}
        >
          <Repeat2 className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" />
          <span className="text-xs md:text-sm">{formatCount(repostCount)}</span>
          <span className="ml-1 text-xs md:text-sm hidden sm:inline">Repost</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleSave}
          className={`px-2 md:px-3 ${
            saved
              ? 'text-amber-600 dark:text-yellow-500 hover:bg-amber-50 dark:hover:bg-yellow-900/20'
              : 'text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-yellow-500 hover:bg-amber-50 dark:hover:bg-yellow-900/20'
          }`}
        >
          <Bookmark className={`w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2 ${saved ? 'fill-current' : ''}`} />
          <span className="text-xs md:text-sm hidden sm:inline">Save</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleShare}
          className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-yellow-500 hover:bg-blue-50 dark:hover:bg-yellow-900/20 px-2 md:px-3"
        >
          <Share2 className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" />
          <span className="text-xs md:text-sm hidden sm:inline">Share</span>
        </Button>
      </div>

      {/* Reaction Summary */}
      {totalReactions > 0 && (
        <div className="text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
          {totalReactions} {totalReactions === 1 ? 'reaction' : 'reactions'}
        </div>
      )}

      {/* Repost Modal */}
      {showRepostModal && (
        <RepostModal
          post={post}
          onClose={() => setShowRepostModal(false)}
          onRepost={handleRepost}
        />
      )}
    </div>
  )
}
