'use client'

import React, { Suspense, useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, Search, Plus, ArrowLeft, MessageCircle, Loader2, Image as ImageIcon, X } from 'lucide-react'
import { toast } from 'sonner'

interface Conversation {
  id: string
  username: string
  display_name: string
  avatar_url?: string
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
  image_url?: string
  created_at: string
  is_read: boolean
}

function MessagesContent() {
  const [user, setUser] = useState<any>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sending, setSending] = useState(false)

  // Image Upload State
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const router = useRouter()
  const searchParams = useSearchParams()
  const targetUserId = searchParams.get('userId')
  const supabase = createClient()
  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, imagePreview])

  // 1. Auth & Initial Load
  useEffect(() => {
    const checkAuthAndLoad = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        router.push('/auth/login')
        return
      }
      setUser(authUser)

      // Fetch friends to build conversation list
      // Friends are where status = 'accepted' AND (sender_id = me OR receiver_id = me)
      const { data: requests, error } = await supabase
        .from('friend_requests')
        .select(`
          id,
          sender_id,
          receiver_id,
          sender:profiles!sender_id(id, username, display_name, avatar_url),
          receiver:profiles!receiver_id(id, username, display_name, avatar_url)
        `)
        .eq('status', 'accepted')
        .or(`sender_id.eq.${authUser.id},receiver_id.eq.${authUser.id}`)

      if (requests) {
        // Fetch unread counts
        const { data: unreadData } = await supabase
          .from('messages')
          .select('sender_id')
          .eq('recipient_id', authUser.id)
          .eq('is_read', false)

        const unreadCounts: Record<string, number> = {}
        unreadData?.forEach((msg: any) => {
          unreadCounts[msg.sender_id] = (unreadCounts[msg.sender_id] || 0) + 1
        })

        const formattedConversations: Conversation[] = requests.map((req: any) => {
          const isSender = req.sender_id === authUser.id
          const friendProfile = isSender ? req.receiver : req.sender
          // Generate a deterministic color based on ID
          const colors = ['from-blue-500 to-cyan-500', 'from-purple-500 to-pink-500', 'from-green-500 to-emerald-500', 'from-orange-500 to-red-500', 'from-yellow-500 to-orange-500']
          const colorIndex = friendProfile.id.charCodeAt(0) % colors.length

          return {
            id: friendProfile.id,
            username: friendProfile.username,
            display_name: friendProfile.display_name,
            avatar_url: friendProfile.avatar_url,
            last_message: 'Start chatting', // Todo: fetch last message
            last_message_time: '',
            unread_count: unreadCounts[friendProfile.id] || 0,
            avatar_color: colors[colorIndex]
          }
        })
        setConversations(formattedConversations)

        // If URL has userId, select that conversation
        if (targetUserId) {
          const target = formattedConversations.find(c => c.id === targetUserId)
          if (target) setSelectedConversation(target)
        } else if (formattedConversations.length > 0 && !selectedConversation) {
          // Optional: Select first one by default? No, let user choose.
        }
      }
      setLoading(false)
    }

    checkAuthAndLoad()
  }, [router, supabase, targetUserId])

  // 2. Fetch Messages when Conversation Selected
  useEffect(() => {
    if (!selectedConversation || !user) return

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${selectedConversation.id}),and(sender_id.eq.${selectedConversation.id},recipient_id.eq.${user.id})`)
        .order('created_at', { ascending: true })

      if (data) {
        setMessages(data)

        // Mark as read
        const unreadIds = data.filter(m => m.sender_id === selectedConversation.id && !m.is_read).map(m => m.id)
        if (unreadIds.length > 0) {
          await supabase
            .from('messages')
            .update({ is_read: true })
            .in('id', unreadIds)

          // Update local state to clear badge
          setConversations(prev => prev.map(c => {
            if (c.id === selectedConversation.id) {
              return { ...c, unread_count: 0 }
            }
            return c
          }))
        }
      }
    }

    fetchMessages()

    // 3. Realtime Subscription
    const channel = supabase
      .channel('messages_channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${user.id}`,
        },
        (payload) => {
          const newMsg = payload.new as Message
          // If message is from current conversation, append it
          // Use ref to check current selected, or rely on closure (selectedConversation is in dep array)
          if (selectedConversation && newMsg.sender_id === selectedConversation.id) {
            setMessages(prev => [...prev, newMsg])

            // Mark as read immediately since we are looking at it
            supabase
              .from('messages')
              .update({ is_read: true })
              .eq('id', newMsg.id)
              .then(({ error }) => {
                if (error) console.error("Failed to mark RT message read", error)
              })

          } else {
            // Increment unread count for that conversation
            setConversations(prev => prev.map(c => {
              if (c.id === newMsg.sender_id) {
                return { ...c, unread_count: c.unread_count + 1 }
              }
              return c
            }))
          }
        }

      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${user.id}`,
        },
        (payload) => {
          // Also listen to my own sent messages if sent from another tab/device
          const newMsg = payload.new as Message
          if (newMsg.recipient_id === selectedConversation.id) {
            // Check if we already added it optimistically to avoid dupe? 
            // For simplicity, we can rely on optimism or dedupe by ID.
            setMessages(prev => {
              if (prev.some(m => m.id === newMsg.id)) return prev
              return [...prev, newMsg]
            })
          }
        }
      )
      .subscribe((status) => {
        console.log("Realtime Message Subscription Status:", status)
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedConversation, user, supabase])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB")
      return
    }

    setSelectedImage(file)
    const previewUrl = URL.createObjectURL(file)
    setImagePreview(previewUrl)

    // Reset input value
    e.target.value = ''
  }

  const removeSelectedImage = () => {
    setSelectedImage(null)
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview)
      setImagePreview(null)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!newMessage.trim() && !selectedImage) || !selectedConversation || !user || sending) return

    setSending(true)
    const content = newMessage.trim()
    let imageUrl = null

    // Create optimistic message
    const tempId = Math.random().toString()
    const optimisticImage = imagePreview // Use preview for immediate display

    // Optimistic Update
    const optimisticMessage: Message = {
      id: tempId,
      sender_id: user.id,
      recipient_id: selectedConversation.id,
      content: content || (optimisticImage ? 'Shared an image' : ''),
      image_url: optimisticImage || undefined,
      created_at: new Date().toISOString(),
      is_read: false,
    }
    setMessages(prev => [...prev, optimisticMessage])
    setNewMessage('')

    // We defer clearing image selection until success/fail or maybe just clear it now?
    // Let's hold onto it until upload done to be safe, but UI wise we should clear preview or show loading.
    // For now, let's clear inputs to mimic instant feel.
    setShowImagePreviewInChatInput(false)

    try {
      // 1. Upload Image
      if (selectedImage) {
        const fileExt = selectedImage.name.split('.').pop()
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `${user.id}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('message-images')
          .upload(filePath, selectedImage)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('message-images')
          .getPublicUrl(filePath)

        imageUrl = publicUrl
      }

      // 2. Insert Message
      const { data, error } = await supabase
        .from('messages')
        .insert([{
          sender_id: user.id,
          recipient_id: selectedConversation.id,
          content: content,
          image_url: imageUrl
        }])
        .select()
        .single()

      if (error) throw error

      if (data) {
        // Replace temp ID with real one
        setMessages(prev => prev.map(m => m.id === tempId ? data : m))
      }

      removeSelectedImage()
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
      // Rollback
      setMessages(prev => prev.filter(m => m.id !== tempId))
      setShowImagePreviewInChatInput(true) // Restore
    } finally {
      setSending(false)
    }
  }

  // Wrapper to toggle preview visibility in input relative to upload state
  const [showImagePreviewInChatInput, setShowImagePreviewInChatInput] = useState(true)
  useEffect(() => {
    if (selectedImage) setShowImagePreviewInChatInput(true)
  }, [selectedImage])

  const filteredConversations = conversations.filter((conv) =>
    conv.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.username.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
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
        <div className={`w-full md:w-80 bg-slate-900/50 border border-slate-800 rounded-lg flex flex-col overflow-hidden ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
          {/* Header */}
          <div className="p-4 border-b border-slate-800">
            <h2 className="text-xl font-bold text-white mb-3">Messages</h2>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search friends..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto space-y-1 p-3">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                No friends found.<br />Add friends to start chatting!
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => {
                    setSelectedConversation(conv)
                  }}
                  className={`w-full p-3 rounded-lg text-left transition ${selectedConversation?.id === conv.id
                    ? 'bg-purple-900/20 border border-purple-500/30'
                    : 'hover:bg-slate-800'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${conv.avatar_color} relative overflow-hidden`}>
                      {conv.avatar_url && <img src={conv.avatar_url} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{conv.display_name}</p>
                      <p className="text-xs text-slate-400 truncate">@{conv.username}</p>
                    </div>
                    {conv.unread_count > 0 && (
                      <span className="flex-shrink-0 bg-purple-500 rounded-full w-2.5 h-2.5 shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 flex-col bg-slate-900/50 border border-slate-800 rounded-lg overflow-hidden ${selectedConversation ? 'flex' : 'hidden md:flex'}`}>
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-slate-900/80">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden text-slate-400 mr-2"
                  onClick={() => setSelectedConversation(null)}
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${selectedConversation.avatar_color} overflow-hidden`}>
                  {selectedConversation.avatar_url && <img src={selectedConversation.avatar_url} alt="" className="w-full h-full object-cover" />}
                </div>
                <div>
                  <p className="font-medium text-white">{selectedConversation.display_name}</p>
                  <p className="text-xs text-slate-400">@{selectedConversation.username}</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500 opacity-50">
                    <MessageCircle className="w-12 h-12 mb-2" />
                    <p>No messages yet.</p>
                    <p className="text-sm">Say hello to {selectedConversation.display_name}!</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] md:max-w-md px-4 py-2 rounded-2xl space-y-2 ${msg.sender_id === user?.id
                          ? 'bg-purple-600 text-white rounded-br-none'
                          : 'bg-slate-800 text-slate-200 rounded-bl-none'
                          }`}
                      >
                        {msg.image_url && (
                          <div className="rounded-lg overflow-hidden my-1 max-w-full bg-black/20">
                            <img
                              src={msg.image_url}
                              alt="Shared content"
                              className="max-w-full h-auto object-cover max-h-64 rounded-lg cursor-pointer hover:opacity-95 transition-opacity"
                              onClick={() => window.open(msg.image_url, '_blank')}
                            />
                          </div>
                        )}
                        {msg.content && <p className="text-sm whitespace-pre-wrap">{msg.content}</p>}
                        <p className={`text-[10px] mt-1 text-right ${msg.sender_id === user?.id ? 'text-purple-200' : 'text-slate-500'}`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-slate-800 bg-slate-900/80">
                {showImagePreviewInChatInput && imagePreview && (
                  <div className="mb-3 relative inline-block">
                    <div className="relative rounded-lg overflow-hidden border border-slate-700 w-24 h-24 group">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-white hover:text-red-400 h-8 w-8 rounded-full bg-black/50 hover:bg-black/70"
                          onClick={removeSelectedImage}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileSelect}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-slate-400 hover:text-white shrink-0"
                    onClick={() => fileInputRef.current?.click()}
                    title="Upload Image"
                  >
                    <ImageIcon className="w-5 h-5" />
                  </Button>
                  <Input
                    type="text"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus-visible:ring-purple-500 min-h-[40px]"
                    disabled={sending}
                  />
                  <Button type="submit" className="bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-500/20 px-4 shrink-0" disabled={sending || (!newMessage.trim() && !selectedImage)}>
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <MessageCircle className="w-8 h-8 text-slate-600" />
              </div>
              <p className="text-lg font-medium text-slate-400">Your Messages</p>
              <p className="text-sm text-slate-500 mt-2">Select a friend to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    }>
      <MessagesContent />
    </Suspense>
  )
}
