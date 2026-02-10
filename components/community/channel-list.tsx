'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Hash, Plus, Loader2, Volume2, ChevronDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

interface Channel {
    id: string
    name: string
    type: 'text' | 'voice'
    last_message_at?: string
}

interface ChannelReadStatus {
    channel_id: string
    last_read_at: string
}

interface ChannelListProps {
    communityId: string
    selectedChannelId: string | null
    onSelectChannel: (channel: Channel) => void
    isAdmin: boolean
}

export function ChannelList({ communityId, selectedChannelId, onSelectChannel, isAdmin }: ChannelListProps) {
    const [channels, setChannels] = useState<Channel[]>([])
    const [readStatuses, setReadStatuses] = useState<Record<string, string>>({})
    const [loading, setLoading] = useState(true)
    const [newChannelName, setNewChannelName] = useState('')
    const [isCreating, setCreating] = useState(false)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isCollapsed, setIsCollapsed] = useState(false)
    const supabase = createClient()

    // Use ref to access current selectedChannelId in realtime callback without re-subscribing
    const selectedChannelIdRef = useRef(selectedChannelId)
    // Use ref to access latest channels state without triggering re-runs of callbacks
    const channelsRef = useRef(channels)

    useEffect(() => {
        selectedChannelIdRef.current = selectedChannelId
    }, [selectedChannelId])

    useEffect(() => {
        channelsRef.current = channels
    }, [channels])

    const markChannelAsRead = useCallback(async (channelId: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Fix: Access latest channels from ref to get timestamp synchronously
            let safeNow = new Date().toISOString()
            const ch = channelsRef.current.find(c => c.id === channelId)

            if (ch?.last_message_at) {
                const msgTime = new Date(ch.last_message_at).getTime()
                const nowTime = new Date().getTime()
                // If message time is in the future (clock skew) or very recent, 
                // ensure we use the later timestamp to definitely mark it read.
                // Add 1ms to be strictly greater if needed, but ISO comparisons usually inclusive?
                // Logic: isUnread = msg > read. So read must be >= msg.
                if (msgTime > nowTime) {
                    safeNow = ch.last_message_at
                }
            }

            // Optimistic update
            setReadStatuses(prev => ({
                ...prev,
                [channelId]: safeNow
            }))

            const { error } = await supabase
                .from('channel_read_status')
                .upsert({
                    user_id: user.id,
                    channel_id: channelId,
                    last_read_at: safeNow
                })

            if (error) throw error
        } catch (error) {
            console.error('Error marking channel as read:', error)
        }
    }, [supabase]) // channels removed from deps to avoid loop, handling via setState callback

    useEffect(() => {
        const fetchData = async () => {
            const { data: { user } } = await supabase.auth.getUser()

            // 1. Fetch Channels
            const { data: channelsData, error: channelsError } = await supabase
                .from('channels')
                .select('*')
                .eq('community_id', communityId)
                .order('created_at', { ascending: true })

            if (channelsData) {
                setChannels(channelsData)
                // Select first channel if none selected
                if (!selectedChannelId && channelsData.length > 0) {
                    onSelectChannel(channelsData[0])
                    // Mark first channel as read if we have user
                    if (user) {
                        markChannelAsRead(channelsData[0].id)
                    }
                }
            }

            // 2. Fetch Read Statuses
            if (user) {
                const { data: statusData, error: statusError } = await supabase
                    .from('channel_read_status')
                    .select('channel_id, last_read_at')
                    .eq('user_id', user.id)

                if (statusData) {
                    const statusMap: Record<string, string> = {}
                    statusData.forEach((s: any) => {
                        statusMap[s.channel_id] = s.last_read_at
                    })
                    setReadStatuses(statusMap)
                }
            }

            setLoading(false)
        }

        fetchData()

        // Realtime subscription
        const channel = supabase
            .channel(`community-${communityId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'channels',
                    filter: `community_id=eq.${communityId}`,
                },
                (payload) => {
                    const newChannel = payload.new as Channel
                    setChannels(prev => [...prev, newChannel])
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'channel_messages',
                },
                (payload) => {
                    const newMessage = payload.new
                    // Find channel and update its last_message_at
                    setChannels(prev => prev.map(c => {
                        if (c.id === newMessage.channel_id) {
                            return { ...c, last_message_at: newMessage.created_at }
                        }
                        return c
                    }))

                    // If this is the currently selected channel, mark it as read immediately
                    if (selectedChannelIdRef.current === newMessage.channel_id) {
                        markChannelAsRead(newMessage.channel_id)
                    }
                }
            )
            // Listen for read status updates (e.g. from other tabs)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'channel_read_status',
                },
                (payload) => {
                    const split = (payload.new as any)
                    if (split && split.channel_id && split.last_read_at) {
                        setReadStatuses(prev => ({
                            ...prev,
                            [split.channel_id]: split.last_read_at
                        }))
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [communityId, supabase, markChannelAsRead])

    // Effect to mark selected channel as read when selection changes
    useEffect(() => {
        if (selectedChannelId) {
            markChannelAsRead(selectedChannelId)
        }
    }, [selectedChannelId, markChannelAsRead])


    const handleCreateChannel = async () => {
        if (!newChannelName.trim()) return

        setCreating(true)
        try {
            // Get current user for created_by
            const { data: { user } } = await supabase.auth.getUser()

            const { data, error } = await supabase
                .from('channels')
                .insert([{
                    community_id: communityId,
                    name: newChannelName.toLowerCase().replace(/\s+/g, '-'), // slugify
                    type: 'text',
                    created_by: user?.id
                }])
                .select()
                .single()

            if (error) throw error

            if (data) {
                setChannels(prev => [...prev, data])
            }

            setNewChannelName('')
            setIsDialogOpen(false)
            toast.success('Channel created')
        } catch (error) {
            console.error('Error creating channel:', error)
            toast.error('Failed to create channel')
        } finally {
            setCreating(false)
        }
    }

    if (loading) {
        return <div className="animate-pulse space-y-2 p-2">
            {[1, 2, 3].map(i => <div key={i} className="h-8 bg-slate-800/50 rounded" />)}
        </div>
    }

    return (
        <div className="flex flex-col h-full bg-slate-900/30 rounded-lg border border-slate-800 overflow-hidden">
            {/* Header */}
            <div className="p-4 flex items-center justify-between shrink-0">
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="flex items-center gap-2 hover:text-white transition-colors w-full"
                >
                    <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Channels
                    </h2>
                    <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
                </button>
                {isAdmin && (
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-5 w-5 text-slate-400 hover:text-white">
                                <Plus className="w-4 h-4" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-slate-900 border-slate-700 text-white">
                            <DialogHeader>
                                <DialogTitle>Create Channel</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                                <Input
                                    placeholder="Channel name"
                                    value={newChannelName}
                                    onChange={(e) => setNewChannelName(e.target.value)}
                                    className="bg-slate-800 border-slate-700"
                                />
                                <div className="flex justify-end gap-2">
                                    <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                                    <Button onClick={handleCreateChannel} className="bg-purple-600 hover:bg-purple-700">
                                        Create
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {/* Channels List */}
            {!isCollapsed && (
                <div className="flex-1 overflow-y-auto px-2 space-y-1 custom-scrollbar">
                    {loading ? (
                        <div className="space-y-2 p-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-8 bg-slate-800/50 rounded animate-pulse" />
                            ))}
                        </div>
                    ) : (
                        channels.map(channel => {
                            const isUnread = channel.id !== selectedChannelId && (
                                !readStatuses[channel.id] ||
                                (channel.last_message_at && new Date(channel.last_message_at) > new Date(readStatuses[channel.id]))
                            );

                            return (
                                <button
                                    key={channel.id}
                                    onClick={() => onSelectChannel(channel)}
                                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all group ${selectedChannelId === channel.id
                                        ? 'bg-purple-500/10 text-purple-400'
                                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                                        }`}
                                >
                                    {channel.type === 'voice' ? (
                                        <Volume2 className={`w-4 h-4 shrink-0 ${selectedChannelId === channel.id ? 'text-purple-500' : 'text-slate-500 group-hover:text-slate-400'}`} />
                                    ) : (
                                        <Hash className={`w-4 h-4 shrink-0 ${selectedChannelId === channel.id ? 'text-purple-500' : 'text-slate-500 group-hover:text-slate-400'}`} />
                                    )}
                                    <span className="truncate flex-1 text-left">
                                        {channel.name}
                                    </span>
                                    {isUnread && (
                                        <span className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                                    )}
                                </button>
                            )
                        })
                    )}
                </div>
            )}
        </div>
    )
}
