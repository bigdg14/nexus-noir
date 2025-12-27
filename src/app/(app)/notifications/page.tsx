'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { redirect, useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Loader2, Heart, MessageCircle, UserPlus, Repeat2, UserCheck } from 'lucide-react'

interface User {
  id: string
  username: string
  displayName: string
  avatar?: string | null
}

interface Notification {
  id: string
  type: string
  actorId?: string | null
  postId?: string | null
  message?: string | null
  read: boolean
  createdAt: string
  actor?: User | null
}

type NotificationFilter = 'all' | 'unread' | 'mentions'

export default function NotificationsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<NotificationFilter>('all')
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/signin')
    }
  }, [status])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchNotifications()
    }
  }, [status])

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications?limit=50')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
      })

      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
      })

      setNotifications(prev =>
        prev.map(notif => ({ ...notif, read: true }))
      )
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id)
    }

    // Navigate based on notification type
    if (notification.postId) {
      router.push(`/posts/${notification.postId}`)
    } else if (notification.actor) {
      router.push(`/profile/${notification.actor.username}`)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'POST_LIKE':
      case 'POST_REACTION':
        return <Heart className="w-5 h-5 text-red-500" />
      case 'POST_COMMENT':
        return <MessageCircle className="w-5 h-5 text-blue-500 dark:text-yellow-500" />
      case 'FRIEND_REQUEST':
        return <UserPlus className="w-5 h-5 text-green-500" />
      case 'FRIEND_ACCEPT':
        return <UserCheck className="w-5 h-5 text-green-500" />
      case 'FOLLOW':
        return <UserPlus className="w-5 h-5 text-blue-500 dark:text-yellow-500" />
      case 'POST_REPOST':
        return <Repeat2 className="w-5 h-5 text-green-500" />
      case 'MESSAGE':
        return <MessageCircle className="w-5 h-5 text-blue-500 dark:text-yellow-500" />
      default:
        return null
    }
  }

  const getNotificationText = (notification: Notification) => {
    const actorName = notification.actor?.displayName || 'Someone'

    switch (notification.type) {
      case 'POST_LIKE':
        return `${actorName} liked your post`
      case 'POST_COMMENT':
        return `${actorName} commented on your post`
      case 'FRIEND_REQUEST':
        return `${actorName} sent you a friend request`
      case 'FRIEND_ACCEPT':
        return `${actorName} accepted your friend request`
      case 'FOLLOW':
        return `${actorName} started following you`
      case 'POST_REPOST':
        return `${actorName} reposted your post`
      case 'MESSAGE':
        return notification.message || `${actorName} sent you a message`
      default:
        return notification.message || 'New notification'
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = (now.getTime() - date.getTime()) / 1000

    if (diffInSeconds < 60) {
      return 'Just now'
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `${minutes}m ago`
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return `${hours}h ago`
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400)
      return `${days}d ago`
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'unread') return !notif.read
    if (filter === 'mentions') return notif.type === 'POST_COMMENT'
    return true
  })

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              onClick={markAllAsRead}
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-yellow-500 dark:text-yellow-500 dark:hover:bg-yellow-900/20"
            >
              Mark all as read
            </Button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="bg-white dark:bg-zinc-900 border dark:border-gray-700 rounded-t-lg">
          <div className="flex border-b dark:border-gray-700">
            <button
              onClick={() => setFilter('all')}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                filter === 'all'
                  ? 'text-blue-600 dark:text-yellow-500 border-b-2 border-blue-600 dark:border-yellow-500'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                filter === 'unread'
                  ? 'text-blue-600 dark:text-yellow-500 border-b-2 border-blue-600 dark:border-yellow-500'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Unread {unreadCount > 0 && `(${unreadCount})`}
            </button>
            <button
              onClick={() => setFilter('mentions')}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                filter === 'mentions'
                  ? 'text-blue-600 dark:text-yellow-500 border-b-2 border-blue-600 dark:border-yellow-500'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Mentions
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white dark:bg-zinc-900 border-x border-b dark:border-gray-700 rounded-b-lg divide-y dark:divide-gray-700">
          {filteredNotifications.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-600 dark:text-gray-400">
                {filter === 'unread' ? 'No unread notifications' : filter === 'mentions' ? 'No mentions yet' : 'No notifications yet'}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => {
              const initials = notification.actor?.displayName
                ?.split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase() || '?'

              return (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full p-4 flex items-start gap-4 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors text-left ${
                    !notification.read ? 'bg-blue-50/50 dark:bg-yellow-900/10' : ''
                  }`}
                >
                  {/* Avatar */}
                  {notification.actor && (
                    <Avatar className="w-12 h-12 flex-shrink-0">
                      <AvatarImage src={notification.actor.avatar || undefined} />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                  )}

                  {/* Icon (if no actor) */}
                  {!notification.actor && (
                    <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-gray-100 dark:bg-zinc-800 rounded-full">
                      {getNotificationIcon(notification.type)}
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-gray-900 dark:text-gray-100">
                        {getNotificationText(notification)}
                      </p>
                      {!notification.read && (
                        <span className="w-2 h-2 bg-blue-600 dark:bg-yellow-500 rounded-full flex-shrink-0 mt-2" />
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {formatTime(notification.createdAt)}
                    </p>
                  </div>

                  {/* Type Icon */}
                  <div className="flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
