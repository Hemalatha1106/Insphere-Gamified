'use client'

import { Award } from 'lucide-react'

interface Badge {
  id: string
  name: string
  description: string
  category: string
  points_value: number
  earned_at?: string
}

interface BadgesShowcaseProps {
  badges: Badge[]
  earnedBadgeIds?: string[]
}

const badgeEmojis: Record<string, string> = {
  achievement: '🏆',
  contest: '🎯',
  community: '👥',
  level: '⭐',
  integration: '🔗',
  consistency: '🔥',
}

export function BadgesShowcase({ badges = [], earnedBadgeIds = [] }: BadgesShowcaseProps) {
  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-pink-500/20 rounded-lg p-6 shadow-lg">
      <div className="flex items-center gap-2 mb-4">
        <Award className="w-5 h-5 text-pink-400" />
        <h3 className="text-xl font-bold text-white">Badges ({earnedBadgeIds.length})</h3>
      </div>

      {badges.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-slate-400">No badges yet. Complete challenges to earn badges!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {badges.map((badge) => {
            const isEarned = earnedBadgeIds.includes(badge.id)
            return (
              <div
                key={badge.id}
                className={`relative p-4 rounded-lg text-center transition transform hover:scale-105 ${
                  isEarned
                    ? 'bg-gradient-to-br from-purple-600/40 to-pink-600/40 border border-purple-400/50 shadow-lg shadow-purple-500/20'
                    : 'bg-slate-700/50 border border-slate-600 opacity-50'
                }`}
              >
                <div className="text-3xl mb-2">{badgeEmojis[badge.category] || '🎖️'}</div>
                <p className="text-xs font-medium text-white truncate">{badge.name}</p>
                <p className="text-xs text-slate-400 mt-1">+{badge.points_value} pts</p>

                {!isEarned && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg">
                    <span className="text-xs text-slate-300 font-medium">Locked</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
