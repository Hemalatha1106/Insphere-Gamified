
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, UserPlus, Loader2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'

interface Profile {
    id: string
    username: string
    display_name: string
    avatar_url: string | null
}

export function FriendSearch({ currentUserId }: { currentUserId: string }) {
    const router = useRouter()
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<Profile[]>([])
    const [loading, setLoading] = useState(false)
    const [sending, setSending] = useState<string | null>(null)
    const supabase = createClient()

    // Debounced search effect
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.trim()) {
                searchUsers(query)
            } else {
                setResults([])
            }
        }, 300)

        return () => clearTimeout(timer)
    }, [query])

    const searchUsers = async (searchQuery: string) => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, username, display_name, avatar_url')
                .ilike('username', `%${searchQuery}%`)
                .neq('id', currentUserId)
                .limit(5)

            if (error) throw error
            setResults(data || [])
        } catch (error) {
            console.error('Error searching users:', error)
            toast.error('Failed to search users')
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        // Search is handled by useEffect, but we keep this to prevent page refresh
        if (query.trim()) {
            searchUsers(query)
        }
    }

    const sendRequest = async (targetId: string) => {
        setSending(targetId)
        try {
            // Check if request already exists
            const { data: existing } = await supabase
                .from('friend_requests')
                .select('status')
                .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${targetId}),and(sender_id.eq.${targetId},receiver_id.eq.${currentUserId})`)
                .single()

            if (existing) {
                if (existing.status === 'pending') {
                    toast.info('Friend request already pending')
                } else if (existing.status === 'accepted') {
                    toast.info('You are already friends')
                } else {
                    toast.info('Request status: ' + existing.status)
                }
                setSending(null)
                return
            }

            // Send request
            const { error } = await supabase
                .from('friend_requests')
                .insert({
                    sender_id: currentUserId,
                    receiver_id: targetId,
                    status: 'pending'
                })

            if (error) throw error

            toast.success('Friend request sent!')
            // Remove from results to prevent double send
            setResults(prev => prev.filter(p => p.id !== targetId))
        } catch (error) {
            console.error('Error sending request:', error)
            toast.error('Failed to send request')
        } finally {
            setSending(null)
        }
    }

    return (
        <div className="p-4 space-y-4 h-full flex flex-col">
            <h3 className="font-semibold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-purple-400" />
                Find Friends
            </h3>

            <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <Input
                        placeholder="Search by username..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="pl-9 bg-slate-800 border-slate-700 text-white focus:border-purple-500 transition-colors"
                    />
                </div>
            </form>

            <div className="space-y-2 overflow-y-auto pr-1 custom-scrollbar flex-1">
                {results.map(user => (
                    <div
                        key={user.id}
                        onClick={() => router.push(`/profile/${user.id}`)}
                        className="flex items-center justify-between p-3 rounded-lg bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800/60 transition-colors cursor-pointer group"
                    >
                        <div className="flex items-center gap-3 overflow-hidden">
                            <Avatar className="h-10 w-10 border border-slate-600 shrink-0">
                                <AvatarImage src={user.avatar_url || undefined} />
                                <AvatarFallback className="bg-slate-700 text-slate-300">
                                    {user.username.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-white truncate group-hover:text-purple-400 transition-colors">{user.display_name}</p>
                                <p className="text-xs text-slate-400 truncate">@{user.username}</p>
                            </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                            <Button
                                size="sm"
                                variant="secondary"
                                disabled={sending === user.id}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    sendRequest(user.id)
                                }}
                                className="h-8 w-20 bg-purple-600 hover:bg-purple-700 text-white border-0 transition-all"
                            >
                                {sending === user.id ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                    "Add"
                                )}
                            </Button>
                        </div>
                    </div>
                ))}

                {results.length === 0 && query && !loading && (
                    <div className="text-center py-8">
                        <p className="text-slate-500 text-sm">No users found</p>
                    </div>
                )}

                {!query && results.length === 0 && (
                    <div className="text-center py-8 opacity-50">
                        <Search className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                        <p className="text-slate-500 text-xs">Search for people to add</p>
                    </div>
                )}
            </div>
        </div>
    )
}
