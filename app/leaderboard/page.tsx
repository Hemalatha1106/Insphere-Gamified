'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Trophy, TrendingUp, Award, Users } from 'lucide-react'

interface LeaderboardEntry {
  rank: number
  user_id: string
  username: string
  display_name: string
  total_points: number
  level: number
  total_problems_solved: number
  avatar_color: string
}

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  {
    rank: 1,
    user_id: 'user1',
    username: 'algo_king',
    display_name: 'Algorithm King',
    total_points: 25650,
    level: 15,
    total_problems_solved: 1250,
    avatar_color: 'from-yellow-500 to-orange-500',
  },
  {
    rank: 2,
    user_id: 'user2',
    username: 'code_ninja',
    display_name: 'Code Ninja',
    total_points: 24320,
    level: 14,
    total_problems_solved: 1180,
    avatar_color: 'from-purple-500 to-pink-500',
  },
  {
    rank: 3,
    user_id: 'user3',
    username: 'stack_master',
    display_name: 'Stack Master',
    total_points: 23450,
    level: 14,
    total_problems_solved: 1120,
    avatar_color: 'from-blue-500 to-cyan-500',
  },
  {
    rank: 4,
    user_id: 'user4',
    username: 'binary_boss',
    display_name: 'Binary Boss',
    total_points: 22100,
    level: 13,
    total_problems_solved: 1050,
    avatar_color: 'from-green-500 to-emerald-500',
  },
  {
    rank: 5,
    user_id: 'user5',
    username: 'dp_expert',
    display_name: 'DP Expert',
    total_points: 21300,
    level: 13,
    total_problems_solved: 980,
    avatar_color: 'from-red-500 to-pink-500',
  },
  {
    rank: 6,
    user_id: 'user6',
    username: 'graph_guru',
    display_name: 'Graph Guru',
    total_points: 20450,
    level: 12,
    total_problems_solved: 920,
    avatar_color: 'from-indigo-500 to-purple-500',
  },
  {
    rank: 7,
    user_id: 'user7',
    username: 'string_sage',
    display_name: 'String Sage',
    total_points: 19800,
    level: 12,
    total_problems_solved: 870,
    avatar_color: 'from-pink-500 to-rose-500',
  },
  {
    rank: 8,
    user_id: 'user8',
    username: 'math_magician',
    display_name: 'Math Magician',
    total_points: 18900,
    level: 11,
    total_problems_solved: 810,
    avatar_color: 'from-cyan-500 to-blue-500',
  },
]

export default function LeaderboardPage() {
  const [user, setUser] = useState<any>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(MOCK_LEADERBOARD)
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
              className={`px-4 py-2 rounded-lg font-medium transition ${
                timeRange === range
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
          <div className="grid grid-cols-12 gap-4 bg-slate-700/50 p-4 border-b border-slate-700 font-medium text-slate-300">
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
            <div className="col-span-2 text-center">Problems</div>
          </div>

          {/* Table Rows */}
          <div>
            {leaderboard.map((entry) => (
              <div
                key={entry.rank}
                className="grid grid-cols-12 gap-4 p-4 border-b border-slate-700 hover:bg-slate-700/30 transition group cursor-pointer"
              >
                {/* Rank */}
                <div className="col-span-1 flex items-center justify-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                    entry.rank === 1
                      ? 'bg-gradient-to-br from-yellow-500 to-orange-500'
                      : entry.rank === 2
                        ? 'bg-gradient-to-br from-gray-400 to-gray-500'
                        : entry.rank === 3
                          ? 'bg-gradient-to-br from-orange-600 to-amber-700'
                          : 'bg-slate-600'
                  }`}>
                    {entry.rank}
                  </div>
                </div>

                {/* Player Info */}
                <div className="col-span-5 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${entry.avatar_color} flex-shrink-0`} />
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

                {/* Problems */}
                <div className="col-span-2 text-center">
                  <p className="text-lg font-bold text-blue-400">{entry.total_problems_solved}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Your Rank Section */}
        <div className="mt-8 bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-lg p-6">
          <p className="text-slate-400 text-sm mb-2">YOUR RANK</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-white">42</p>
              <p className="text-slate-400">Your current position</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-purple-400">5,240</p>
              <p className="text-slate-400">Your total points</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
