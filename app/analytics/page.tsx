'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { TrendingUp, Calendar, Target, Zap } from 'lucide-react'

interface MonthlyProgress {
  month: string
  problems_solved: number
  points_earned: number
}

interface PlatformStats {
  platform: string
  problems_solved: number
  contest_rating: number
  streak: number
}

const MOCK_MONTHLY_DATA: MonthlyProgress[] = [
  { month: 'Jan', problems_solved: 42, points_earned: 520 },
  { month: 'Feb', problems_solved: 38, points_earned: 480 },
  { month: 'Mar', problems_solved: 55, points_earned: 720 },
  { month: 'Apr', problems_solved: 48, points_earned: 640 },
  { month: 'May', problems_solved: 62, points_earned: 890 },
  { month: 'Jun', problems_solved: 71, points_earned: 1050 },
]

const MOCK_PLATFORM_STATS: PlatformStats[] = [
  { platform: 'LeetCode', problems_solved: 287, contest_rating: 1850, streak: 45 },
  { platform: 'GeeksforGeeks', problems_solved: 450, contest_rating: 0, streak: 23 },
  { platform: 'Codeforces', problems_solved: 120, contest_rating: 1400, streak: 12 },
  { platform: 'GitHub', problems_solved: 45, contest_rating: 0, streak: 8 },
]

const MAX_PROBLEMS = 71

export default function AnalyticsPage() {
  const [user, setUser] = useState<any>(null)
  const [monthlyData, setMonthlyData] = useState<MonthlyProgress[]>(MOCK_MONTHLY_DATA)
  const [platformStats, setPlatformStats] = useState<PlatformStats[]>(MOCK_PLATFORM_STATS)
  const [timeRange, setTimeRange] = useState('6months')
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

  const totalProblems = monthlyData.reduce((sum, month) => sum + month.problems_solved, 0)
  const totalPoints = monthlyData.reduce((sum, month) => sum + month.points_earned, 0)
  const avgPerMonth = Math.round(totalProblems / monthlyData.length)
  const currentStreak = 45

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">


      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-8 h-8 text-cyan-400" />
            <h1 className="text-4xl font-bold text-white">Progress Analytics</h1>
          </div>
          <p className="text-slate-400">Track your competitive programming journey and growth</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-blue-500/20 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-400 text-sm">Total Problems</p>
              <Target className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-3xl font-bold text-white">{totalProblems}</p>
            <p className="text-xs text-slate-500 mt-2">Last 6 months</p>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-purple-500/20 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-400 text-sm">Total Points</p>
              <Zap className="w-5 h-5 text-purple-400" />
            </div>
            <p className="text-3xl font-bold text-white">{totalPoints.toLocaleString()}</p>
            <p className="text-xs text-slate-500 mt-2">Earned</p>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-green-500/20 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-400 text-sm">Avg/Month</p>
              <Calendar className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-3xl font-bold text-white">{avgPerMonth}</p>
            <p className="text-xs text-slate-500 mt-2">Problems</p>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-orange-500/20 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-400 text-sm">Current Streak</p>
              <TrendingUp className="w-5 h-5 text-orange-400" />
            </div>
            <p className="text-3xl font-bold text-white">{currentStreak}</p>
            <p className="text-xs text-slate-500 mt-2">Days</p>
          </div>
        </div>

        {/* Monthly Progress Chart */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Monthly Progress</h2>
            <div className="flex gap-2">
              {['3months', '6months', '1year'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 rounded text-sm font-medium transition ${timeRange === range
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                >
                  {range === '3months' ? '3M' : range === '6months' ? '6M' : '1Y'}
                </button>
              ))}
            </div>
          </div>

          {/* Bar Chart Visualization */}
          <div className="space-y-4">
            {monthlyData.map((month) => (
              <div key={month.month}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-300">{month.month}</span>
                  <span className="text-sm text-slate-400">{month.problems_solved} problems</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all"
                    style={{ width: `${(month.problems_solved / MAX_PROBLEMS) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Platform Statistics */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-6">Platform Statistics</h2>

          <div className="space-y-4">
            {platformStats.map((stat) => (
              <div key={stat.platform} className="bg-slate-700/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-medium text-white">{stat.platform}</p>
                  <div className="flex gap-4 text-sm">
                    <span className="text-slate-400">
                      <span className="text-blue-400 font-bold">{stat.problems_solved}</span> problems
                    </span>
                    {stat.contest_rating > 0 && (
                      <span className="text-slate-400">
                        Rating: <span className="text-green-400 font-bold">{stat.contest_rating}</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Problems Solved</p>
                    <div className="w-full bg-slate-600 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${Math.min((stat.problems_solved / 500) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Streak</p>
                    <div className="w-full bg-slate-600 rounded-full h-2">
                      <div
                        className="bg-orange-500 h-2 rounded-full"
                        style={{ width: `${Math.min((stat.streak / 50) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Insights Section */}
        <div className="mt-8 grid md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-lg p-6">
            <h3 className="text-lg font-bold text-white mb-3">Strengths</h3>
            <ul className="space-y-2 text-slate-300 text-sm">
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                Consistent daily problem-solving
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                Strong performance in May-June
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                Active across multiple platforms
              </li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-orange-600/20 to-red-600/20 border border-orange-500/30 rounded-lg p-6">
            <h3 className="text-lg font-bold text-white mb-3">Areas to Improve</h3>
            <ul className="space-y-2 text-slate-300 text-sm">
              <li className="flex items-center gap-2">
                <span className="text-orange-400">•</span>
                Increase Codeforces participation
              </li>
              <li className="flex items-center gap-2">
                <span className="text-orange-400">•</span>
                Focus on contest ratings
              </li>
              <li className="flex items-center gap-2">
                <span className="text-orange-400">•</span>
                Maintain longer streaks
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
