'use client'

import { Code2, TrendingUp, GitFork, Star, Trophy } from 'lucide-react'

interface CodingStatsCardProps {
  platform: string
  stats: {
    total_problems: number
    problems_solved: number
    contest_rating: number
    level: string
  }
}

const platformColors: Record<string, { bg: string; border: string; icon: string }> = {
  leetcode: { bg: 'from-yellow-600/20 to-orange-600/20', border: 'border-yellow-500/30', icon: '🟡' },
  geeksforgeeks: { bg: 'from-green-600/20 to-emerald-600/20', border: 'border-green-500/30', icon: '🟢' },
  codeforces: { bg: 'from-blue-600/20 to-cyan-600/20', border: 'border-blue-500/30', icon: '🔵' },
  github: { bg: 'from-gray-600/20 to-slate-600/20', border: 'border-gray-500/30', icon: '⚫' },
}

export function CodingStatsCard({ platform, stats }: CodingStatsCardProps) {
  const colors = platformColors[platform] || platformColors.leetcode

  // Render logic based on platform
  const renderContent = () => {
    switch (platform) {
      case 'leetcode':
        const solvingPercentage = stats.total_problems > 0 ? (stats.problems_solved / stats.total_problems) * 100 : 0
        return (
          <>
            <div className="flex justify-between items-end">
              <span className="text-sm text-slate-300">Problems Solved</span>
              <span className="text-xl font-bold text-white">{stats.problems_solved}</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Progress</span>
                <span className="text-slate-400">{Math.round(solvingPercentage)}%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-1.5">
                <div
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${Math.min(solvingPercentage, 100)}%` }}
                />
              </div>
            </div>
          </>
        )

      case 'github':
        return (
          <>
            <div className="flex justify-between items-end border-b border-slate-700/50 pb-2">
              <span className="text-sm text-slate-300">Contributions</span>
              <span className="text-xl font-bold text-white">{stats.problems_solved}</span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <div className="flex items-center gap-2">
                <GitFork className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-400">Repositories</span>
              </div>
              <span className="font-medium text-white">{stats.total_problems}</span>
            </div>
          </>
        )

      case 'codeforces':
        return (
          <>
            <div className="flex justify-between items-end border-b border-slate-700/50 pb-2">
              <span className="text-sm text-slate-300">Problems Solved</span>
              <span className="text-xl font-bold text-white">{stats.problems_solved}</span>
            </div>
            {stats.contest_rating > 0 && (
              <div className="flex justify-between items-center pt-1">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm text-slate-400">Rating</span>
                </div>
                <span className="font-medium text-yellow-400">{stats.contest_rating}</span>
              </div>
            )}
          </>
        )

      default: // GeeksforGeeks and others
        return (
          <div className="flex justify-between items-end">
            <span className="text-sm text-slate-300">Problems Solved</span>
            <span className="text-xl font-bold text-white">{stats.problems_solved}</span>
          </div>
        )
    }
  }

  return (
    <div className={`bg-gradient-to-br ${colors.bg} border ${colors.border} rounded-lg p-5 shadow-lg hover:shadow-xl transition flex flex-col justify-between h-full`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">{colors.icon}</span>
            <h3 className="text-lg font-bold text-white capitalize">{platform}</h3>
          </div>
          {stats.level && <p className="text-sm text-slate-400">{stats.level}</p>}
        </div>
        <Code2 className="w-5 h-5 text-purple-400" />
      </div>

      <div className="space-y-3">
        {renderContent()}
      </div>
    </div>
  )
}
