'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Award, Lock } from 'lucide-react'

interface Badge {
  id: string
  name: string
  description: string
  category: string
  points_value: number
  earned_at?: string
}

const BADGE_EMOJIS: Record<string, string> = {
  achievement: '🏆',
  contest: '🎯',
  community: '👥',
  level: '⭐',
  integration: '🔗',
  consistency: '🔥',
}

const MOCK_EARNED_BADGES = ['First 10 Problems', 'Rising Star']

export default function BadgesPage() {
  const [user, setUser] = useState<any>(null)
  const [allBadges, setAllBadges] = useState<Badge[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
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

      // Fetch badges
      const { data: badgesData } = await supabase.from('badges').select('*')

      if (badgesData) {
        setAllBadges(badgesData)
      } else {
        // Mock badges
        setAllBadges([
          {
            id: '1',
            name: 'First 10 Problems',
            description: 'Solved your first 10 problems',
            category: 'achievement',
            points_value: 50,
            earned_at: '2024-01-10',
          },
          {
            id: '2',
            name: 'Century Club',
            description: 'Solved 100+ problems',
            category: 'achievement',
            points_value: 200,
          },
          {
            id: '3',
            name: 'Problem Slayer',
            description: 'Solved 500+ problems',
            category: 'achievement',
            points_value: 500,
          },
          {
            id: '4',
            name: 'Contest Champion',
            description: 'Participated in 10+ contests',
            category: 'contest',
            points_value: 150,
          },
          {
            id: '5',
            name: 'Community Helper',
            description: 'Posted 5+ helpful comments',
            category: 'community',
            points_value: 75,
            earned_at: '2024-01-15',
          },
          {
            id: '6',
            name: 'Rising Star',
            description: 'Reached level 5',
            category: 'level',
            points_value: 100,
            earned_at: '2024-01-20',
          },
          {
            id: '7',
            name: 'GitHub Master',
            description: 'Connected GitHub with 50+ repos',
            category: 'integration',
            points_value: 120,
          },
          {
            id: '8',
            name: 'Streak Master',
            description: 'Maintained 30-day streak',
            category: 'consistency',
            points_value: 180,
          },
        ])
      }

      setLoading(false)
    }

    checkAuth()
  }, [router, supabase])

  const categories = ['all', 'achievement', 'contest', 'community', 'level', 'integration', 'consistency']
  const filtered = allBadges.filter((badge) => selectedCategory === 'all' || badge.category === selectedCategory)

  const earnedCount = allBadges.filter((badge) => MOCK_EARNED_BADGES.includes(badge.name)).length

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading badges...</p>
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
            <Award className="w-8 h-8 text-purple-400" />
            <h1 className="text-4xl font-bold text-white">Badges & Achievements</h1>
          </div>
          <p className="text-slate-400">You have earned {earnedCount} out of {allBadges.length} badges</p>
        </div>

        {/* Progress */}
        <div className="mb-8 bg-gradient-to-br from-slate-800 to-slate-900 border border-purple-500/20 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-300 font-medium">Badge Progress</span>
            <span className="text-purple-400 font-bold">{earnedCount}/{allBadges.length}</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all"
              style={{ width: `${(earnedCount / allBadges.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-8 flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg font-medium transition ${selectedCategory === cat
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
            >
              {cat === 'all' ? 'All Badges' : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        {/* Badges Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map((badge) => {
            const isEarned = MOCK_EARNED_BADGES.includes(badge.name)
            return (
              <div
                key={badge.id}
                className={`relative group rounded-lg p-6 text-center transition transform hover:scale-105 ${isEarned
                    ? 'bg-gradient-to-br from-purple-600/40 to-pink-600/40 border border-purple-400/50 shadow-lg shadow-purple-500/20'
                    : 'bg-slate-700/50 border border-slate-600'
                  }`}
              >
                {/* Badge Icon */}
                <div className="text-5xl mb-3 group-hover:scale-110 transition">{BADGE_EMOJIS[badge.category] || '🎖️'}</div>

                {/* Badge Info */}
                <p className="text-sm font-bold text-white mb-1 line-clamp-2">{badge.name}</p>
                <p className="text-xs text-slate-400 mb-3">{badge.description}</p>

                {/* Points */}
                <div className="bg-slate-700/50 rounded px-2 py-1 text-xs font-bold text-yellow-400 mb-3 inline-block">
                  +{badge.points_value} pts
                </div>

                {/* Lock/Earned */}
                {!isEarned && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg">
                    <Lock className="w-6 h-6 text-slate-400" />
                  </div>
                )}

                {isEarned && badge.earned_at && (
                  <p className="text-xs text-green-400 mt-2">Earned {badge.earned_at}</p>
                )}
              </div>
            )
          })}
        </div>

        {/* Badge Info Section */}
        <div className="mt-12 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-white mb-4">How to Earn Badges</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-slate-300 mb-2">
                <span className="text-yellow-400 font-bold">Achievement Badges:</span> Unlock by solving problems on connected platforms
              </p>
              <p className="text-slate-300 mb-2">
                <span className="text-blue-400 font-bold">Contest Badges:</span> Earn by participating in competitive programming contests
              </p>
            </div>
            <div>
              <p className="text-slate-300 mb-2">
                <span className="text-pink-400 font-bold">Community Badges:</span> Unlock by helping others and contributing to discussions
              </p>
              <p className="text-slate-300">
                <span className="text-green-400 font-bold">Other Badges:</span> Complete special challenges and milestones
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
