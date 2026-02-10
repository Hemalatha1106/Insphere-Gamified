'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Bell, Check, X, MessageCircle, Hash, UserPlus } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'

interface NotificationItem {
    id: string
    type: 'message' | 'channel_message' | 'friend_request' | 'system'
    title: string
    content: string
    link?: string
    is_read: boolean
    created_at: string
    metadata?: any
    // For friend requests mixed in (optional, or we handle them structurally)
    request_id?: string
    sender?: {
        display_name: string
        avatar_url: string
        username: string
    }
}

export function NotificationsPopover() {
    const [notifications, setNotifications] = useState<NotificationItem[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [userId, setUserId] = useState<string | null>(null)
    const supabase = createClient()
    const router = useRouter()

    const fetchNotifications = async (currentUserId: string) => {
        // 1. Fetch persistent notifications
        const { data: notifs } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', currentUserId)
            .order('created_at', { ascending: false })
            .limit(20)

        // 2. Fetch pending friend requests
        const { data: requests } = await supabase
            .from('friend_requests')
            .select(`
                id,
                sender_id,
                created_at,
                sender:profiles!sender_id(username, display_name, avatar_url)
            `)
            .eq('receiver_id', currentUserId)
            .eq('status', 'pending')
            .order('created_at', { ascending: false })

        // Combine
        const formattedRequests: NotificationItem[] = (requests || []).map((req: any) => ({
            id: `req-${req.id}`,
            type: 'friend_request',
            title: 'Friend Request',
            content: `${req.sender.display_name} sent you a friend request`,
            is_read: false, // Requests are always "unread" until acted upon
            created_at: req.created_at,
            request_id: req.id,
            sender: req.sender,
            metadata: { sender_id: req.sender_id }
        }))

        // Merge and sort
        const all = [...(notifs || []), ...formattedRequests].sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )

        setNotifications(all)
        setUnreadCount(all.filter(n => !n.is_read).length)
    }

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return
            setUserId(user.id)
            fetchNotifications(user.id)

            // Realtime subscriptions
            const channel = supabase
                .channel('global-notifications')
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
                    () => fetchNotifications(user.id)
                )
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'friend_requests', filter: `receiver_id=eq.${user.id}` },
                    () => fetchNotifications(user.id)
                )
                .subscribe()

            return () => {
                supabase.removeChannel(channel)
            }
        }
        init()
    }, [supabase])

    const handleNotificationClick = async (item: NotificationItem) => {
        if (!item.is_read && item.type !== 'friend_request') {
            // Mark as read in DB
            await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', item.id)

            // Local update
            setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, is_read: true } : n))
            setUnreadCount(prev => Math.max(0, prev - 1))
        }

        if (item.link) {
            setOpen(false)
            router.push(item.link)
        }
    }

    const handleFriendRequest = async (requestId: string, action: 'accept' | 'reject') => {
        if (!userId) return
        setLoading(true)
        try {
            if (action === 'accept') {
                await supabase.from('friend_requests').update({ status: 'accepted' }).eq('id', requestId)
            } else {
                await supabase.from('friend_requests').delete().eq('id', requestId)
            }
            // Refresh
            fetchNotifications(userId)
        } catch (error) {
            console.error('Error handling request:', error)
        } finally {
            setLoading(false)
        }
    }

    const markAllRead = async () => {
        if (!userId) return
        // Only marks 'notifications' table types, friend requests stay until acted on
        const unreadIds = notifications
            .filter(n => !n.is_read && n.type !== 'friend_request')
            .map(n => n.id)

        if (unreadIds.length > 0) {
            await supabase
                .from('notifications')
                .update({ is_read: true })
                .in('id', unreadIds)

            fetchNotifications(userId)
        }
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-slate-300 hover:text-white">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-slate-950 animate-pulse" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 sm:w-96 bg-slate-900 border-slate-800 p-0 text-slate-200 shadow-xl">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
                    <h4 className="font-semibold text-white">Notifications</h4>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-purple-400 hover:text-purple-300 h-auto p-0"
                            onClick={markAllRead}
                        >
                            Mark all read
                        </Button>
                    )}
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">
                            <Bell className="mx-auto h-8 w-8 mb-2 opacity-50" />
                            <p className="text-sm">No new notifications</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-800">
                            {notifications.map((item) => (
                                <div
                                    key={item.id}
                                    className={`p-4 flex items-start gap-3 transition-colors ${!item.is_read ? 'bg-slate-800/30' : 'hover:bg-slate-800/10'}`}
                                >
                                    {/* Icon/Avatar */}
                                    <div className="shrink-0 mt-1">
                                        {item.type === 'friend_request' && item.sender ? (
                                            <Avatar className="h-9 w-9 border border-slate-700">
                                                <AvatarImage src={item.sender.avatar_url} />
                                                <AvatarFallback className="bg-slate-800 text-purple-400">
                                                    {item.sender.display_name?.charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                        ) : item.type === 'message' && item.metadata?.avatar_url ? (
                                            <Avatar className="h-9 w-9 border border-slate-700">
                                                <AvatarImage src={item.metadata.avatar_url} />
                                                <AvatarFallback className="bg-slate-800 text-purple-400">
                                                    <MessageCircle className="w-4 h-4" />
                                                </AvatarFallback>
                                            </Avatar>
                                        ) : item.type === 'channel_message' ? (
                                            <div className="h-9 w-9 rounded-full bg-purple-500/10 flex items-center justify-center border border-purple-500/20 text-purple-400">
                                                <Hash className="w-4 h-4" />
                                            </div>
                                        ) : (
                                            <div className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 text-slate-400">
                                                <Bell className="w-4 h-4" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0 space-y-1">
                                        <div
                                            className={`text-sm ${item.type !== 'friend_request' ? 'cursor-pointer' : ''}`}
                                            onClick={() => item.type !== 'friend_request' && handleNotificationClick(item)}
                                        >
                                            <p className={`text-white leading-snug ${!item.is_read && item.type !== 'friend_request' ? 'font-medium' : ''}`}>
                                                {item.content}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                                                <span>{formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</span>
                                                {item.title && <span className="text-slate-600">• {item.title}</span>}
                                            </p>
                                        </div>

                                        {/* Actions for Friend Request */}
                                        {item.type === 'friend_request' && item.request_id && (
                                            <div className="flex gap-2 mt-2">
                                                <Button
                                                    size="sm"
                                                    className="bg-purple-600 hover:bg-purple-700 h-7 text-xs flex-1"
                                                    onClick={() => handleFriendRequest(item.request_id!, 'accept')}
                                                    disabled={loading}
                                                >
                                                    <Check className="w-3 h-3 mr-1.5" />
                                                    Accept
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="border-slate-700 hover:bg-slate-800 text-slate-300 h-7 text-xs flex-1"
                                                    onClick={() => handleFriendRequest(item.request_id!, 'reject')}
                                                    disabled={loading}
                                                >
                                                    <X className="w-3 h-3 mr-1.5" />
                                                    Reject
                                                </Button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Unread Indicator */}
                                    {!item.is_read && item.type !== 'friend_request' && (
                                        <div className="shrink-0 mt-2">
                                            <div className="w-2 h-2 rounded-full bg-purple-500 ring-2 ring-purple-500/20" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    )
}
