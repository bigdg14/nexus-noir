'use client'

import { useEffect, useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Loader2, Send } from 'lucide-react'

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

export default function MessagesPage() {
  const { data: session, status } = useSession()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [messageContent, setMessageContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [sendingMessage, setSendingMessage] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/signin')
    }
  }, [status])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchConversations()
    }
  }, [status])

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation)
      markAsRead(selectedConversation)
    }
  }, [selectedConversation])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

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
    } finally {
      setLoading(false)
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

      // Update local conversation unread count
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

        // Update conversation list
        fetchConversations()
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSendingMessage(false)
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

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const selectedConv = conversations.find(c => c.id === selectedConversation)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">Messages</h1>

        <div className="bg-white dark:bg-zinc-900 border dark:border-gray-700 rounded-lg shadow-lg overflow-hidden flex" style={{ height: 'calc(100vh - 200px)' }}>
          {/* Conversations List */}
          <div className="w-full md:w-1/3 border-r dark:border-gray-700 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-8 text-center text-gray-600 dark:text-gray-400">
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
                    className={`w-full p-4 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors border-b dark:border-gray-700 ${
                      selectedConversation === conv.id ? 'bg-blue-50 dark:bg-yellow-900/20' : ''
                    }`}
                  >
                    <Avatar className="w-12 h-12 flex-shrink-0">
                      <AvatarImage src={conv.participant.avatar || undefined} />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                          {conv.participant.displayName}
                        </h3>
                        {conv.lastMessage && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                            {formatMessageTime(conv.lastMessage.createdAt)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        @{conv.participant.username}
                      </p>
                      {conv.lastMessage && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 truncate mt-1">
                          {conv.lastMessage.content}
                        </p>
                      )}
                      {conv.unreadCount > 0 && (
                        <div className="mt-2">
                          <span className="inline-block px-2 py-1 text-xs font-semibold text-white bg-blue-600 dark:bg-yellow-500 dark:text-black rounded-full">
                            {conv.unreadCount} new
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                )
              })
            )}
          </div>

          {/* Chat Interface */}
          <div className="flex-1 flex flex-col">
            {!selectedConversation ? (
              <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400 px-4 text-center">
                <p className="text-sm md:text-base">Select a conversation to start messaging</p>
              </div>
            ) : (
              <>
                {/* Chat Header */}
                {selectedConv && (
                  <div className="p-4 border-b dark:border-gray-700 bg-white dark:bg-zinc-900">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={selectedConv.participant.avatar || undefined} />
                        <AvatarFallback>
                          {selectedConv.participant.displayName
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                          {selectedConv.participant.displayName}
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          @{selectedConv.participant.username}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-black space-y-4">
                  {messages.map((message) => {
                    const isOwnMessage = message.senderId === session?.user?.id
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg px-4 py-2 ${
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
                <form onSubmit={sendMessage} className="p-4 border-t dark:border-gray-700 bg-white dark:bg-zinc-900">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-yellow-500 focus:border-transparent"
                      disabled={sendingMessage}
                    />
                    <Button
                      type="submit"
                      disabled={!messageContent.trim() || sendingMessage}
                      className="rounded-full px-6 bg-blue-600 hover:bg-blue-700 dark:bg-yellow-500 dark:hover:bg-yellow-600 dark:text-black"
                    >
                      {sendingMessage ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </Button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
