'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { PostCard } from '@/components/post/post-card'
import { CreatePost } from '@/components/post/create-post'
import { ProfileSummary } from '@/components/sidebar/profile-summary'
import { QuickNavigation } from '@/components/sidebar/quick-navigation'
import { FriendSuggestions } from '@/components/sidebar/friend-suggestions'
import { TrendingTopics } from '@/components/sidebar/trending-topics'
import { FloatingChatWidget } from '@/components/chat/floating-chat-widget'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface Post {
  id: string
  content: string
  mediaUrls: string[]
  mediaType: string
  likeCount: number
  commentCount: number
  repostCount: number
  saveCount: number
  hasLiked: boolean
  createdAt: string
  reactions: {
    love: number
    applaud: number
    salute: number
    shine: number
  }
  userReactions: string[]
  hasReposted: boolean
  hasSaved: boolean
  author: {
    id: string
    username: string
    displayName: string
    avatar?: string | null
  }
}

export default function FeedPage() {
  const { data: session, status } = useSession()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/signin')
    }
  }, [status])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchFeed()
    }
  }, [status])

  const fetchFeed = async () => {
    try {
      const response = await fetch('/api/feed?limit=20')
      const data = await response.json()
      setPosts(data.posts || [])
      setHasMore(!!data.nextCursor)
    } catch (error) {
      console.error('Error fetching feed:', error)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar - Hidden on mobile, shown on large screens */}
          <aside className="hidden lg:block lg:col-span-3 space-y-4">
            <ProfileSummary />
            <QuickNavigation />
          </aside>

          {/* Main Feed */}
          <main className="lg:col-span-6">
            <div className="mb-6">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Your Feed</h1>
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">See what your network is sharing</p>
            </div>

            <CreatePost onPostCreated={fetchFeed} />

            <div className="space-y-6">
              {posts.length === 0 ? (
                <div className="bg-white dark:bg-zinc-900 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-8 text-center">
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Your feed is empty. Start by creating your first post!
                  </p>
                </div>
              ) : (
                posts.map((post) => <PostCard key={post.id} post={post} />)
              )}
            </div>

            {hasMore && posts.length > 0 && (
              <div className="mt-6 text-center">
                <Button variant="outline">Load More</Button>
              </div>
            )}
          </main>

          {/* Right Sidebar - Hidden on mobile, shown on large screens */}
          <aside className="hidden lg:block lg:col-span-3 space-y-4">
            <FriendSuggestions />
            <TrendingTopics />
          </aside>
        </div>
      </div>

      {/* Floating Chat Widget */}
      <FloatingChatWidget />
    </>
  )
}
