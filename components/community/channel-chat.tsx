'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, Image as ImageIcon, X, Loader2, Hash, Smile } from 'lucide-react'
import { toast } from 'sonner'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Theme } from 'emoji-picker-react'
import dynamic from 'next/dynamic'

const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false })

interface Message {
    id: string
    content: string
    image_url?: string
    created_at: string
    user_id: string
    channel_id: string
    profiles?: {
        username: string
        display_name: string
        avatar_url: string
    }
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

interface ChannelChatProps {
    channelId: string
    channelName: string
    currentUserId: string
}

export function ChannelChat({ channelId, channelName, currentUserId }: ChannelChatProps) {
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [sending, setSending] = useState(false)
    const [selectedImage, setSelectedImage] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [uploading, setUploading] = useState(false)
    const [loading, setLoading] = useState(true)

    const messagesContainerRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const supabase = createClient()

    const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
        if (messagesContainerRef.current) {
            const { scrollHeight, clientHeight } = messagesContainerRef.current
            messagesContainerRef.current.scrollTo({
                top: scrollHeight - clientHeight,
                behavior
            })
        }
    }

    useEffect(() => {
        scrollToBottom(messages.length === 0 ? 'auto' : 'smooth')
    }, [messages, imagePreview])

    useEffect(() => {
        const fetchMessages = async () => {
            setLoading(true)
            // 1. Fetch messages
            const { data: messagesData, error: messagesError } = await supabase
                .from('channel_messages')
                .select(`
                    *,
                    profiles:user_id (
                        username,
                        display_name,
                        avatar_url
                    )
                `)
                .eq('channel_id', channelId)
                .order('created_at', { ascending: true })
                .limit(100)

            if (messagesError) {
                console.error('Error fetching messages:', messagesError)
            } else {
                setMessages(messagesData as any || [])
            }
            setLoading(false)
        }

        fetchMessages()

        // Realtime subscription
        const channel = supabase
            .channel(`channel-${channelId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'channel_messages',
                    filter: `channel_id=eq.${channelId}`,
                },
                async (payload) => {
                    const newMsg = payload.new as Message

                    // Fetch profile for the new message
                    const { data: profileData } = await supabase
                        .from('profiles')
                        .select('username, display_name, avatar_url')
                        .eq('id', newMsg.user_id)
                        .single()

                    const msgWithProfile = {
                        ...newMsg,
                        profiles: profileData
                    }

                    setMessages((prev) => {
                        if (prev.some(m => m.id === newMsg.id)) return prev
                        return [...prev, msgWithProfile as any]
                    })
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [channelId, supabase])

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
        e.target.value = ''
    }

    const removeSelectedImage = () => {
        setSelectedImage(null)
        if (imagePreview) {
            URL.revokeObjectURL(imagePreview)
            setImagePreview(null)
        }
    }

    // Auto-focus input when channel changes or sending completes
    const inputRef = useRef<HTMLInputElement>(null)
    useEffect(() => {
        if (!sending) {
            setTimeout(() => {
                inputRef.current?.focus()
            }, 50)
        }
    }, [channelId, sending])

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if ((!newMessage.trim() && !selectedImage) || sending) return

        setSending(true)
        const msgContent = newMessage.trim()
        let imageUrl = null

        try {
            if (selectedImage) {
                setUploading(true)
                const fileExt = selectedImage.name.split('.').pop()
                const fileName = `ch-${channelId}/${Date.now()}.${fileExt}`

                const { error: uploadError } = await supabase.storage
                    .from('community-images')
                    .upload(fileName, selectedImage)

                if (uploadError) throw uploadError

                const { data: { publicUrl } } = supabase.storage
                    .from('community-images')
                    .getPublicUrl(fileName)

                imageUrl = publicUrl
                setUploading(false)
            }

            const { data, error } = await supabase
                .from('channel_messages')
                .insert([{
                    channel_id: channelId,
                    user_id: currentUserId,
                    content: msgContent,
                    image_url: imageUrl
                }])
                .select(`
                    *,
                    profiles:user_id (
                        username,
                        display_name,
                        avatar_url
                    )
                `)
                .single()

            if (error) throw error

            if (data) {
                setMessages(prev => {
                    // Check if already added by realtime subscription
                    if (prev.some(m => m.id === data.id)) return prev
                    return [...prev, data as any]
                })
            }

            setNewMessage('')
            removeSelectedImage()

        } catch (error) {
            console.error('Error sending message:', error)
            toast.error('Failed to send message')
            setUploading(false)
        } finally {
            setSending(false)
        }
    }

    return (
        <div className="flex flex-col h-full bg-slate-900/50 border border-slate-800 rounded-lg overflow-hidden relative">
            {/* Header */}
            <div className="h-14 border-b border-slate-800 flex items-center px-4 bg-slate-900/80 backdrop-blur">
                <Hash className="w-5 h-5 text-slate-400 mr-2" />
                <h3 className="font-bold text-white">{channelName}</h3>
            </div>

            {/* Messages Area */}
            <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-6 min-h-0"
            >
                {loading ? (
                    <div className="flex justify-center py-10">
                        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 opacity-50">
                        <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
                            <Hash className="w-8 h-8 text-slate-600" />
                        </div>
                        <p>Welcome to #{channelName}!</p>
                        <p className="text-sm">Be the first to send a message.</p>
                    </div>
                ) : (
                    messages.map((msg, index) => {
                        const isMe = msg.user_id === currentUserId
                        const showHeader = index === 0 || messages[index - 1].user_id !== msg.user_id

                        return (
                            <div key={msg.id} className={`flex gap-3 hover:bg-white/5 p-1 rounded -mx-1 group ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                {(!isMe || isMe) && ( /* Always show avatar for better UI or conditional? Keep consistency */
                                    <div className={`w-10 h-10 rounded-full bg-purple-900/50 border border-purple-500/30 flex items-center justify-center text-xs font-bold text-purple-200 shrink-0 overflow-hidden ${!showHeader ? 'opacity-0' : ''}`}>
                                        {msg.profiles?.avatar_url ? (
                                            <img src={msg.profiles.avatar_url} alt={msg.profiles.username} className="w-full h-full object-cover" />
                                        ) : (
                                            (msg.profiles?.username?.[0] || 'U').toUpperCase()
                                        )}
                                    </div>
                                )}

                                <div className={`flex flex-col max-w-[80%] ${isMe ? 'items-end' : 'items-start'}`}>
                                    {showHeader && (
                                        <div className="flex items-baseline gap-2 mb-1">
                                            <span className="text-sm font-semibold text-white">
                                                {msg.profiles?.display_name || msg.profiles?.username || 'User'}
                                            </span>
                                            <span className="text-[10px] text-slate-500">
                                                {formatMessageTime(msg.created_at)}
                                            </span>
                                        </div>
                                    )}

                                    <div className={`text-slate-200 text-sm ${!showHeader ? '-mt-1' : ''}`}>
                                        {msg.image_url && (
                                            <div className="rounded-lg overflow-hidden my-2 max-w-sm border border-slate-700">
                                                <img
                                                    src={msg.image_url}
                                                    alt="Shared content"
                                                    className="w-full h-auto object-cover cursor-pointer hover:opacity-95"
                                                    onClick={() => window.open(msg.image_url, '_blank')}
                                                />
                                            </div>
                                        )}
                                        {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-slate-900 border-t border-slate-800">
                {imagePreview && (
                    <div className="mb-2 relative inline-block">
                        <div className="relative rounded-lg overflow-hidden border border-slate-700 w-20 h-20 group">
                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="text-white hover:text-red-400 h-6 w-6 rounded-full bg-black/50"
                                    onClick={removeSelectedImage}
                                >
                                    <X className="w-3 h-3" />
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex gap-2 items-center bg-slate-800 rounded-lg p-2 border border-slate-700 focus-within:ring-1 focus-within:ring-purple-500">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-slate-400 hover:text-white shrink-0 h-8 w-8 rounded-full hover:bg-slate-700"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <ImageIcon className="w-5 h-5" />
                    </Button>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="text-slate-400 hover:text-white shrink-0 h-8 w-8 rounded-full hover:bg-slate-700"
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
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileSelect}
                    />

                    <input
                        ref={inputRef}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage(e);
                            }
                        }}
                        placeholder={`Message #${channelName}`}
                        className="flex-1 bg-transparent border-none text-white placeholder-slate-500 focus:outline-none text-sm"
                        disabled={sending}
                    />

                    <Button
                        onClick={handleSendMessage}
                        disabled={sending || (!newMessage.trim() && !selectedImage)}
                        className={`h-8 w-8 rounded-full p-0 flex items-center justify-center shrink-0 ${newMessage.trim() || selectedImage ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-transparent text-slate-500'
                            }`}
                        variant="ghost"
                    >
                        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                </div>
            </div>
        </div>
    )
}
