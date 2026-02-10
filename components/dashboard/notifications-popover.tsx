'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Bell, Check, X, User } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useRouter } from 'next/navigation'

export function NotificationsPopover() {
    const [requests, setRequests] = useState<any[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [userId, setUserId] = useState<string | null>(null)
    const supabase = createClient()
    const router = useRouter()

    useEffect(() => {
        const fetchRequests = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return
            setUserId(user.id)

            const { data } = await supabase
                .from('friend_requests')
                .select(`
                    id,
                    sender_id,
                    created_at,
                    sender:profiles!sender_id(username, display_name, avatar_url)
                `)
                .eq('receiver_id', user.id)
                .eq('status', 'pending')
                .order('created_at', { ascending: false })

            if (data) {
                setRequests(data)
                setUnreadCount(data.length)
            }

            // Realtime subscription
            const channel = supabase
                .channel('friend_requests_channel')
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'friend_requests',
                        filter: `receiver_id=eq.${user.id}`,
                    },
                    (payload) => {
                        // Refresh on any change
                        // Simple approach: re-fetch
                        // Optimized: handle insert/update/delete payload
                        // For MVP: refetch
                        supabase
                            .from('friend_requests')
                            .select(`
                                id,
                                sender_id,
                                created_at,
                                sender:profiles!sender_id(username, display_name, avatar_url)
                            `)
                            .eq('receiver_id', user.id)
                            .eq('status', 'pending')
                            .order('created_at', { ascending: false })
                            .then(({ data }) => {
                                if (data) {
                                    setRequests(data)
                                    setUnreadCount(data.length)
                                }
                            })
                    }
                )
                .subscribe()

            return () => {
                supabase.removeChannel(channel)
            }
        }
        fetchRequests()
    }, [supabase])

    const handleAction = async (requestId: string, action: 'accept' | 'reject') => {
        if (!userId) return
        setLoading(true)
        try {
            if (action === 'accept') {
                await supabase
                    .from('friend_requests')
                    .update({ status: 'accepted' })
                    .eq('id', requestId)
            } else {
                await supabase
                    .from('friend_requests')
                    .delete()
                    .eq('id', requestId)
            }
            // Optimistic update
            setRequests(prev => prev.filter(r => r.id !== requestId))
            setUnreadCount(prev => Math.max(0, prev - 1))
        } catch (error) {
            console.error('Error handling request:', error)
        } finally {
            setLoading(false)
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
            <PopoverContent align="end" className="w-80 bg-slate-900 border-slate-800 p-0 text-slate-200">
                <div className="p-4 border-b border-slate-800">
                    <h4 className="font-semibold text-white">Notifications</h4>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                    {requests.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">
                            <Bell className="mx-auto h-8 w-8 mb-2 opacity-50" />
                            <p className="text-sm">No new notifications</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-800">
                            {requests.map((req) => (
                                <div key={req.id} className="p-4 flex items-start gap-3 hover:bg-slate-800/50 transition-colors">
                                    <Avatar className="h-10 w-10 border border-slate-700">
                                        <AvatarImage src={req.sender.avatar_url} />
                                        <AvatarFallback className="bg-slate-800 text-purple-400">
                                            {req.sender.display_name?.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-white">
                                            <span className="font-semibold">{req.sender.display_name}</span> has sent you a friend request.
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {new Date(req.created_at).toLocaleDateString()}
                                        </p>
                                        <div className="flex gap-2 mt-3">
                                            <Button
                                                size="sm"
                                                className="bg-purple-600 hover:bg-purple-700 h-8 flex-1"
                                                onClick={() => handleAction(req.id, 'accept')}
                                                disabled={loading}
                                            >
                                                <Check className="w-3.5 h-3.5 mr-1.5" />
                                                Accept
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="border-slate-700 hover:bg-slate-800 text-slate-300 h-8 flex-1"
                                                onClick={() => handleAction(req.id, 'reject')}
                                                disabled={loading}
                                            >
                                                <X className="w-3.5 h-3.5 mr-1.5" />
                                                Reject
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    )
}
