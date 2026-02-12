'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Trophy, Zap, Crown, Code, RefreshCcw } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface LeaderboardMember {
    user_id: string
    display_name: string
    avatar_url: string | null
    username: string
    total_points: number
    total_problems_solved: number
}

export function CommunityLeaderboard({ communityId }: { communityId: string }) {
    const [members, setMembers] = useState<LeaderboardMember[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        const fetchMembers = async () => {
            try {
                // 1. Fetch community members
                const { data: memberData, error: memberError } = await supabase
                    .from('community_members')
                    .select('user_id')
                    .eq('community_id', communityId)

                if (memberError) throw memberError
                if (!memberData || memberData.length === 0) {
                    setMembers([])
                    return
                }

                const userIds = memberData.map(m => m.user_id)

                // 2. Fetch profiles for these members
                const { data: profiles, error: profileError } = await supabase
                    .from('profiles')
                    .select('id, display_name, avatar_url, username, total_points')
                    .in('id', userIds)
                    .order('total_points', { ascending: false })

                if (profileError) throw profileError

                // 3. Fetch coding stats for these members
                const { data: statsData, error: statsError } = await supabase
                    .from('coding_stats')
                    .select('user_id, problems_solved, platform')
                    .in('user_id', userIds)
                    .in('platform', ['leetcode', 'codeforces', 'geeksforgeeks'])

                if (statsError) console.error('Error fetching coding stats:', statsError)

                // Map to LeaderboardMember interface
                const leaderboardData = profiles.map(p => {
                    // Calculate total problems solved
                    const userStats = statsData?.filter(s => s.user_id === p.id) || []
                    const totalProblems = userStats.reduce((sum, stat) => sum + (stat.problems_solved || 0), 0)

                    return {
                        user_id: p.id,
                        display_name: p.display_name || 'User',
                        avatar_url: p.avatar_url,
                        username: p.username || 'user',
                        total_points: p.total_points || 0,
                        total_problems_solved: totalProblems
                    }
                })

                setMembers(leaderboardData)

            } catch (error) {
                console.error('Error fetching leaderboard:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchMembers()
    }, [communityId, supabase])

    if (loading) {
        return (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="h-6 w-32 bg-slate-800 rounded animate-pulse mb-4"></div>
                {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-800 rounded-full animate-pulse"></div>
                        <div className="flex-1 space-y-2">
                            <div className="h-4 w-24 bg-slate-800 rounded animate-pulse"></div>
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <div className="p-4 border-b border-slate-800 bg-slate-900/50">
                <h3 className="font-bold text-white flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    Leaderboard
                </h3>
                <p className="text-xs text-slate-400 mt-1">Ranked by Insphere Points</p>
            </div>

            <div className="divide-y divide-slate-800/50 max-h-[500px] overflow-y-auto custom-scrollbar">
                {members.length > 0 ? (
                    members.map((member, index) => (
                        <Link
                            href={`/profile/${member.user_id}`}
                            key={member.user_id}
                            className="flex items-center gap-3 p-3 hover:bg-slate-800/50 transition-colors group cursor-pointer"
                        >
                            {/* Rank */}
                            <div className={cn(
                                "w-6 h-6 flex items-center justify-center font-bold text-sm rounded-full",
                                index === 0 ? "text-yellow-400 bg-yellow-400/10" :
                                    index === 1 ? "text-slate-300 bg-slate-300/10" :
                                        index === 2 ? "text-amber-600 bg-amber-600/10" :
                                            "text-slate-500"
                            )}>
                                {index < 3 ? <Crown className="w-3.5 h-3.5" /> : index + 1}
                            </div>

                            <Avatar className="w-8 h-8 border border-slate-700">
                                <AvatarImage src={member.avatar_url || undefined} />
                                <AvatarFallback className="text-xs bg-slate-800 text-slate-400">
                                    {member.display_name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-200 truncate group-hover:text-purple-400 transition-colors">
                                    {member.display_name}
                                </p>
                                <p className="text-xs text-slate-500 truncate">@{member.username}</p>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1 text-xs font-medium text-blue-300 bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded" title="Total Problems Solved">
                                    <Code className="w-3 h-3 text-blue-400" />
                                    {member.total_problems_solved}
                                </div>
                                <div className="flex items-center gap-1 text-xs font-medium text-slate-300 bg-slate-800/50 px-2 py-1 rounded" title="Total Points">
                                    <Zap className="w-3 h-3 text-yellow-500" />
                                    {member.total_points}
                                </div>
                            </div>
                        </Link>
                    ))
                ) : (
                    <div className="p-6 text-center text-slate-500 text-sm">
                        No members yet
                    </div>
                )}
            </div>
        </div>
    )
}
