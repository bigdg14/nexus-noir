'use client'

import { useState, useEffect } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { UserPlus, X } from 'lucide-react'

interface SuggestedUser {
  id: string
  username: string
  displayName: string
  avatar?: string | null
  mutualFriends: number
}

export function FriendSuggestions() {
  const [suggestions, setSuggestions] = useState<SuggestedUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSuggestions()
  }, [])

  const fetchSuggestions = async () => {
    try {
      const response = await fetch('/api/users/suggestions?limit=5')
      if (response.ok) {
        const data = await response.json()
        setSuggestions(data.suggestions || [])
      } else {
        console.error('Failed to fetch suggestions')
        setSuggestions([])
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error)
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = async (userId: string) => {
    // Remove from suggestions list optimistically
    setSuggestions(prev => prev.filter(u => u.id !== userId))

    try {
      const response = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addresseeId: userId }),
      })

      if (!response.ok) {
        console.error('Failed to send friend request')
        // Optionally: Re-add the user to suggestions on failure
        fetchSuggestions()
      }
    } catch (error) {
      console.error('Error sending friend request:', error)
      // Optionally: Re-add the user to suggestions on failure
      fetchSuggestions()
    }
  }

  const handleDismiss = (userId: string) => {
    setSuggestions(prev => prev.filter(u => u.id !== userId))
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">People You May Know</h3>
        <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">Loading...</div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">People You May Know</h3>

      {suggestions.length === 0 ? (
        <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
          No suggestions at the moment
        </div>
      ) : (
        <div className="space-y-3">
          {suggestions.map((user) => {
            const initials = user.displayName
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()

            return (
              <div key={user.id} className="flex items-start space-x-3">
                <Avatar className="w-10 h-10 flex-shrink-0">
                  <AvatarImage src={user.avatar || undefined} />
                  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {user.displayName}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                        @{user.username}
                      </p>
                      {user.mutualFriends > 0 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {user.mutualFriends} mutual friend{user.mutualFriends !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDismiss(user.id)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-2"
                      title="Dismiss suggestion"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleConnect(user.id)}
                    className="mt-2 w-full"
                    variant="outline"
                  >
                    <UserPlus className="w-3 h-3 mr-1" />
                    Connect
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <a
        href="/friends#suggestions"
        className="block mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 text-sm text-blue-600 dark:text-yellow-500 hover:text-blue-700 dark:hover:text-yellow-400 font-medium text-center"
      >
        See all suggestions
      </a>
    </div>
  )
}
