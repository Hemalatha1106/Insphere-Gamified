'use client'

import React from "react"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { ProfileCard } from '@/components/dashboard/profile-card'
import { User } from 'lucide-react'

interface Profile {
  id: string
  username: string
  display_name: string
  bio: string
  avatar_url: string
  leetcode_username: string
  geeksforgeeks_username: string
  codeforces_username: string
  github_username: string
  linkedin_username: string
  created_at: string
  total_points: number
  level: number
}

interface CodingStats {
  platform: string
  total_problems: number
  problems_solved: number
  contest_rating: number
  level: string
}

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [codingStats, setCodingStats] = useState<CodingStats[]>([])
  const [loading, setLoading] = useState(true)
  const [badges, setBadges] = useState<any[]>([])
  const [earnedBadgeIds, setEarnedBadgeIds] = useState<string[]>([])
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

      // Fetch profile
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', authUser.id).single()

      if (profileData) {
        setProfile(profileData)
      }

      // Fetch coding stats
      const { data: statsData } = await supabase
        .from('coding_stats')
        .select('*')
        .eq('user_id', authUser.id)

      if (statsData) {
        setCodingStats(statsData)
      }

      // Fetch all badges
      const { data: badgesData } = await supabase.from('badges').select('*').order('points_value', { ascending: true })
      if (badgesData) setBadges(badgesData)

      // Fetch user earned badges
      const { data: userBadgesData } = await supabase
        .from('user_badges')
        .select('badge_id')
        .eq('user_id', authUser.id)

      if (userBadgesData) {
        setEarnedBadgeIds(userBadgesData.map((ub: any) => ub.badge_id))
      }

      setLoading(false)
    }

    checkAuth()
  }, [router, supabase])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/dashboard" className="text-slate-400 hover:text-white flex items-center text-sm transition-colors">
            <Button variant="ghost" size="sm" className="pl-0 hover:bg-transparent hover:text-white">
              ← Back to Dashboard
            </Button>
          </Link>
        </div>

        <ProfileCard
          user={user}
          profile={profile}
          isOwnProfile={true}
          codingStats={codingStats}
          badges={badges}
          earnedBadgeIds={earnedBadgeIds}
        />
      </div>
    </div>
  )
}
