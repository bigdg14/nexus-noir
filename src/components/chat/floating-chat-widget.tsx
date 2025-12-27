'use client'

import { useEffect, useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { MessageCircle, X, Send, Minimize2, Loader2, Plus, Search } from 'lucide-react'

interface User {
  id: string
  username: string
  displayName: string
  avatar?: string | null
}

interface Message {
  id: string
  content: string
  senderId: string
  read: boolean
  createdAt: string
  sender: User
}

interface Conversation {
  id: string
  participant: User
  lastMessage: Message | null
  unreadCount: number
  lastMessageAt: string
}

export function FloatingChatWidget() {
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [messageContent, setMessageContent] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [totalUnread, setTotalUnread] = useState(0)
  const [showNewChat, setShowNewChat] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (session?.user?.id) {
      fetchConversations()
      const interval = setInterval(fetchConversations, 10000) // Poll every 10 seconds
      return () => clearInterval(interval)
    }
  }, [session])

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation)
      markAsRead(selectedConversation)
    }
  }, [selectedConversation])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const total = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0)
    setTotalUnread(total)
  }, [conversations])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/conversations')
      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations || [])
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
    }
  }

  const fetchMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const markAsRead = async (conversationId: string) => {
    try {
      await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'PATCH',
      })

      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId
            ? { ...conv, unreadCount: 0 }
            : conv
        )
      )
    } catch (error) {
      console.error('Error marking messages as read:', error)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!messageContent.trim() || !selectedConversation) return

    setSendingMessage(true)
    try {
      const response = await fetch(`/api/conversations/${selectedConversation}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: messageContent }),
      })

      if (response.ok) {
        const data = await response.json()
        setMessages(prev => [...prev, data.message])
        setMessageContent('')
        fetchConversations()
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSendingMessage(false)
    }
  }

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setSearchLoading(true)
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`)
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.users || [])
      }
    } catch (error) {
      console.error('Error searching users:', error)
    } finally {
      setSearchLoading(false)
    }
  }

  const startConversationWithUser = async (userId: string) => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId: userId }),
      })

      if (response.ok) {
        const data = await response.json()
        await fetchConversations()
        setSelectedConversation(data.conversation.id)
        setShowNewChat(false)
        setSearchQuery('')
        setSearchResults([])
      }
    } catch (error) {
      console.error('Error creating conversation:', error)
    }
  }

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    } else if (diffInHours < 168) {
      return date.toLocaleDateString('en-US', { weekday: 'short' })
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  useEffect(() => {
    if (searchQuery) {
      const debounce = setTimeout(() => {
        searchUsers(searchQuery)
      }, 300)
      return () => clearTimeout(debounce)
    } else {
      setSearchResults([])
    }
  }, [searchQuery])

  if (!session?.user?.id) return null

  const selectedConv = conversations.find(c => c.id === selectedConversation)

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 p-4 bg-blue-600 dark:bg-yellow-500 text-white dark:text-black rounded-full shadow-lg hover:scale-110 transition-transform"
        >
          <MessageCircle className="w-6 h-6" />
          {totalUnread > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
              {totalUnread > 9 ? '9+' : totalUnread}
            </span>
          )}
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 bg-white dark:bg-zinc-900 border dark:border-gray-700 rounded-lg shadow-2xl overflow-hidden flex flex-col"
          style={{
            width: isMinimized ? '320px' : '400px',
            height: isMinimized ? '60px' : '600px',
            transition: 'all 0.3s ease'
          }}
        >
          {/* Header */}
          <div className="p-4 bg-blue-600 dark:bg-yellow-500 text-white dark:text-black flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              <h3 className="font-semibold">
                {showNewChat ? 'New Chat' : selectedConv ? selectedConv.participant.displayName : 'Messages'}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {(selectedConv || showNewChat) && (
                <button
                  onClick={() => {
                    setSelectedConversation(null)
                    setShowNewChat(false)
                    setSearchQuery('')
                    setSearchResults([])
                  }}
                  className="hover:bg-blue-700 dark:hover:bg-yellow-600 p-1 rounded"
                  title="Back to conversations"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="hover:bg-blue-700 dark:hover:bg-yellow-600 p-1 rounded"
                title={isMinimized ? 'Maximize' : 'Minimize'}
              >
                <Minimize2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  setIsOpen(false)
                  setIsMinimized(false)
                  setSelectedConversation(null)
                  setShowNewChat(false)
                }}
                className="hover:bg-blue-700 dark:hover:bg-yellow-600 p-1 rounded"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          {!isMinimized && (
            <>
              {showNewChat ? (
                /* New Chat - User Search */
                <div className="flex-1 overflow-y-auto flex flex-col">
                  {/* Search Input */}
                  <div className="p-3 border-b dark:border-gray-700">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search users..."
                        className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-yellow-500 focus:border-transparent"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Search Results */}
                  <div className="flex-1 overflow-y-auto">
                    {searchLoading ? (
                      <div className="flex items-center justify-center p-8">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-500 dark:text-yellow-500" />
                      </div>
                    ) : searchResults.length === 0 && searchQuery ? (
                      <div className="p-8 text-center text-gray-600 dark:text-gray-400 text-sm">
                        No users found
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div className="p-8 text-center text-gray-600 dark:text-gray-400 text-sm">
                        Search for users to start a conversation
                      </div>
                    ) : (
                      searchResults.map((user) => {
                        const initials = user.displayName
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()

                        return (
                          <button
                            key={user.id}
                            onClick={() => startConversationWithUser(user.id)}
                            className="w-full p-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors border-b dark:border-gray-700"
                          >
                            <Avatar className="w-10 h-10 flex-shrink-0">
                              <AvatarImage src={user.avatar || undefined} />
                              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                            </Avatar>

                            <div className="flex-1 min-w-0 text-left">
                              <h4 className="font-semibold text-gray-900 dark:text-gray-100 truncate text-sm">
                                {user.displayName}
                              </h4>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                @{user.username}
                              </p>
                            </div>
                          </button>
                        )
                      })
                    )}
                  </div>
                </div>
              ) : !selectedConversation ? (
                /* Conversations List */
                <div className="flex-1 overflow-y-auto flex flex-col">
                  {/* New Chat Button */}
                  <div className="p-3 border-b dark:border-gray-700">
                    <button
                      onClick={() => setShowNewChat(true)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 dark:bg-yellow-500 text-white dark:text-black rounded-lg hover:bg-blue-700 dark:hover:bg-yellow-600 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="font-medium text-sm">New Chat</span>
                    </button>
                  </div>

                  {/* Conversations */}
                  <div className="flex-1 overflow-y-auto">
                    {conversations.length === 0 ? (
                      <div className="p-8 text-center text-gray-600 dark:text-gray-400 text-sm">
                        No conversations yet
                      </div>
                    ) : (
                      conversations.map((conv) => {
                      const initials = conv.participant.displayName
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()

                      return (
                        <button
                          key={conv.id}
                          onClick={() => setSelectedConversation(conv.id)}
                          className="w-full p-3 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors border-b dark:border-gray-700"
                        >
                          <Avatar className="w-10 h-10 flex-shrink-0">
                            <AvatarImage src={conv.participant.avatar || undefined} />
                            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0 text-left">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-semibold text-gray-900 dark:text-gray-100 truncate text-sm">
                                {conv.participant.displayName}
                              </h4>
                              {conv.lastMessage && (
                                <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                                  {formatMessageTime(conv.lastMessage.createdAt)}
                                </span>
                              )}
                            </div>
                            {conv.lastMessage && (
                              <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
                                {conv.lastMessage.content}
                              </p>
                            )}
                            {conv.unreadCount > 0 && (
                              <span className="inline-block mt-1 px-2 py-0.5 text-xs font-semibold text-white bg-blue-600 dark:bg-yellow-500 dark:text-black rounded-full">
                                {conv.unreadCount}
                              </span>
                            )}
                          </div>
                        </button>
                      )
                    })
                  )}
                  </div>
                </div>
              ) : (
                /* Chat Interface */
                <>
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-3 bg-gray-50 dark:bg-black space-y-3">
                    {messages.map((message) => {
                      const isOwnMessage = message.senderId === session?.user?.id
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                              isOwnMessage
                                ? 'bg-blue-600 dark:bg-yellow-500 text-white dark:text-black'
                                : 'bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 border dark:border-gray-700'
                            }`}
                          >
                            <p className="break-words">{message.content}</p>
                            <p
                              className={`text-xs mt-1 ${
                                isOwnMessage
                                  ? 'text-blue-100 dark:text-black/70'
                                  : 'text-gray-500 dark:text-gray-400'
                              }`}
                            >
                              {formatMessageTime(message.createdAt)}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <form onSubmit={sendMessage} className="p-3 border-t dark:border-gray-700">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={messageContent}
                        onChange={(e) => setMessageContent(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-yellow-500 focus:border-transparent"
                        disabled={sendingMessage}
                      />
                      <Button
                        type="submit"
                        disabled={!messageContent.trim() || sendingMessage}
                        className="rounded-full px-3 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-yellow-500 dark:hover:bg-yellow-600 dark:text-black"
                        size="sm"
                      >
                        {sendingMessage ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </form>
                </>
              )}
            </>
          )}
        </div>
      )}
    </>
  )
}
