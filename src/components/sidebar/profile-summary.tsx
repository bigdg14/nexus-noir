'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Users, UserPlus } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface UserStats {
  postCount: number
  friendCount: number
  followingCount: number
}

export function ProfileSummary() {
  const { data: session } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<UserStats>({
    postCount: 0,
    friendCount: 0,
    followingCount: 0,
  })

  const fetchUserStats = async () => {
    try {
      const response = await fetch('/api/users/me/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching user stats:', error)
    }
  }

  useEffect(() => {
    if (session?.user?.id) {
      fetchUserStats()
    }
  }, [session?.user?.id])

  useEffect(() => {
    // Listen for post creation events to refresh stats
    const handlePostCreated = () => {
      fetchUserStats()
    }

    window.addEventListener('postCreated', handlePostCreated)

    return () => {
      window.removeEventListener('postCreated', handlePostCreated)
    }
  }, [])

  if (!session?.user) return null

  const initials = session.user.displayName
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || 'U'

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header background */}
      <div className="h-16 bg-gradient-to-r from-blue-500 to-blue-600 dark:from-yellow-500 dark:to-amber-500" />

      {/* Profile section */}
      <div className="px-4 pb-4">
        <div className="flex flex-col items-center -mt-8">
          <Avatar className="w-16 h-16 border-4 border-white dark:border-zinc-900">
            <AvatarImage src={session.user.avatar || undefined} />
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>

          <h3 className="mt-2 font-semibold text-gray-900 dark:text-gray-100 text-center">
            {session.user.displayName}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">@{session.user.username}</p>
        </div>

        {/* Stats */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-around text-center">
            <div>
              <div className="font-semibold text-gray-900 dark:text-gray-100">{stats.postCount}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Posts</div>
            </div>
            <div>
              <div className="font-semibold text-gray-900 dark:text-gray-100">{stats.friendCount}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Friends</div>
            </div>
            <div>
              <div className="font-semibold text-gray-900 dark:text-gray-100">{stats.followingCount}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Following</div>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="mt-4 space-y-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={() => router.push('/profile')}
          >
            <Users className="w-4 h-4 mr-2" />
            View Profile
          </Button>
          <Link href="/friends#suggestions">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Find Friends
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
