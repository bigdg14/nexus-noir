'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { redirect, useSearchParams } from 'next/navigation'
import { PostCard } from '@/components/post/post-card'
import { Loader2, Search, TrendingUp, Hash, Sparkles } from 'lucide-react'

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
  engagementScore?: number
}

interface TrendingHashtag {
  tag: string
  count: number
  mentions: number
}

type TabType = 'trending' | 'latest' | 'hashtags'

export default function ExplorePage() {
  const { data: session, status } = useSession()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<TabType>('trending')
  const [searchQuery, setSearchQuery] = useState(searchParams?.get('q') || '')
  const [posts, setPosts] = useState<Post[]>([])
  const [hashtags, setHashtags] = useState<TrendingHashtag[]>([])
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/signin')
    }
  }, [status])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchTrendingData()
      if (searchParams?.get('q')) {
        handleSearch(searchParams.get('q') || '')
      }
    }
  }, [status, searchParams])

  const fetchTrendingData = async () => {
    try {
      const response = await fetch('/api/trending')
      if (response.ok) {
        const data = await response.json()
        setHashtags(data.hashtags || [])
        setPosts(data.posts || [])
      }
    } catch (error) {
      console.error('Error fetching trending data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      fetchTrendingData()
      return
    }

    setSearching(true)
    try {
      // Search for posts containing the query
      const response = await fetch('/api/feed?limit=50')
      if (response.ok) {
        const data = await response.json()
        const filtered = (data.posts || []).filter((post: Post) =>
          post.content.toLowerCase().includes(query.toLowerCase())
        )
        setPosts(filtered)
        setActiveTab('latest')
      }
    } catch (error) {
      console.error('Error searching posts:', error)
    } finally {
      setSearching(false)
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSearch(searchQuery)
  }

  const formatCount = (count: number): string => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`
    }
    return count.toString()
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const trendingPosts = posts.filter(p => p.engagementScore && p.engagementScore > 0)
  const latestPosts = [...posts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Sparkles className="w-6 h-6 md:w-8 md:h-8" />
            Explore
          </h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1">
            Discover trending content and popular hashtags
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search posts, hashtags, or keywords..."
              className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-yellow-500 focus:border-transparent"
            />
            {searching && (
              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-gray-400" />
            )}
          </div>
        </form>

        {/* Tabs */}
        <div className="bg-white dark:bg-zinc-900 border dark:border-gray-700 rounded-t-lg">
          <div className="flex border-b dark:border-gray-700">
            <button
              type="button"
              onClick={() => setActiveTab('trending')}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                activeTab === 'trending'
                  ? 'text-blue-600 dark:text-yellow-500 border-b-2 border-blue-600 dark:border-yellow-500'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <TrendingUp className="w-5 h-5 inline mr-2" />
              Trending
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('latest')}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                activeTab === 'latest'
                  ? 'text-blue-600 dark:text-yellow-500 border-b-2 border-blue-600 dark:border-yellow-500'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Sparkles className="w-5 h-5 inline mr-2" />
              Latest
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('hashtags')}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                activeTab === 'hashtags'
                  ? 'text-blue-600 dark:text-yellow-500 border-b-2 border-blue-600 dark:border-yellow-500'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Hash className="w-5 h-5 inline mr-2" />
              Hashtags
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-zinc-900 border-x border-b dark:border-gray-700 rounded-b-lg">
          {activeTab === 'trending' && (
            <div className="p-6">
              <div className="space-y-6">
                {trendingPosts.length === 0 ? (
                  <div className="text-center py-12">
                    <TrendingUp className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      No trending posts yet. Check back later!
                    </p>
                  </div>
                ) : (
                  trendingPosts.map((post) => <PostCard key={post.id} post={post} />)
                )}
              </div>
            </div>
          )}

          {activeTab === 'latest' && (
            <div className="p-6">
              <div className="space-y-6">
                {latestPosts.length === 0 ? (
                  <div className="text-center py-12">
                    <Sparkles className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      No posts found
                    </p>
                  </div>
                ) : (
                  latestPosts.map((post) => <PostCard key={post.id} post={post} />)
                )}
              </div>
            </div>
          )}

          {activeTab === 'hashtags' && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {hashtags.length === 0 ? (
                  <div className="col-span-2 text-center py-12">
                    <Hash className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      No trending hashtags yet
                    </p>
                  </div>
                ) : (
                  hashtags.map((hashtag, index) => (
                    <button
                      key={hashtag.tag}
                      type="button"
                      onClick={() => {
                        setSearchQuery('#' + hashtag.tag)
                        handleSearch('#' + hashtag.tag)
                      }}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors text-left"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 flex-shrink-0">
                              #{index + 1}
                            </span>
                            <Hash className="w-4 h-4 text-blue-600 dark:text-yellow-500 flex-shrink-0" />
                            <span className="font-bold text-base md:text-lg text-gray-900 dark:text-gray-100 break-words">
                              {hashtag.tag}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <span className="whitespace-nowrap">{formatCount(hashtag.count)} posts</span>
                            {hashtag.mentions > hashtag.count && (
                              <span className="whitespace-nowrap">{formatCount(hashtag.mentions)} mentions</span>
                            )}
                          </div>
                        </div>
                        <TrendingUp className="w-5 h-5 text-green-500 flex-shrink-0" />
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
