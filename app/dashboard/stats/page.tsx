'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { CodingStatsCard } from '@/components/dashboard/coding-stats'
import { BadgesShowcase } from '@/components/dashboard/badges-showcase'
import { UserNav } from '@/components/dashboard/user-nav'
import { NotificationsPopover } from '@/components/dashboard/notifications-popover'
import { Users, MessageSquare, TrendingUp, Award, ArrowLeft } from 'lucide-react'

interface Profile {
    id: string
    username: string
    display_name: string
    bio: string
    total_points: number
    level: number
    level_progress: number
    followers_count: number
    following_count: number
    leetcode_username?: string
    github_username?: string
    codeforces_username?: string
    geeksforgeeks_username?: string
    color_theme?: string
    avatar_url?: string
}

interface CodingStats {
    platform: string
    total_problems: number
    problems_solved: number
    contest_rating: number
    level: string
}

export default function StatsPage() {
    const [user, setUser] = useState<any>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [codingStats, setCodingStats] = useState<CodingStats[]>([])
    const [badges, setBadges] = useState<any[]>([])
    const [earnedBadgeIds, setEarnedBadgeIds] = useState<string[]>([])
    const [unreadMessageCount, setUnreadMessageCount] = useState(0)
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const {
                    data: { user: authUser },
                    error: authError,
                } = await supabase.auth.getUser()

                if (authError || !authUser) {
                    router.push('/auth/login')
                    return
                }

                setUser(authUser)

                // Fetch unread messages count (for nav)
                const { count, error: countError } = await supabase
                    .from('messages')
                    .select('*', { count: 'exact', head: true })
                    .eq('recipient_id', authUser.id)
                    .eq('is_read', false)

                if (!countError && count !== null) {
                    setUnreadMessageCount(count)
                }

                // Fetch profile
                const { data: profileData } = await supabase.from('profiles').select('*').eq('id', authUser.id).single()
                if (profileData) setProfile(profileData)

                // Fetch coding stats
                const { data: statsData } = await supabase
                    .from('coding_stats')
                    .select('*')
                    .eq('user_id', authUser.id)

                setCodingStats(statsData || [])

                // Fetch all badges
                const { data: badgesData } = await supabase.from('badges').select('*').order('points_value', { ascending: true })
                setBadges(badgesData || [])

                // Fetch user earned badges
                const { data: userBadgesData } = await supabase
                    .from('user_badges')
                    .select('badge_id')
                    .eq('user_id', authUser.id)

                if (userBadgesData) {
                    setEarnedBadgeIds(userBadgesData.map((ub: any) => ub.badge_id))
                }

            } catch (err) {
                console.error('Error loading stats:', err)
            } finally {
                setLoading(false)
            }
        }

        checkAuth()
    }, [router, supabase])

    // Mock coding stats if none exist
    const displayStats =
        codingStats.length > 0
            ? codingStats
            : [
                { platform: 'leetcode', total_problems: 0, problems_solved: 0, contest_rating: 0, level: 'Beginner' },
                { platform: 'geeksforgeeks', total_problems: 0, problems_solved: 0, contest_rating: 0, level: 'Beginner' },
                { platform: 'codeforces', total_problems: 0, problems_solved: 0, contest_rating: 0, level: 'Newbie' },
                { platform: 'github', total_problems: 0, problems_solved: 0, contest_rating: 0, level: 'No Repos' },
            ]

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            {/* Navigation */}
            <nav className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                    <Link href="/dashboard" className="text-2xl font-bold bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 bg-clip-text text-transparent">
                        INSPHERE
                    </Link>

                    <div className="flex items-center gap-3">
                        <Link href="/community">
                            <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
                                <Users className="w-4 h-4 mr-2" />
                                Community
                            </Button>
                        </Link>
                        <Link href="/messages">
                            <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white relative">
                                <MessageSquare className="w-4 h-4 mr-2" />
                                Messages
                                {unreadMessageCount > 0 && (
                                    <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 ring-2 ring-slate-950 animate-pulse" />
                                )}
                            </Button>
                        </Link>

                        <NotificationsPopover />

                        {user && <UserNav user={user} profile={profile} />}
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                <div className="mb-8 flex items-center gap-4">
                    <Link href="/dashboard">
                        <Button variant="ghost" className="text-slate-400 hover:text-white">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Dashboard
                        </Button>
                    </Link>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                        <Award className="w-8 h-8 text-yellow-500" />
                        Badges & Stats
                    </h1>
                </div>

                {/* Stats Grid */}
                <section className="mb-12">
                    <div className="flex items-center gap-2 mb-6">
                        <TrendingUp className="w-5 h-5 text-cyan-400" />
                        <h2 className="text-xl font-bold text-white">Coding Progress</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {displayStats.map((stat) => (
                            <CodingStatsCard key={stat.platform} platform={stat.platform} stats={stat} />
                        ))}
                    </div>
                </section>

                {/* Badges Section */}
                <section className="mb-8">
                    <div className="flex items-center gap-2 mb-6">
                        <Award className="w-5 h-5 text-purple-400" />
                        <h2 className="text-xl font-bold text-white">All Badges</h2>
                    </div>
                    <BadgesShowcase badges={badges} earnedBadgeIds={earnedBadgeIds} />
                </section>

            </div>
        </div>
    )
}
