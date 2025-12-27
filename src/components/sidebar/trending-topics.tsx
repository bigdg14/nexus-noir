'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { TrendingUp, Hash } from 'lucide-react'

interface TrendingHashtag {
  tag: string
  count: number
  mentions: number
}

export function TrendingTopics() {
  const router = useRouter()
  const [hashtags, setHashtags] = useState<TrendingHashtag[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTrendingData()
    // Refresh trending topics every 5 minutes
    const interval = setInterval(fetchTrendingData, 300000)
    return () => clearInterval(interval)
  }, [])

  const fetchTrendingData = async () => {
    try {
      const response = await fetch('/api/trending')
      if (response.ok) {
        const data = await response.json()
        setHashtags(data.hashtags || [])
      }
    } catch (error) {
      console.error('Error fetching trending data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCount = (count: number): string => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`
    }
    return count.toString()
  }

  const handleHashtagClick = (tag: string) => {
    router.push(`/explore?q=${encodeURIComponent('#' + tag)}`)
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Trending Topics</h3>
        <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">Loading...</div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center mb-4">
        <TrendingUp className="w-5 h-5 mr-2 text-blue-600 dark:text-yellow-500" />
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Trending Topics</h3>
      </div>

      <div className="space-y-3">
        {hashtags.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
            No trending topics yet
          </p>
        ) : (
          hashtags.slice(0, 5).map((hashtag, index) => (
            <button
              key={hashtag.tag}
              onClick={() => handleHashtagClick(hashtag.tag)}
              className="w-full text-left hover:bg-gray-50 dark:hover:bg-zinc-800 p-2 rounded-md transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                      #{index + 1}
                    </span>
                    <Hash className="w-3 h-3 text-blue-600 dark:text-yellow-500" />
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {hashtag.tag}
                    </span>
                    <TrendingUp className="w-3 h-3 text-green-500" />
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 ml-7">
                    {formatCount(hashtag.count)} post{hashtag.count !== 1 ? 's' : ''}
                    {hashtag.mentions > hashtag.count && ` · ${formatCount(hashtag.mentions)} mention${hashtag.mentions !== 1 ? 's' : ''}`}
                  </p>
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      <button
        onClick={() => router.push('/explore')}
        className="block w-full mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 text-sm text-blue-600 dark:text-yellow-500 hover:text-blue-700 dark:hover:text-yellow-400 font-medium text-center"
      >
        View all trending
      </button>
    </div>
  )
}
