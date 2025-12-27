'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { redirect, useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Loader2, Search, Users, UserPlus, UserMinus, X, Check, MessageCircle } from 'lucide-react'

interface User {
  id: string
  username: string
  displayName: string
  avatar?: string | null
  profession?: string | null
}

interface Friend extends User {
  friendshipId: string
  friendSince: string
}

interface FriendRequest {
  id: string
  createdAt: string
  requester: User
  addressee: User
}

interface SuggestedUser {
  id: string
  username: string
  displayName: string
  avatar?: string | null
  profession?: string | null
  mutualFriends: number
}

type TabType = 'all' | 'requests' | 'suggestions'

export default function FriendsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [friends, setFriends] = useState<Friend[]>([])
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([])
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([])
  const [suggestions, setSuggestions] = useState<SuggestedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/signin')
    }
  }, [status])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchFriends()
      fetchFriendRequests()
      fetchSuggestions()
    }
  }, [status])

  useEffect(() => {
    // Check URL hash to set initial tab
    const hash = window.location.hash.slice(1) as TabType
    if (hash === 'suggestions' || hash === 'requests' || hash === 'all') {
      setActiveTab(hash)
    }
  }, [])

  const fetchFriends = async () => {
    try {
      const response = await fetch('/api/friends')
      if (response.ok) {
        const data = await response.json()
        setFriends(data || [])
      }
    } catch (error) {
      console.error('Error fetching friends:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchFriendRequests = async () => {
    try {
      const response = await fetch('/api/friends/requests')
      if (response.ok) {
        const data = await response.json()
        setReceivedRequests(data.received || [])
        setSentRequests(data.sent || [])
      }
    } catch (error) {
      console.error('Error fetching friend requests:', error)
    }
  }

  const fetchSuggestions = async () => {
    try {
      const response = await fetch('/api/users/suggestions?limit=20')
      if (response.ok) {
        const data = await response.json()
        setSuggestions(data.suggestions || [])
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error)
    }
  }

  const removeFriend = async (friendshipId: string) => {
    if (!confirm('Are you sure you want to remove this friend?')) return

    setProcessingId(friendshipId)
    try {
      const response = await fetch(`/api/friends/${friendshipId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setFriends(prev => prev.filter(f => f.friendshipId !== friendshipId))
      }
    } catch (error) {
      console.error('Error removing friend:', error)
    } finally {
      setProcessingId(null)
    }
  }

  const acceptRequest = async (requestId: string) => {
    setProcessingId(requestId)
    try {
      const response = await fetch(`/api/friends/requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'accept' }),
      })

      if (response.ok) {
        setReceivedRequests(prev => prev.filter(r => r.id !== requestId))
        fetchFriends() // Refresh friends list
      }
    } catch (error) {
      console.error('Error accepting request:', error)
    } finally {
      setProcessingId(null)
    }
  }

  const rejectRequest = async (requestId: string) => {
    setProcessingId(requestId)
    try {
      const response = await fetch(`/api/friends/requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject' }),
      })

      if (response.ok) {
        setReceivedRequests(prev => prev.filter(r => r.id !== requestId))
      }
    } catch (error) {
      console.error('Error rejecting request:', error)
    } finally {
      setProcessingId(null)
    }
  }

  const cancelRequest = async (requestId: string) => {
    setProcessingId(requestId)
    try {
      const response = await fetch(`/api/friends/requests/${requestId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setSentRequests(prev => prev.filter(r => r.id !== requestId))
      }
    } catch (error) {
      console.error('Error canceling request:', error)
    } finally {
      setProcessingId(null)
    }
  }

  const sendFriendRequest = async (userId: string) => {
    setProcessingId(userId)
    try {
      const response = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addresseeId: userId }),
      })

      if (response.ok) {
        setSuggestions(prev => prev.filter(s => s.id !== userId))
        fetchFriendRequests() // Refresh to show sent request
      }
    } catch (error) {
      console.error('Error sending friend request:', error)
    } finally {
      setProcessingId(null)
    }
  }

  const dismissSuggestion = (userId: string) => {
    setSuggestions(prev => prev.filter(s => s.id !== userId))
  }

  const startConversation = async (userId: string) => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId: userId }),
      })

      if (response.ok) {
        router.push('/messages')
      }
    } catch (error) {
      console.error('Error starting conversation:', error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }

  const filteredFriends = friends.filter(friend =>
    friend.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.username.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Users className="w-6 h-6 md:w-8 md:h-8" />
            Friends
          </h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1">
            {friends.length} friend{friends.length !== 1 ? 's' : ''}
            {receivedRequests.length > 0 && ` • ${receivedRequests.length} pending request${receivedRequests.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-zinc-900 border dark:border-gray-700 rounded-t-lg">
          <div className="flex border-b dark:border-gray-700">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                activeTab === 'all'
                  ? 'text-blue-600 dark:text-yellow-500 border-b-2 border-blue-600 dark:border-yellow-500'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              All Friends ({friends.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('requests')}
              className={`flex-1 px-6 py-4 font-semibold transition-colors relative ${
                activeTab === 'requests'
                  ? 'text-blue-600 dark:text-yellow-500 border-b-2 border-blue-600 dark:border-yellow-500'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Requests
              {receivedRequests.length > 0 && (
                <span className="ml-2 inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-red-500 rounded-full">
                  {receivedRequests.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('suggestions')}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                activeTab === 'suggestions'
                  ? 'text-blue-600 dark:text-yellow-500 border-b-2 border-blue-600 dark:border-yellow-500'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Suggestions ({suggestions.length})
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-zinc-900 border-x border-b dark:border-gray-700 rounded-b-lg">
          {activeTab === 'all' && (
            <>
              {/* Search Bar */}
              <div className="p-4 border-b dark:border-gray-700">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search friends..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-yellow-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Friends List */}
              <div className="divide-y dark:divide-gray-700">
                {filteredFriends.length === 0 ? (
                  <div className="p-12 text-center">
                    <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      {searchQuery ? 'No friends found matching your search' : 'No friends yet'}
                    </p>
                  </div>
                ) : (
                  filteredFriends.map((friend) => {
                    const initials = friend.displayName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()

                    return (
                      <div key={friend.id} className="p-4 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
                        <div className="flex items-center gap-4">
                          <Avatar className="w-14 h-14 flex-shrink-0 cursor-pointer" onClick={() => router.push(`/profile/${friend.username}`)}>
                            <AvatarImage src={friend.avatar || undefined} />
                            <AvatarFallback>{initials}</AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-yellow-500 cursor-pointer" onClick={() => router.push(`/profile/${friend.username}`)}>
                              {friend.displayName}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">@{friend.username}</p>
                            {friend.profession && (
                              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">{friend.profession}</p>
                            )}
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                              Friends since {formatDate(friend.friendSince)}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() => startConversation(friend.id)}
                              variant="outline"
                              size="sm"
                              className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-yellow-500 dark:text-yellow-500 dark:hover:bg-yellow-900/20"
                            >
                              <MessageCircle className="w-4 h-4 mr-2" />
                              Message
                            </Button>
                            <Button
                              onClick={() => removeFriend(friend.friendshipId)}
                              disabled={processingId === friend.friendshipId}
                              variant="outline"
                              size="sm"
                              className="border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              {processingId === friend.friendshipId ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <UserMinus className="w-4 h-4 mr-2" />
                                  Remove
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </>
          )}

          {activeTab === 'suggestions' && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {suggestions.length === 0 ? (
                  <div className="col-span-2 p-12 text-center">
                    <UserPlus className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">No friend suggestions at the moment</p>
                  </div>
                ) : (
                  suggestions.map((user) => {
                    const initials = user.displayName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()

                    return (
                      <div key={user.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
                        <div className="flex items-start gap-3">
                          <Avatar className="w-12 h-12 flex-shrink-0 cursor-pointer" onClick={() => router.push(`/profile/${user.username}`)}>
                            <AvatarImage src={user.avatar || undefined} />
                            <AvatarFallback>{initials}</AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-yellow-500 cursor-pointer truncate" onClick={() => router.push(`/profile/${user.username}`)}>
                                  {user.displayName}
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">@{user.username}</p>
                                {user.profession && (
                                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-1 truncate">{user.profession}</p>
                                )}
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {user.mutualFriends > 0
                                    ? `${user.mutualFriends} mutual friend${user.mutualFriends !== 1 ? 's' : ''}`
                                    : 'No mutual friends'
                                  }
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => dismissSuggestion(user.id)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-2"
                                title="Dismiss suggestion"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>

                            <Button
                              onClick={() => sendFriendRequest(user.id)}
                              disabled={processingId === user.id}
                              size="sm"
                              className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-yellow-500 dark:hover:bg-yellow-600 dark:text-black"
                            >
                              {processingId === user.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <UserPlus className="w-4 h-4 mr-2" />
                                  Connect
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}

          {activeTab === 'requests' && (
            <div className="divide-y dark:divide-gray-700">
              {/* Received Requests */}
              {receivedRequests.length > 0 && (
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Received Requests ({receivedRequests.length})
                  </h3>
                  <div className="space-y-4">
                    {receivedRequests.map((request) => {
                      const initials = request.requester.displayName
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()

                      return (
                        <div key={request.id} className="flex items-center gap-4 p-4 bg-blue-50 dark:bg-yellow-900/10 rounded-lg">
                          <Avatar className="w-12 h-12 flex-shrink-0 cursor-pointer" onClick={() => router.push(`/profile/${request.requester.username}`)}>
                            <AvatarImage src={request.requester.avatar || undefined} />
                            <AvatarFallback>{initials}</AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-yellow-500 cursor-pointer" onClick={() => router.push(`/profile/${request.requester.username}`)}>
                              {request.requester.displayName}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">@{request.requester.username}</p>
                            {request.requester.profession && (
                              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">{request.requester.profession}</p>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() => acceptRequest(request.id)}
                              disabled={processingId === request.id}
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 dark:bg-yellow-500 dark:hover:bg-yellow-600 dark:text-black"
                            >
                              {processingId === request.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <Check className="w-4 h-4 mr-2" />
                                  Accept
                                </>
                              )}
                            </Button>
                            <Button
                              onClick={() => rejectRequest(request.id)}
                              disabled={processingId === request.id}
                              variant="outline"
                              size="sm"
                              className="border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <X className="w-4 h-4 mr-2" />
                              Decline
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Sent Requests */}
              {sentRequests.length > 0 && (
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Sent Requests ({sentRequests.length})
                  </h3>
                  <div className="space-y-4">
                    {sentRequests.map((request) => {
                      const initials = request.addressee.displayName
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()

                      return (
                        <div key={request.id} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg">
                          <Avatar className="w-12 h-12 flex-shrink-0 cursor-pointer" onClick={() => router.push(`/profile/${request.addressee.username}`)}>
                            <AvatarImage src={request.addressee.avatar || undefined} />
                            <AvatarFallback>{initials}</AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-yellow-500 cursor-pointer" onClick={() => router.push(`/profile/${request.addressee.username}`)}>
                              {request.addressee.displayName}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">@{request.addressee.username}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Pending</p>
                          </div>

                          <Button
                            onClick={() => cancelRequest(request.id)}
                            disabled={processingId === request.id}
                            variant="outline"
                            size="sm"
                          >
                            {processingId === request.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              'Cancel Request'
                            )}
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {receivedRequests.length === 0 && sentRequests.length === 0 && (
                <div className="p-12 text-center">
                  <UserPlus className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">No pending friend requests</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
