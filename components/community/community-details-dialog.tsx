'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { User, Calendar, Users, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'

interface Community {
    id: string
    name: string
    description: string
    category: string
    type: 'public' | 'private'
    created_at: string
    created_by: string
    tags?: string[]
}

interface CommunityDetailsDialogProps {
    community: Community | null
    isOpen: boolean
    onClose: () => void
    isMember: boolean
    onJoinRequest: (id: string) => void
}

export function CommunityDetailsDialog({ community, isOpen, onClose, isMember, onJoinRequest }: CommunityDetailsDialogProps) {
    const [creator, setCreator] = useState<any>(null)
    const [memberCount, setMemberCount] = useState<number>(0)
    const [loading, setLoading] = useState(false)
    const [statsLoading, setStatsLoading] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        if (community && isOpen) {
            const fetchData = async () => {
                setStatsLoading(true)
                try {
                    // Fetch creator profile
                    const { data: creatorData } = await supabase
                        .from('profiles')
                        .select('display_name, username, avatar_url')
                        .eq('id', community?.created_by)
                        .single()

                    if (creatorData) {
                        setCreator(creatorData)
                    }

                    // Fetch member count
                    const { count } = await supabase
                        .from('community_members')
                        .select('*', { count: 'exact', head: true })
                        .eq('community_id', community.id)
                        .eq('status', 'approved')

                    setMemberCount(count || 0)

                } catch (error) {
                    console.error('Error fetching community details:', error)
                } finally {
                    setStatsLoading(false)
                }
            }

            fetchData()
        }
    }, [community, isOpen])

    if (!community) return null

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-slate-950 border-slate-800 text-white max-w-lg">
                <DialogHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className={`
                            ${community.type === 'public'
                                ? 'border-green-500/30 text-green-400 bg-green-500/10'
                                : 'border-yellow-500/30 text-yellow-400 bg-yellow-500/10'}
                        `}>
                            {community.type === 'public' ? 'Public' : 'Private'}
                        </Badge>
                        <Badge variant="outline" className="border-purple-500/30 text-purple-400 bg-purple-500/10">
                            {community.category}
                        </Badge>
                    </div>
                    <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                        {community.name}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Description */}
                    <div className="text-slate-300 leading-relaxed">
                        {community.description || "No description provided."}
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                            <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                                <Users className="w-4 h-4" />
                                <span>Members</span>
                            </div>
                            <p className="text-xl font-bold text-white">
                                {statsLoading ? '...' : memberCount}
                            </p>
                        </div>
                        <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                            <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                                <Calendar className="w-4 h-4" />
                                <span>Created</span>
                            </div>
                            <p className="text-lg font-medium text-white">
                                {format(new Date(community.created_at), 'MMM d, yyyy')}
                            </p>
                        </div>
                    </div>

                    {/* Creator Info */}
                    {creator && (
                        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden flex-shrink-0 border border-slate-700">
                                {creator.avatar_url ? (
                                    <img src={creator.avatar_url} alt={creator.display_name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-purple-900 text-purple-200 text-xs font-bold">
                                        {creator.display_name?.charAt(0) || '?'}
                                    </div>
                                )}
                            </div>
                            <div>
                                <p className="text-xs text-slate-400">Created by</p>
                                <p className="font-medium text-white">{creator.display_name}</p>
                                <p className="text-xs text-slate-500">@{creator.username}</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-slate-800/50">
                    <Button variant="ghost" onClick={onClose} className="text-slate-400 hover:text-white">
                        Close
                    </Button>
                    <Button
                        onClick={() => {
                            if (!isMember) {
                                onJoinRequest(community.id)
                            } else {
                                window.location.href = `/community/${community.id}`
                            }
                        }}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                        disabled={loading}
                    >
                        {isMember ? 'Open Community' : (community.type === 'public' ? 'Join Community' : 'Request to Join')}
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
