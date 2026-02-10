'use client'

import React from "react"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, Search, Plus, ArrowLeft } from 'lucide-react'

interface Conversation {
  id: string
  username: string
  display_name: string
  last_message: string
  last_message_time: string
  unread_count: number
  avatar_color: string
}

interface Message {
  id: string
  sender_id: string
  recipient_id: string
  content: string
  created_at: string
  is_read: boolean
}

const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'user1',
    username: 'algo_expert',
    display_name: 'Algorithm Expert',
    last_message: 'That binary search solution was perfect!',
    last_message_time: '2 min ago',
    unread_count: 1,
    avatar_color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'user2',
    username: 'code_warrior',
    display_name: 'Code Warrior',
    last_message: 'Want to do a mock contest together?',
    last_message_time: '15 min ago',
    unread_count: 2,
    avatar_color: 'from-purple-500 to-pink-500',
  },
  {
    id: 'user3',
    username: 'learning_dev',
    display_name: 'Learning Dev',
    last_message: 'Thanks for the DP tutorial!',
    last_message_time: '1 hour ago',
    unread_count: 0,
    avatar_color: 'from-green-500 to-emerald-500',
  },
  {
    id: 'user4',
    username: 'dev_showcase',
    display_name: 'Dev Showcase',
    last_message: 'Check out my new portfolio!',
    last_message_time: '3 hours ago',
    unread_count: 0,
    avatar_color: 'from-orange-500 to-red-500',
  },
]

export default function MessagesPage() {
  const [user, setUser] = useState<any>(null)
  const [conversations, setConversations] = useState<Conversation[]>(MOCK_CONVERSATIONS)
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(MOCK_CONVERSATIONS[0])
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (!authUser) {
        router.push('/auth/login')
        return
      }

      setUser(authUser)
      setLoading(false)
    }

    checkAuth()
  }, [router, supabase])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConversation || !user) return

    // Mock message
    const message: Message = {
      id: Math.random().toString(),
      sender_id: user.id,
      recipient_id: selectedConversation.id,
      content: newMessage,
      created_at: new Date().toISOString(),
      is_read: false,
    }

    setMessages([...messages, message])
    setNewMessage('')
  }

  const filteredConversations = conversations.filter((conv) =>
    conv.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.username.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const MOCK_MESSAGES: Message[] = [
    {
      id: '1',
      sender_id: selectedConversation?.id || 'user1',
      recipient_id: user?.id || 'me',
      content: 'Hey! How are you doing with your competitive programming journey?',
      created_at: '2024-01-15T10:00:00Z',
      is_read: true,
    },
    {
      id: '2',
      sender_id: user?.id || 'me',
      recipient_id: selectedConversation?.id || 'user1',
      content: 'Great! Just solved a few problems on LeetCode. How about you?',
      created_at: '2024-01-15T10:05:00Z',
      is_read: true,
    },
    {
      id: '3',
      sender_id: selectedConversation?.id || 'user1',
      recipient_id: user?.id || 'me',
      content: 'That binary search solution was perfect!',
      created_at: '2024-01-15T10:10:00Z',
      is_read: true,
    },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading messages...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Navigation */}
      <nav className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-slate-400 hover:text-white flex items-center text-sm transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Back</span>
            </Link>
            <Link href="/dashboard" className="text-2xl font-bold bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 bg-clip-text text-transparent">
              INSPHERE
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
                Dashboard
              </Button>
            </Link>
            <Link href="/community">
              <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
                Community
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Chat Interface */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 h-[calc(100vh-120px)] flex gap-4">
        {/* Conversations Sidebar */}
        <div className="w-full md:w-80 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-lg flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-slate-700">
            <h2 className="text-xl font-bold text-white mb-3">Messages</h2>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>
            <Button size="sm" className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm">
              <Plus className="w-4 h-4 mr-2" />
              New Chat
            </Button>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto space-y-1 p-3">
            {filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => {
                  setSelectedConversation(conv)
                  setMessages(MOCK_MESSAGES)
                }}
                className={`w-full p-3 rounded-lg text-left transition ${selectedConversation?.id === conv.id
                  ? 'bg-gradient-to-r from-purple-600/50 to-pink-600/50 border border-purple-400/50'
                  : 'hover:bg-slate-700'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${conv.avatar_color} flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{conv.display_name}</p>
                    <p className="text-xs text-slate-400 truncate">{conv.last_message}</p>
                  </div>
                  {conv.unread_count > 0 && (
                    <span className="flex-shrink-0 bg-pink-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {conv.unread_count}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="hidden md:flex flex-1 flex-col bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-lg overflow-hidden">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-700 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${selectedConversation.avatar_color}`} />
                <div>
                  <p className="font-medium text-white">{selectedConversation.display_name}</p>
                  <p className="text-xs text-slate-400">@{selectedConversation.username}</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {(messages.length > 0 ? messages : MOCK_MESSAGES).map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${msg.sender_id === user?.id
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                        : 'bg-slate-700 text-slate-100'
                        }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <p className={`text-xs mt-1 ${msg.sender_id === user?.id ? 'text-purple-100' : 'text-slate-400'}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input */}
              <div className="p-4 border-t border-slate-700">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
                  />
                  <Button type="submit" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-4">
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-slate-400">Select a conversation to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
