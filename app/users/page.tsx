'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Users, Search, UserPlus, Trophy } from 'lucide-react'

interface UserProfile {
  id: string
  username: string
  display_name: string
  total_points: number
  level: number
  followers_count: number
  avatar_color: string
}

const MOCK_USERS: UserProfile[] = [
  {
    id: 'user1',
    username: 'algo_expert',
    display_name: 'Algorithm Expert',
    total_points: 12500,
    level: 10,
    followers_count: 234,
    avatar_color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'user2',
    username: 'code_warrior',
    display_name: 'Code Warrior',
    total_points: 11200,
    level: 9,
    followers_count: 189,
    avatar_color: 'from-purple-500 to-pink-500',
  },
  {
    id: 'user3',
    username: 'learning_dev',
    display_name: 'Learning Dev',
    total_points: 8900,
    level: 7,
    followers_count: 156,
    avatar_color: 'from-green-500 to-emerald-500',
  },
  {
    id: 'user4',
    username: 'dev_showcase',
    display_name: 'Dev Showcase',
    total_points: 10400,
    level: 8,
    followers_count: 203,
    avatar_color: 'from-orange-500 to-red-500',
  },
  {
    id: 'user5',
    username: 'problem_solver',
    display_name: 'Problem Solver',
    total_points: 9750,
    level: 8,
    followers_count: 178,
    avatar_color: 'from-yellow-500 to-orange-500',
  },
  {
    id: 'user6',
    username: 'competitive_pro',
    display_name: 'Competitive Pro',
    total_points: 13200,
    level: 11,
    followers_count: 267,
    avatar_color: 'from-red-500 to-pink-500',
  },
]

export default function UsersPage() {
  const [user, setUser] = useState<any>(null)
  const [users, setUsers] = useState<UserProfile[]>(MOCK_USERS)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('points')
  const [loading, setLoading] = useState(true)
  const [followingIds, setFollowingIds] = useState<string[]>([])
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

  const filtered = users
    .filter((u) => u.display_name.toLowerCase().includes(searchQuery.toLowerCase()) || u.username.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'points') return b.total_points - a.total_points
      if (sortBy === 'level') return b.level - a.level
      if (sortBy === 'followers') return b.followers_count - a.followers_count
      return 0
    })

  const toggleFollow = (userId: string) => {
    setFollowingIds((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading users...</p>
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
            <Users className="w-8 h-8 text-blue-400" />
            <h1 className="text-4xl font-bold text-white">Discover Users</h1>
          </div>
          <p className="text-slate-400">Find and follow competitive programmers in the Insphere community</p>
        </div>

        {/* Search & Filter */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
            <Input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex gap-2">
            {['points', 'level', 'followers'].map((sort) => (
              <button
                key={sort}
                onClick={() => setSortBy(sort)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  sortBy === sort
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Sort by {sort.charAt(0).toUpperCase() + sort.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Users Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-slate-400">No users found</p>
            </div>
          ) : (
            filtered.map((u) => {
              const isFollowing = followingIds.includes(u.id)
              return (
                <div key={u.id} className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-lg p-6 hover:border-purple-500/50 transition group">
                  {/* Avatar & Name */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${u.avatar_color} flex-shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white group-hover:text-purple-300 transition truncate">{u.display_name}</p>
                      <p className="text-sm text-slate-400 truncate">@{u.username}</p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-slate-700/50 rounded-lg p-2 text-center">
                      <p className="text-lg font-bold text-purple-400">{u.level}</p>
                      <p className="text-xs text-slate-500">Level</p>
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-2 text-center">
                      <p className="text-lg font-bold text-yellow-400">{u.total_points.toLocaleString()}</p>
                      <p className="text-xs text-slate-500">Points</p>
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-2 text-center flex items-center justify-center flex-col">
                      <Trophy className="w-4 h-4 text-orange-400 mb-0.5" />
                      <p className="text-xs text-slate-500">{u.followers_count}</p>
                    </div>
                  </div>

                  {/* Follow Button */}
                  <Button
                    onClick={() => toggleFollow(u.id)}
                    className={`w-full ${
                      isFollowing
                        ? 'bg-slate-700 hover:bg-slate-600 text-white'
                        : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white'
                    }`}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    {isFollowing ? 'Following' : 'Follow'}
                  </Button>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
