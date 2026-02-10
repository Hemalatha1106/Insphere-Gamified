'use client'

import React from "react"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { User, Settings as SettingsIcon, MapPin, Link as LinkIcon, Calendar, Github, Code, Terminal, Globe, Linkedin, Trophy, Medal } from 'lucide-react'

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

      setLoading(false)
    }

    checkAuth()
  }, [router, supabase])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Redirecting to profile...</p>
        </div>
      </div>
    )
  }

  return null // Should redirect
}
