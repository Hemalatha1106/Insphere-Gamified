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
import { LogOut, Users, MessageSquare, TrendingUp } from 'lucide-react'

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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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

        // Fetch badges
        const { data: badgesData, error: badgesError } = await supabase.from('badges').select('*')

        if (badgesError) throw badgesError
        setBadges(badgesData || [])
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
        { platform: 'leetcode', total_problems: 1500, problems_solved: 287, contest_rating: 1850, level: 'Advanced' },
        { platform: 'geeksforgeeks', total_problems: 2000, problems_solved: 450, contest_rating: 0, level: 'Intermediate' },
        { platform: 'codeforces', total_problems: 5000, problems_solved: 120, contest_rating: 1400, level: 'Newbie' },
        { platform: 'github', total_problems: 150, problems_solved: 45, contest_rating: 0, level: '45 Repos' },
      ]

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
              <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
                <MessageSquare className="w-4 h-4 mr-2" />
                Messages
              </Button>
            </Link>

            {/* User Dropdown */}
            {user && <UserNav user={user} />}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Section */}
        <section className="mb-8">
          {profile && <ProfileCard user={user} profile={profile} />}
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
          <BadgesShowcase badges={badges} earnedBadgeIds={[badges[0]?.id, badges[2]?.id].filter(Boolean)} />
        </section>

        {/* Leaderboard Preview */}
        <section className="bg-gradient-to-br from-slate-800 to-slate-900 border border-yellow-500/20 rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-xl">🏅</span>
            Global Leaderboard
          </h2>
          <div className="space-y-2">
            {[
              { rank: 1, name: 'AlgoKing', points: 15230 },
              { rank: 2, name: 'CodeNinja', points: 14980 },
              { rank: 3, name: 'StackMaster', points: 14750 },
              { rank: 4, name: 'BinaryBoss', points: 14320 },
            ].map((entry) => (
              <div key={entry.rank} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-yellow-400">#{entry.rank}</span>
                  <span className="text-white">{entry.name}</span>
                </div>
                <span className="text-purple-400 font-bold">{entry.points} pts</span>
              </div>
            ))}
          </div>
          <Button className="w-full mt-4 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700">
            View Full Leaderboard
          </Button>
        </section>
      </div>
    </div>
  )
}
