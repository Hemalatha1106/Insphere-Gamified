'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Trophy, TrendingUp, Award, Users } from 'lucide-react'

interface LeaderboardEntry {
  id: string
  username: string
  display_name: string
  total_points: number
  level: number
  avatar_url?: string
}

export default function LeaderboardPage() {
  const [user, setUser] = useState<any>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [userRank, setUserRank] = useState<number | null>(null)
  const [userPoints, setUserPoints] = useState<number>(0)
  const [timeRange, setTimeRange] = useState('all')
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (!authUser) {
        router.push('/auth/login')
        return
      }

      setUser(authUser)

      // Fetch Leaderboard
      const { data: leaderboardData, error: leaderboardError } = await supabase
        .from('profiles')
        .select('*')
        .order('total_points', { ascending: false })
        .limit(50)

      if (!leaderboardError && leaderboardData) {
        setLeaderboard(leaderboardData)
      }

      // Get user's current points
      const { data: profileData } = await supabase
        .from('profiles')
        .select('total_points')
        .eq('id', authUser.id)
        .single()

      const currentPoints = profileData?.total_points || 0
      setUserPoints(currentPoints)

      // Calculate Rank (simplistic: count users with more points)
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gt('total_points', currentPoints)

      setUserRank((count || 0) + 1)

      setLoading(false)
    }

    checkAuth()
  }, [router, supabase])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading leaderboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Navigation */}
      <nav className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="text-2xl font-bold bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 bg-clip-text text-transparent">
            INSPHERE
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
                Dashboard
              </Button>
            </Link>
            <Link href="/community">
              <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
                Community
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-8 h-8 text-yellow-400" />
            <h1 className="text-4xl font-bold text-white">Global Leaderboard</h1>
          </div>
          <p className="text-slate-400">Compete with competitive programmers worldwide</p>
        </div>

        {/* Time Range Filter */}
        <div className="mb-6 flex gap-2">
          {['all', 'week', 'month', 'year'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg font-medium transition ${timeRange === range
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
            >
              {range === 'all' ? 'All Time' : `This ${range.charAt(0).toUpperCase() + range.slice(1)}`}
            </button>
          ))}
        </div>

        {/* Leaderboard Table */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-lg overflow-hidden shadow-lg">
          {/* Table Header */}
          <div className="grid grid-cols-10 gap-4 bg-slate-700/50 p-4 border-b border-slate-700 font-medium text-slate-300">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-5 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Player
            </div>
            <div className="col-span-2 flex items-center gap-2 justify-center">
              <TrendingUp className="w-4 h-4" />
              Points
            </div>
            <div className="col-span-2 flex items-center gap-2 justify-center">
              <Award className="w-4 h-4" />
              Level
            </div>
          </div>

          {/* Table Rows */}
          <div>
            {leaderboard.map((entry, index) => {
              const rank = index + 1
              return (
                <div
                  key={entry.id}
                  className="grid grid-cols-10 gap-4 p-4 border-b border-slate-700 hover:bg-slate-700/30 transition group cursor-pointer"
                >
                  {/* Rank */}
                  <div className="col-span-1 flex items-center justify-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${rank === 1
                        ? 'bg-gradient-to-br from-yellow-500 to-orange-500'
                        : rank === 2
                          ? 'bg-gradient-to-br from-gray-400 to-gray-500'
                          : rank === 3
                            ? 'bg-gradient-to-br from-orange-600 to-amber-700'
                            : 'bg-slate-600'
                      }`}>
                      {rank}
                    </div>
                  </div>

                  {/* Player Info */}
                  <div className="col-span-5 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden flex-shrink-0">
                      {entry.avatar_url ? (
                        <img src={entry.avatar_url} alt={entry.display_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-purple-900 text-purple-200 text-xs font-bold">
                          {entry.display_name?.charAt(0) || '?'}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-white truncate group-hover:text-purple-300 transition">{entry.display_name}</p>
                      <p className="text-xs text-slate-500 truncate">@{entry.username}</p>
                    </div>
                  </div>

                  {/* Points */}
                  <div className="col-span-2 flex items-center justify-center">
                    <span className="text-lg font-bold text-purple-400">{entry.total_points.toLocaleString()}</span>
                  </div>

                  {/* Level */}
                  <div className="col-span-2 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-yellow-400">{entry.level}</p>
                      <p className="text-xs text-slate-500">Lvl</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Your Rank Section */}
        {user && userRank && (
          <div className="mt-8 bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-lg p-6">
            <p className="text-slate-400 text-sm mb-2">YOUR RANK</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-white">#{userRank}</p>
                <p className="text-slate-400">Your current position</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-purple-400">{userPoints.toLocaleString()}</p>
                <p className="text-slate-400">Your total points</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
