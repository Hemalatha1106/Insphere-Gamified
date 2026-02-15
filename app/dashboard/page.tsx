'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { ProfileCard } from '@/components/dashboard/profile-card'
import { CodingStatsCard } from '@/components/dashboard/coding-stats'
import { BadgesShowcase } from '@/components/dashboard/badges-showcase'
import { UserNav } from '@/components/dashboard/user-nav'
import { NotificationsPopover } from '@/components/dashboard/notifications-popover'
import { LogOut, Users, MessageSquare, TrendingUp } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

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
}

interface CodingStats {
  platform: string
  total_problems: number
  problems_solved: number
  contest_rating: number
  level: string
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [codingStats, setCodingStats] = useState<CodingStats[]>([])
  const [badges, setBadges] = useState<any[]>([])
  const [earnedBadgeIds, setEarnedBadgeIds] = useState<string[]>([])
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  // Auto-refresh stats on load if profiles are connected
  useEffect(() => {
    if (profile) {
      const refreshStats = async () => {
        // Only refresh if we have at least one connected account
        if (profile.leetcode_username || profile.github_username || profile.codeforces_username || profile.geeksforgeeks_username) {
          console.log('Auto-refreshing stats...')
          try {
            const res = await fetch('/api/profile/update', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                leetcode: profile.leetcode_username,
                github: profile.github_username,
                codeforces: profile.codeforces_username,
                geeksforgeeks: profile.geeksforgeeks_username
              })
            })

            if (res.ok) {
              const data = await res.json()
              if (data.stats) {
                setCodingStats(data.stats)
                // Also update profile/badges if points changed
                const { data: newProfile } = await supabase.from('profiles').select('*').eq('id', profile.id).single()
                if (newProfile) setProfile(newProfile)
              }
            }
          } catch (e) {
            console.error('Auto-refresh failed', e)
          }
        }
      }
      refreshStats()
    }
  }, [profile?.id]) // Run when profile ID is loaded (using profile object might cause loop if we update it)

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

        // Fetch profile
        let { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single()

        // Handle missing profile (PGRST116) by creating it
        if (profileError && profileError.code === 'PGRST116') {
          console.log('Profile missing, creating new profile...')
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert([
              {
                id: authUser.id,
                username: authUser.user_metadata.username || authUser.email?.split('@')[0],
                display_name: authUser.user_metadata.display_name || 'User',
                avatar_url: authUser.user_metadata.avatar_url,
              },
            ])
            .select()
            .single()

          if (createError) {
            // If profile already exists (race condition with trigger), fetch it again
            if (createError.code === '23505') {
              console.log('Profile already exists (collision), fetching...')
              const { data: existingProfile, error: retryError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', authUser.id)
                .single()

              if (retryError) throw retryError
              profileData = existingProfile
              profileError = null
            } else {
              throw createError
            }
          } else {
            profileData = newProfile
            profileError = null
          }
        }

        if (profileError) throw profileError
        setProfile(profileData)

        // Fetch coding stats
        const { data: statsData, error: statsError } = await supabase
          .from('coding_stats')
          .select('*')
          .eq('user_id', authUser.id)

        if (statsError) throw statsError
        setCodingStats(statsData || [])

        // Fetch all badges
        const { data: badgesData, error: badgesError } = await supabase.from('badges').select('*').order('points_value', { ascending: true })

        if (badgesError) throw badgesError
        setBadges(badgesData || [])

        // Fetch user earned badges
        const { data: userBadgesData, error: userBadgesError } = await supabase
          .from('user_badges')
          .select('badge_id')
          .eq('user_id', authUser.id)

        if (!userBadgesError && userBadgesData) {
          const earnedIds = userBadgesData.map((ub: any) => ub.badge_id)
          setEarnedBadgeIds(earnedIds)
        }

        // Fetch Leaderboard
        const { data: leaderboardData, error: leaderboardError } = await supabase
          .from('profiles')
          .select('id, username, display_name, total_points, avatar_url')
          .order('total_points', { ascending: false })
          .limit(5)

        if (!leaderboardError) {
          setLeaderboard(leaderboardData || [])
        }

        return () => {
          // Cleanup subscriptions if any
        }

      } catch (err: any) {
        console.error('Dashboard error:', err)
        setError(err.message || 'An error occurred loading your dashboard')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router, supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading your profile...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Button onClick={() => router.push('/auth/login')}>Return to Login</Button>
        </div>
      </div>
    )
  }

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">


      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Section */}
        <section className="mb-8">
          {profile && (
            <ProfileCard
              user={user}
              profile={profile}
              badges={badges}
              earnedBadgeIds={earnedBadgeIds}
              codingStats={codingStats}
              displayStatsAs="boxes"
            />
          )}
        </section>

        {/* Stats Grid */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            <h2 className="text-2xl font-bold text-white">Coding Progress</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {displayStats.map((stat) => (
              <CodingStatsCard key={stat.platform} platform={stat.platform} stats={stat} />
            ))}
          </div>
        </section>

        {/* Badges Section */}
        <section className="mb-8">
          <BadgesShowcase badges={badges} earnedBadgeIds={earnedBadgeIds} />
        </section>

        {/* Leaderboard Preview */}
        <section className="bg-gradient-to-br from-slate-800 to-slate-900 border border-yellow-500/20 rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-xl">🏅</span>
            Global Leaderboard
          </h2>
          <div className="space-y-2">
            {leaderboard.map((entry, index) => (
              <div key={entry.id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition">
                <div className="flex items-center gap-3">
                  <span className={`text-lg font-bold ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-slate-400' : index === 2 ? 'text-orange-400' : 'text-slate-500'}`}>
                    #{index + 1}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-800 overflow-hidden">
                      {entry.avatar_url ? (
                        <img src={entry.avatar_url} alt={entry.display_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-purple-900 text-purple-200 text-xs font-bold">
                          {entry.display_name?.charAt(0) || '?'}
                        </div>
                      )}
                    </div>
                    <span className="text-white font-medium">{entry.display_name}</span>
                  </div>
                </div>
                <span className="text-purple-400 font-bold">{entry.total_points} pts</span>
              </div>
            ))}
          </div>
          <Link href="/leaderboard">
            <Button className="w-full mt-4 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700">
              View Full Leaderboard
            </Button>
          </Link>
        </section>
      </div>
    </div>
  )
}
