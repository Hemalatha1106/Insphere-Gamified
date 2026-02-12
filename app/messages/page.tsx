'use client'

import React, { Suspense, useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, Search, Plus, ArrowLeft, MessageCircle, Loader2, Image as ImageIcon, X, MoreVertical, UserMinus, User, UserPlus, Users, Smile } from 'lucide-react'
import { toast } from 'sonner'
import { FriendSearch } from '@/components/messages/friend-search'
import { FriendRequestsList } from '@/components/messages/friend-requests'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Theme } from 'emoji-picker-react'
import dynamic from 'next/dynamic'

const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false })

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

// Helper to format time consistently
const formatMessageTime = (dateString: string) => {
  try {
    let date = new Date(dateString)
    // If the string doesn't include timezone info (Z or +), treat it as UTC
    if (dateString && !dateString.includes('Z') && !dateString.includes('+')) {
      date = new Date(dateString + 'Z')
    }

    if (isNaN(date.getTime())) return ''
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
  } catch (e) {
    return ''
  }
}

// Resizable Sidebar Component
function ResizableSidebar({
  user,
  conversations,
  setConversations,
  selectedConversation,
  setSelectedConversation,
  tab,
  setTab,
  searchQuery,
  setSearchQuery,
  pendingRequestsCount,
  filteredConversations,
  router
}: any) {
  const [width, setWidth] = useState(320)
  const [isResizing, setIsResizing] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return
      const newWidth = Math.max(280, Math.min(600, e.clientX - 20)) // 20px buffer/margin
      setWidth(newWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    } else {
      document.body.style.cursor = 'default'
      document.body.style.userSelect = 'auto'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'default'
      document.body.style.userSelect = 'auto'
    }
  }, [isResizing])

  return (
    <div
      className={`relative bg-slate-900/50 border border-slate-800 rounded-lg flex flex-col overflow-hidden shrink-0 ${selectedConversation ? 'hidden md:flex' : 'flex'} w-full md:w-auto`}
      style={!isMobile ? { width: `${width}px` } : {}}
    >
      {/* Header & Tabs */}
      <div className="flex flex-col border-b border-slate-800 bg-slate-900/80">
        <div className="p-4 pb-2">
          <h2 className="text-xl font-bold text-white mb-4">Social</h2>
          <div className="flex gap-2 mb-2 p-1 bg-slate-800/50 rounded-lg">
            <button
              onClick={() => setTab('messages')}
              className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-md text-sm font-medium transition-all ${tab === 'messages' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Chats</span>
            </button>
            <button
              onClick={() => setTab('requests')}
              className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-md text-sm font-medium transition-all ${tab === 'requests' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Requests</span>
              {pendingRequestsCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] px-1.5 rounded-full ml-1">{pendingRequestsCount}</span>
              )}
            </button>
            <button
              onClick={() => setTab('find')}
              className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-md text-sm font-medium transition-all ${tab === 'find' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}
            >
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Find</span>
            </button>
          </div>
        </div>

        {tab === 'messages' && (
          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto bg-slate-900/30">
        {tab === 'messages' && (
          <div className="p-2 space-y-1">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="w-12 h-12 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <MessageCircle className="w-6 h-6 text-slate-600" />
                </div>
                <p className="text-slate-400 font-medium">No conversations</p>
                <p className="text-slate-500 text-sm mt-1">Start by adding friends!</p>
                <Button variant="link" onClick={() => setTab('find')} className="mt-2 text-purple-400">
                  Find Friends
                </Button>
              </div>
            ) : (
              filteredConversations.map((conv: any) => (
                <button
                  key={conv.id}
                  onClick={() => {
                    setSelectedConversation(conv)
                  }}
                  className={`w-full p-3 rounded-xl text-left transition-all border border-transparent ${selectedConversation?.id === conv.id
                    ? 'bg-purple-500/10 border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.1)]'
                    : 'hover:bg-slate-800/50 hover:border-slate-700/50'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${conv.avatar_color} relative p-[2px] shrink-0`}>
                      <div className="w-full h-full rounded-full overflow-hidden bg-slate-900">
                        {conv.avatar_url ? (
                          <img src={conv.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white font-bold bg-slate-800">
                            {conv.display_name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      {/* Online indicator (mock) */}
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-slate-900 rounded-full"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-semibold text-white truncate">{conv.display_name}</p>
                        {conv.last_message_time && (
                          <span className="text-[10px] text-slate-500">{conv.last_message_time}</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 truncate">@{conv.username}</p>
                      <p className={`text-xs truncate mt-0.5 ${conv.unread_count > 0 ? 'text-white font-medium' : 'text-slate-500'}`}>
                        {conv.last_message ? conv.last_message : 'Start chatting'}
                      </p>
                    </div>
                    {conv.unread_count > 0 && (
                      <span className="flex items-center justify-center min-w-[20px] h-5 px-1 bg-purple-500 rounded-full text-[10px] font-bold text-white shadow-lg shadow-purple-500/30">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {tab === 'requests' && (
          <FriendRequestsList currentUserId={user?.id} />
        )}

        {tab === 'find' && (
          <FriendSearch currentUserId={user?.id} />
        )}
      </div>

      {/* Drag Handle */}
      <div
        className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-purple-500/50 active:bg-purple-500 transition-colors z-50 md:block hidden"
        onMouseDown={() => setIsResizing(true)}
      />
    </div>
  )
}

function MessagesContent() {
  const [user, setUser] = useState<any>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [tab, setTab] = useState<'messages' | 'requests' | 'find'>('messages')
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0)
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

      // Fetch pending requests count
      const { count: pendingCount } = await supabase
        .from('friend_requests')
        .select('id', { count: 'exact', head: true })
        .eq('receiver_id', authUser.id)
        .eq('status', 'pending')

      setPendingRequestsCount(pendingCount || 0)

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
            setMessages(prev => {
              if (prev.some(m => m.id === newMsg.id)) return prev
              return [...prev, newMsg]
            })

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

  // Auto-focus input when conversation changes or sending completes
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (!sending && selectedConversation) {
      // Small timeout to ensure DOM is ready and prevent fighting with disabled state
      setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
    }
  }, [selectedConversation, sending])

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
        // Replace temp ID with real one, but check if real one was already added by subscription
        setMessages(prev => {
          const exists = prev.some(m => m.id === data.id)
          if (exists) {
            // If real message exists, just remove the optimistic temp one
            return prev.filter(m => m.id !== tempId)
          }
          return prev.map(m => m.id === tempId ? data : m)
        })
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
        <ResizableSidebar
          user={user}
          conversations={conversations}
          setConversations={setConversations}
          selectedConversation={selectedConversation}
          setSelectedConversation={setSelectedConversation}
          tab={tab}
          setTab={setTab}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          pendingRequestsCount={pendingRequestsCount}
          filteredConversations={filteredConversations}
          router={router}
        />

        {/* Chat Area */}
        <div className={`flex-1 flex-col bg-slate-900/50 border border-slate-800 rounded-lg overflow-hidden ${selectedConversation ? 'flex' : 'hidden md:flex'}`}>
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
                <div className="flex items-center gap-3">
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

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                      <MoreVertical className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-slate-200">
                    <DropdownMenuItem
                      className="cursor-pointer hover:bg-slate-800 focus:bg-slate-800"
                      onClick={() => router.push(`/u/${selectedConversation.username}`)}
                    >
                      <User className="w-4 h-4 mr-2" />
                      View Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="cursor-pointer text-red-400 hover:text-red-300 hover:bg-red-500/10 focus:bg-red-500/10 focus:text-red-300"
                      onClick={async () => {
                        if (!confirm(`Are you sure you want to unfriend ${selectedConversation.display_name}?`)) return

                        try {
                          // Delete the friend request (which means removing the friendship)
                          // We need to match where (sender=me AND receiver=them) OR (sender=them AND receiver=me)
                          const { error } = await supabase
                            .from('friend_requests')
                            .delete()
                            .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedConversation.id}),and(sender_id.eq.${selectedConversation.id},receiver_id.eq.${user.id})`)

                          if (error) throw error

                          toast.success(`Unfriended ${selectedConversation.display_name}`)

                          // Remove from local list
                          setConversations(prev => prev.filter(c => c.id !== selectedConversation.id))
                          setSelectedConversation(null)
                        } catch (err) {
                          console.error('Error unfriending:', err)
                          toast.error('Failed to unfriend user')
                        }
                      }}
                    >
                      <UserMinus className="w-4 h-4 mr-2" />
                      Unfriend
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
                          {formatMessageTime(msg.created_at)}
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
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-slate-400 hover:text-white shrink-0"
                      >
                        <Smile className="w-5 h-5" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full border-none p-0 bg-transparent shadow-none" align="start">
                      <EmojiPicker
                        theme={Theme.DARK}
                        onEmojiClick={(emojiData) => setNewMessage(prev => prev + emojiData.emoji)}
                      />
                    </PopoverContent>
                  </Popover>
                  <Input
                    ref={inputRef}
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
