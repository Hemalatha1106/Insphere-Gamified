
'use client'


import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Check, X, Loader2, User, ArrowRight, UserMinus } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

interface FriendRequest {
    id: string
    sender_id: string
    receiver_id: string
    sender: {
        id: string
        username: string
        display_name: string
        avatar_url: string | null
    }
    receiver: {
        id: string
        username: string
        display_name: string
        avatar_url: string | null
    }
    created_at: string
}

export function FriendRequestsList({ currentUserId }: { currentUserId: string }) {
    const router = useRouter()
    const [requests, setRequests] = useState<FriendRequest[]>([])
    const [sentRequests, setSentRequests] = useState<FriendRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [actioning, setActioning] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received')
    const supabase = createClient()

    useEffect(() => {
        fetchRequests()

        // Realtime subscription for new requests (Received)
        const channel = supabase
            .channel('friend_requests_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'friend_requests',
                    filter: `receiver_id=eq.${currentUserId}`
                },
                () => {
                    fetchRequests()
                    if (activeTab === 'received') toast.info('Friend requests updated')
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'friend_requests',
                    filter: `sender_id=eq.${currentUserId}`
                },
                () => {
                    fetchRequests() // Update sent list if changed
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [currentUserId, supabase])

    const fetchRequests = async () => {
        setLoading(true)
        try {
            // Fetch Received
            const { data: receivedData } = await supabase
                .from('friend_requests')
                .select(`
                    id,
                    sender_id,
                    receiver_id,
                    created_at,
                    sender:profiles!sender_id(id, username, display_name, avatar_url)
                `)
                .eq('receiver_id', currentUserId)
                .eq('status', 'pending')
                .order('created_at', { ascending: false })

            // Fetch Sent
            const { data: sentData } = await supabase
                .from('friend_requests')
                .select(`
                    id,
                    sender_id,
                    receiver_id,
                    created_at,
                    receiver:profiles!receiver_id(id, username, display_name, avatar_url)
                `)
                .eq('sender_id', currentUserId)
                .eq('status', 'pending')
                .order('created_at', { ascending: false })

            if (receivedData) {
                // @ts-ignore
                setRequests(receivedData as FriendRequest[])
            }
            if (sentData) {
                // @ts-ignore
                setSentRequests(sentData as FriendRequest[])
            }
        } catch (error) {
            console.error('Error fetching requests:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleAction = async (requestId: string, action: 'accept' | 'reject', request?: FriendRequest) => {
        setActioning(requestId)
        try {
            if (action === 'accept') {
                // 1. Update friend request status
                const { error: updateError } = await supabase
                    .from('friend_requests')
                    .update({ status: 'accepted' })
                    .eq('id', requestId)

                if (updateError) throw updateError

                // 2. Automatically follow each other
                // Use upsert with ignoreDuplicates to handle existing follows gracefully
                const { error: followError } = await supabase
                    .from('follows')
                    .upsert([
                        { follower_id: currentUserId, following_id: request?.sender_id },
                        { follower_id: request?.sender_id, following_id: currentUserId }
                    ], { onConflict: 'follower_id,following_id', ignoreDuplicates: true })

                if (followError) {
                    console.error('Error auto-following:', followError)
                    // We don't throw here to avoid failing the friend acceptance if follow fails
                    toast.error('Friend accepted, but auto-follow failed')
                }

                // Send Notification
                if (request) {
                    const { data: currentUserProfile } = await supabase
                        .from('profiles')
                        .select('username, display_name, avatar_url')
                        .eq('id', currentUserId)
                        .single()

                    if (currentUserProfile) {
                        await supabase.from('notifications').insert({
                            user_id: request.sender_id,
                            type: 'friend_request_accepted',
                            title: 'Friend Request Accepted',
                            content: `${currentUserProfile.display_name} accepted your friend request`,
                            link: `/u/${currentUserProfile.username}`,
                            metadata: {
                                avatar_url: currentUserProfile.avatar_url,
                                friend_id: currentUserId
                            },
                            is_read: false
                        })
                    }
                }

                toast.success('Friend accepted!')
            } else {
                const { error } = await supabase
                    .from('friend_requests')
                    .delete()
                    .eq('id', requestId)

                if (error) throw error
                toast.success('Request declined')
            }

            // Remove from list
            setRequests(prev => prev.filter(r => r.id !== requestId))
        } catch (error) {
            console.error(`Error ${action}ing request:`, error)
            toast.error(`Failed to ${action} request`)
        } finally {
            setActioning(null)
        }
    }

    const cancelRequest = async (requestId: string) => {
        setActioning(requestId)
        try {
            const { error } = await supabase
                .from('friend_requests')
                .delete()
                .eq('id', requestId)

            if (error) throw error
            toast.success('Request cancelled')
            setSentRequests(prev => prev.filter(r => r.id !== requestId))
        } catch (error) {
            console.error('Error cancelling request:', error)
            toast.error('Failed to cancel request')
        } finally {
            setActioning(null)
        }
    }

    if (loading && requests.length === 0 && sentRequests.length === 0) {
        return <div className="flex justify-center p-4"><Loader2 className="w-5 h-5 animate-spin text-purple-500" /></div>
    }

    return (
        <div className="space-y-3 p-4">
            <div className="flex gap-2 mb-4 bg-slate-800/50 p-1 rounded-lg">
                <button
                    onClick={() => setActiveTab('received')}
                    className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all ${activeTab === 'received'
                        ? 'bg-slate-700 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                        }`}
                >
                    Received
                    {requests.length > 0 && (
                        <Badge variant="secondary" className="ml-2 bg-purple-500 text-white text-[10px] px-1.5 h-4">
                            {requests.length}
                        </Badge>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('sent')}
                    className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all ${activeTab === 'sent'
                        ? 'bg-slate-700 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                        }`}
                >
                    Sent
                    {sentRequests.length > 0 && (
                        <Badge variant="secondary" className="ml-2 bg-slate-600 text-slate-200 text-[10px] px-1.5 h-4">
                            {sentRequests.length}
                        </Badge>
                    )}
                </button>
            </div>

            <div className="space-y-2">
                {activeTab === 'received' ? (
                    requests.length === 0 ? (
                        <div className="text-center p-6 text-slate-500 text-sm">No pending requests</div>
                    ) : (
                        requests.map(req => (
                            <div
                                key={req.id}
                                onClick={() => router.push(`/profile/${req.sender.id}`)}
                                className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700 cursor-pointer hover:bg-slate-700/50 transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10 border border-slate-600">
                                        <AvatarImage src={req.sender.avatar_url || undefined} />
                                        <AvatarFallback className="bg-slate-700 text-slate-300">
                                            {req.sender.username.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="text-sm font-medium text-white group-hover:text-purple-400 transition-colors">{req.sender.display_name}</p>
                                        <p className="text-xs text-slate-400">@{req.sender.username}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="default"
                                        className="h-8 bg-green-600 hover:bg-green-700 text-white"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleAction(req.id, 'accept', req)
                                        }}
                                        disabled={!!actioning}
                                    >
                                        {actioning === req.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-4 h-4" />}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        className="h-8"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleAction(req.id, 'reject')
                                        }}
                                        disabled={!!actioning}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))
                    )
                ) : (
                    sentRequests.length === 0 ? (
                        <div className="text-center p-6 text-slate-500 text-sm">No sent requests</div>
                    ) : (
                        sentRequests.map(req => (
                            <div
                                key={req.id}
                                onClick={() => router.push(`/profile/${req.receiver.id}`)}
                                className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700 cursor-pointer hover:bg-slate-700/50 transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10 border border-slate-600">
                                        <AvatarImage src={req.receiver.avatar_url || undefined} />
                                        <AvatarFallback className="bg-slate-700 text-slate-300">
                                            {req.receiver.username.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="text-sm font-medium text-white group-hover:text-purple-400 transition-colors">{req.receiver.display_name}</p>
                                        <p className="text-xs text-slate-400">@{req.receiver.username}</p>
                                    </div>
                                </div>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 text-slate-400 hover:text-red-400 hover:bg-slate-700/50"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        cancelRequest(req.id)
                                    }}
                                    disabled={!!actioning}
                                >
                                    {actioning === req.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserMinus className="w-4 h-4 mr-2" />}
                                    Cancel
                                </Button>
                            </div>
                        ))
                    )
                )}
            </div>
        </div>
    )
}

