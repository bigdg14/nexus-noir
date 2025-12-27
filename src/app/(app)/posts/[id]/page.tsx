'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/layout/navbar'
import { PostCard } from '@/components/post/post-card'
import { Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface Post {
  id: string
  content: string
  mediaUrls: string[]
  mediaType: string
  createdAt: string
  author: {
    id: string
    username: string
    displayName: string
    avatar?: string | null
  }
  reactions: {
    love: number
    applaud: number
    salute: number
    shine: number
  }
  userReactions: string[]
  commentCount: number
  repostCount: number
  saveCount: number
  hasReposted: boolean
  hasSaved: boolean
  hasLiked: boolean
  likeCount: number
}

export default function PostDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await fetch(`/api/posts/${params.id}`)

        if (!response.ok) {
          if (response.status === 404) {
            setError('Post not found')
          } else {
            setError('Failed to load post')
          }
          return
        }

        const data = await response.json()
        setPost(data)
      } catch (err) {
        console.error('Error fetching post:', err)
        setError('Failed to load post')
      } finally {
        setLoading(false)
      }
    }

    fetchPost()
  }, [params.id])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <Navbar />

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="mb-4">
          <Link href="/feed">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Feed
            </Button>
          </Link>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 dark:text-yellow-500" />
          </div>
        )}

        {error && (
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <Button onClick={() => router.push('/feed')} variant="outline">
              Go to Feed
            </Button>
          </div>
        )}

        {!loading && !error && post && (
          <PostCard post={post} />
        )}
      </main>
    </div>
  )
}
