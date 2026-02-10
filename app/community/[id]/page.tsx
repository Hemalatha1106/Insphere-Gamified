'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { ChatInterface } from '@/components/community/chat-interface'
import { CommunityLeaderboard } from '@/components/community/community-leaderboard'
import { Loader2, Users, Lock, Unlock, Settings, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface Community {
    id: string
    name: string
    description: string
    category: string
    type: 'public' | 'private'
    created_by: string
}

interface Member {
    role: string
    status: string
}

export default function CommunityClassroomPage() {
    const params = useParams()
    const router = useRouter()
    const supabase = createClient()
    const communityId = params.id as string

    const [community, setCommunity] = useState<Community | null>(null)
    const [member, setMember] = useState<Member | null>(null)
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [joining, setJoining] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)

                // 1. Get User
                const { data: { user: authUser } } = await supabase.auth.getUser()
                if (!authUser) {
                    router.push('/auth/login')
                    return
                }
                setUser(authUser)

                // 2. Get Community Details
                const { data: communityData, error: communityError } = await supabase
                    .from('communities')
                    .select('*')
                    .eq('id', communityId)
                    .single()

                if (communityError) throw communityError
                setCommunity(communityData)

                // 3. Get Membership Status
                const { data: memberData } = await supabase
                    .from('community_members')
                    .select('*')
                    .eq('community_id', communityId)
                    .eq('user_id', authUser.id)
                    .single()

                if (memberData) {
                    setMember(memberData)
                }
            } catch (err: any) {
                console.error('Error fetching community:', err)
                setError(err.message || 'Failed to load community')
            } finally {
                setLoading(false)
            }
        }

        if (communityId) fetchData()
    }, [communityId, router, supabase])

    const handleJoin = async () => {
        if (!user || !community) return
        setJoining(true)

        try {
            const status = community.type === 'public' ? 'approved' : 'pending' // Public auto-joins, Private needs approval if we had a request flow, but for now Public is instant.

            const { error } = await supabase
                .from('community_members')
                .insert([
                    {
                        community_id: community.id,
                        user_id: user.id,
                        role: 'member',
                        status: 'approved' // Simplifying to approved for all public for now, can add request logic later
                    }
                ])

            if (error) throw error

            // Refresh state
            setMember({ role: 'member', status: 'approved' })
        } catch (err: any) {
            console.error('Error joining:', err)
            setError(err.message)
        } finally {
            setJoining(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            </div>
        )
    }

    if (error || !community) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
                <h1 className="text-2xl font-bold text-white mb-4">Error Loading Community</h1>
                <p className="text-red-400 mb-6">{error || 'Community not found'}</p>
                <Link href="/community">
                    <Button variant="outline">Back to Discover</Button>
                </Link>
            </div>
        )
    }

    const isMember = member?.status === 'approved'
    const isPending = member?.status === 'pending'
    const isAdmin = member?.role === 'admin'

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            {/* Header */}
            <div className="bg-slate-900/50 border-b border-slate-800 p-6">
                <div className="max-w-7xl mx-auto">
                    <Link href="/community" className="text-slate-400 hover:text-white flex items-center mb-4 text-sm">
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Back to Discover
                    </Link>

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-3xl font-bold text-white">{community.name}</h1>
                                <span className={`px-2 py-1 rounded-full text-xs border ${community.type === 'public'
                                    ? 'border-green-500/30 text-green-400 bg-green-500/10'
                                    : 'border-yellow-500/30 text-yellow-400 bg-yellow-500/10'
                                    }`}>
                                    {community.type}
                                </span>
                                <span className="px-2 py-1 rounded-full text-xs border border-purple-500/30 text-purple-400 bg-purple-500/10">
                                    {community.category}
                                </span>
                            </div>
                            <p className="text-slate-400 max-w-2xl">{community.description}</p>
                        </div>

                        <div className="flex gap-3">
                            {isAdmin && (
                                <Link href={`/community/${community.id}/admin`}>
                                    <Button variant="outline" className="border-slate-700 text-slate-300">
                                        <Settings className="w-4 h-4 mr-2" />
                                        Manage
                                    </Button>
                                </Link>
                            )}

                            {!isMember && !isPending && (
                                <Button
                                    onClick={handleJoin}
                                    disabled={joining}
                                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                                >
                                    {joining ? 'Joining...' : 'Join Classroom'}
                                </Button>
                            )}

                            {isPending && (
                                <Button disabled variant="secondary">
                                    Request Pending
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto p-6">
                {isMember ? (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Sidebar (Leaderboard) */}
                        <div className="hidden lg:block col-span-1 space-y-6">
                            <CommunityLeaderboard communityId={community.id} />
                        </div>

                        {/* Main Chat Area */}
                        <div className="col-span-1 lg:col-span-3">
                            <ChatInterface communityId={community.id} currentUserId={user.id} />
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 bg-slate-900/30 border border-slate-800 rounded-lg border-dashed">
                        <Lock className="w-12 h-12 text-slate-600 mb-4" />
                        <h2 className="text-xl font-bold text-white mb-2">Restricted Access</h2>
                        <p className="text-slate-400 mb-6 text-center max-w-md">
                            You need to join this community to view the messages and resources.
                        </p>
                        <Button
                            onClick={handleJoin}
                            disabled={joining}
                            className="bg-purple-600 hover:bg-purple-700"
                        >
                            Join to View
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
