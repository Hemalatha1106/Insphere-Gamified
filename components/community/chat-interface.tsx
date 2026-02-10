'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, User } from 'lucide-react'

interface Message {
    id: string
    content: string
    created_at: string
    user_id: string
    community_id: string // Added for client-side filtering
    profiles?: {
        username: string
        display_name: string
        avatar_url: string
    }
}

// ... (Client Code)

interface ChatInterfaceProps {
    communityId: string
    currentUserId: string
}

export function ChatInterface({ communityId, currentUserId }: ChatInterfaceProps) {
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [sending, setSending] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const supabase = createClient()

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    useEffect(() => {
        const fetchMessages = async () => {
            // 1. Fetch messages without join
            const { data: messagesData, error: messagesError } = await supabase
                .from('community_messages')
                .select('*')
                .eq('community_id', communityId)
                .order('created_at', { ascending: true })
                .limit(50)

            if (messagesError) {
                console.error('Error fetching messages:', messagesError)
                return
            }

            const rawMessages = messagesData || []

            // 2. Fetch profiles
            const userIds = Array.from(new Set(rawMessages.map(m => m.user_id)))
            if (userIds.length > 0) {
                const { data: profilesData } = await supabase
                    .from('profiles')
                    .select('id, username, display_name, avatar_url')
                    .in('id', userIds)

                const profilesMap = new Map(profilesData?.map(p => [p.id, p]))

                // 3. Merge
                const combinedMessages = rawMessages.map(msg => ({
                    ...msg,
                    profiles: profilesMap.get(msg.user_id)
                }))
                setMessages(combinedMessages as any)
            } else {
                setMessages([])
            }
        }

        fetchMessages()

        // Subscribe to new messages (EXACT LOGIC FROM TEST PAGE)
        const channel = supabase
            .channel('test-channel')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'community_messages',
                },
                async (payload) => {
                    console.log('✅ [Realtime] Event Received!', payload)

                    const newMsg = payload.new as Message

                    // Client-side Filter
                    if (newMsg.community_id !== communityId) {
                        return
                    }

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
                        // Avoid duplicates if this is the optimistic update
                        if (prev.some(m => m.id === newMsg.id)) return prev
                        return [...prev, msgWithProfile as any]
                    })
                }
            )
            .subscribe((status) => {
                console.log(`🔌 [Realtime] Status for ${communityId}:`, status)
            })

        return () => {
            console.log(`🔌 [Realtime] Unsubscribing from ${communityId}`)
            supabase.removeChannel(channel)
        }
    }, []) // Empty dependency array

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim() || sending) return

        setSending(true)
        const msgContent = newMessage.trim()

        try {
            // 1. Optimistically fetch user profile to display immediately
            const { data: { user } } = await supabase.auth.getUser()

            // We can try to get profile from existing messages if available, or fetch it
            // For speed, let's just insert and wait for the verify, OR insert and append manually.

            const { data: insertedMsg, error } = await supabase
                .from('community_messages')
                .insert([
                    {
                        community_id: communityId,
                        user_id: currentUserId,
                        content: msgContent,
                    },
                ])
                .select()
                .single()

            if (error) throw error

            setNewMessage('')

            // 2. Fetch profile to display with the new message
            const { data: profileData } = await supabase
                .from('profiles')
                .select('username, display_name, avatar_url')
                .eq('id', currentUserId)
                .single()

            // 3. Manually Append (Optimistic-ish, after confirmation)
            // We do this because sometimes Realtime is slightly delayed or deduplicated
            if (insertedMsg) {
                const msgWithProfile = {
                    ...insertedMsg,
                    profiles: profileData
                }
                setMessages((prev) => {
                    // Check if already added by Realtime to avoid duplicates
                    if (prev.some(m => m.id === insertedMsg.id)) return prev
                    return [...prev, msgWithProfile as any]
                })
            }

        } catch (error) {
            console.error('Error sending message:', error)
        } finally {
            setSending(false)
        }
    }

    return (
        <div className="flex flex-col h-[600px] border border-slate-800 rounded-lg bg-slate-900/50">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {messages.map((msg, index) => {
                    const isMe = msg.user_id === currentUserId
                    const showHeader = index === 0 || messages[index - 1].user_id !== msg.user_id

                    return (
                        <div
                            key={msg.id}
                            className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                        >
                            {!isMe && showHeader && (
                                <div className="w-8 h-8 rounded-full bg-purple-900/50 border border-purple-500/30 flex items-center justify-center text-xs font-bold text-purple-200 shrink-0">
                                    {msg.profiles?.avatar_url ? (
                                        <img src={msg.profiles.avatar_url} alt={msg.profiles.username} className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                        (msg.profiles?.username?.[0] || 'U').toUpperCase()
                                    )}
                                </div>
                            )}
                            {!isMe && !showHeader && <div className="w-8 shrink-0" />}

                            <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                                {!isMe && showHeader && (
                                    <span className="text-xs text-slate-400 mb-1 ml-1">
                                        {msg.profiles?.display_name || msg.profiles?.username || 'User'}
                                    </span>
                                )}
                                <div
                                    className={`rounded-2xl px-4 py-2 text-sm ${isMe
                                        ? 'bg-purple-600 text-white rounded-tr-sm'
                                        : 'bg-slate-800 text-slate-200 rounded-tl-sm'
                                        }`}
                                >
                                    <p className="break-words leading-relaxed">{msg.content}</p>
                                </div>
                                <span className={`text-[10px] mt-1 opacity-50 ${isMe ? 'text-purple-200' : 'text-slate-500'}`}>
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    )
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-slate-800 bg-slate-900">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 bg-slate-800 border-slate-700 text-white"
                        disabled={sending}
                    />
                    <Button
                        type="submit"
                        disabled={sending || !newMessage.trim()}
                        className="bg-purple-600 hover:bg-purple-700"
                    >
                        <Send className="w-4 h-4" />
                    </Button>
                </form>
            </div>
        </div>
    )
}
