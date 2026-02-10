'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { Trophy, Zap, MapPin, Calendar, Edit3, Link as LinkIcon, Github, Twitter, Linkedin, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { FollowButton } from '@/components/profile/follow-button'

interface ProfileCardProps {
  user?: User
  profile: any
  isOwnProfile?: boolean
}

export function ProfileCard({ user, profile, isOwnProfile = true }: ProfileCardProps) {
  // Use profile avatar or fallback to user metadata or initial
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url
  const displayName = profile?.display_name || user?.user_metadata?.display_name || 'Coder'
  const username = profile?.username || user?.user_metadata?.username || user?.email?.split('@')[0] || 'user'
  const initial = displayName.charAt(0).toUpperCase()

  // Format join date
  const joinDate = new Date(profile?.created_at || user?.created_at || Date.now()).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  })

  // State for checking if we follow this user
  const [isFollowing, setIsFollowing] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (!isOwnProfile && profile?.id) {
      const checkFollowStatus = async () => {
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        if (currentUser) {
          const { data } = await supabase
            .from('follows')
            .select('*')
            .eq('follower_id', currentUser.id)
            .eq('following_id', profile.id)
            .maybeSingle()
          setIsFollowing(!!data)
        }
      }
      checkFollowStatus()
    }
  }, [isOwnProfile, profile?.id, supabase])

  return (
    <div className="group relative overflow-hidden bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl transition-all hover:border-purple-500/30">

      {/* Decorative Background Pattern */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>

      {profile?.banner_url ? (
        <div
          className="absolute top-0 left-0 right-0 h-32 bg-cover bg-center"
          style={{ backgroundImage: `url(${profile.banner_url})` }}
        >
          <div className="absolute inset-0 bg-black/20"></div> {/* Overlay for readability */}
        </div>
      ) : (
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 opacity-90"></div>
      )}

      {/* Content Container */}
      <div className="relative pt-16 px-6 pb-6">

        {/* Header Section with Avatar */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-end mb-6">
          <div className="relative">
            <div className="rounded-full p-1.5 bg-slate-900 ring-4 ring-slate-900/50">
              <Avatar className="w-24 h-24 border-2 border-slate-700">
                <AvatarImage src={avatarUrl} alt={displayName} className="object-cover" />
                <AvatarFallback className="text-3xl bg-slate-800 text-purple-400 font-bold">{initial}</AvatarFallback>
              </Avatar>
            </div>
            <div className="absolute bottom-1 right-1 bg-green-500 w-5 h-5 rounded-full border-4 border-slate-900" title="Online"></div>
          </div>

          <div className="flex-1 min-w-0 pt-2 md:pt-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <h2 className="text-3xl font-bold text-white tracking-tight truncate">{displayName}</h2>
                <p className="text-slate-400 font-medium">@{username}</p>
              </div>

              {isOwnProfile ? (
                <Link href="/profile/edit">
                  <Button variant="outline" size="sm" className="hidden md:flex bg-slate-800/50 backdrop-blur border-slate-700 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors">
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                  {/* Mobile Edit Button */}
                  <Button variant="outline" size="icon" className="md:hidden absolute top-4 right-4 bg-black/20 backdrop-blur border-white/10 text-white hover:bg-black/40">
                    <Edit3 className="w-4 h-4" />
                  </Button>
                </Link>
              ) : (
                <FollowButton
                  targetUserId={profile.id}
                  initialIsFollowing={isFollowing}
                />
              )}
            </div>

            {/* Bio & Meta */}
            {profile?.bio && (
              <p className="text-slate-300 mt-2 text-sm leading-relaxed max-w-2xl line-clamp-2">{profile.bio}</p>
            )}

            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-400 font-medium">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Joined {joinDate}</span>
              </div>
              {/* Placeholders for future location/links */}
              {/* <div className="flex items-center gap-1.5">
                 <MapPin className="w-3.5 h-3.5" />
                 <span>San Francisco, CA</span>
               </div> */}
            </div>
          </div>
        </div>

        {/* Links / Socials Row */}
        <div className="flex gap-3 mb-6">
          {profile?.github_username && (
            <Link href={`https://github.com/${profile.github_username}`} target="_blank" className="p-2 bg-slate-800 rounded-full hover:bg-[#333] hover:text-white transition-colors text-slate-400">
              <Github className="w-5 h-5" />
            </Link>
          )}
          {profile?.linkedin_username && (
            <Link href={profile.linkedin_username.startsWith('http') ? profile.linkedin_username : `https://linkedin.com/in/${profile.linkedin_username}`} target="_blank" className="p-2 bg-slate-800 rounded-full hover:bg-[#0077b5] hover:text-white transition-colors text-slate-400">
              <Linkedin className="w-5 h-5" />
            </Link>
          )}
          {profile?.leetcode_username && (
            <Link href={`https://leetcode.com/${profile.leetcode_username}`} target="_blank" className="px-3 py-1.5 bg-slate-800 rounded-full hover:bg-yellow-600/20 hover:text-yellow-500 transition-colors text-slate-400 text-xs font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
              LeetCode
            </Link>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-2">
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 transition-all hover:bg-slate-800/60 group">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-500 group-hover:scale-110 transition-transform">
                <Zap className="w-5 h-5" />
              </div>
              <span className="text-sm text-slate-400 font-medium">Total Points</span>
            </div>
            <div className="text-2xl font-bold text-white">{profile?.total_points || 0}</div>
          </div>

          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 transition-all hover:bg-slate-800/60 group">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500 group-hover:scale-110 transition-transform">
                <Trophy className="w-5 h-5" />
              </div>
              <span className="text-sm text-slate-400 font-medium">Level {profile?.level || 1}</span>
            </div>
            <div className="w-full bg-slate-700/50 h-1.5 rounded-full mt-1 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full" style={{ width: `${profile?.level_progress || 0}%` }}></div>
            </div>
            <div className="text-xs text-slate-500 mt-1.5 text-right">{profile?.level_progress || 0}% to next level</div>
          </div>

          {/* Add more stats if needed, or placeholders */}
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 transition-all hover:bg-slate-800/60 group">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500 group-hover:scale-110 transition-transform">
                <LinkIcon className="w-5 h-5" />
              </div>
              <span className="text-sm text-slate-400 font-medium">Following</span>
            </div>
            <div className="text-2xl font-bold text-white">{profile?.following_count || 0}</div>
          </div>

          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 transition-all hover:bg-slate-800/60 group">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-pink-500/10 rounded-lg text-pink-500 group-hover:scale-110 transition-transform">
                <Trophy className="w-5 h-5" />
              </div>
              <span className="text-sm text-slate-400 font-medium">Followers</span>
            </div>
            <div className="text-2xl font-bold text-white">{profile?.followers_count || 0}</div>
          </div>
        </div>

      </div>
    </div>
  )
}
