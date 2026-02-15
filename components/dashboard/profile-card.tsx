'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { Trophy, Zap, MapPin, Calendar, Edit3, Link as LinkIcon, Github, Twitter, Linkedin, Loader2, UserPlus, UserCheck, UserMinus, MessageCircle, Code, Terminal, Globe, Users } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { FollowButton } from '@/components/profile/follow-button'
import { LeetCodeHeatmap } from '@/components/dashboard/leetcode-heatmap'

import { Badge as BadgeIcon } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface Badge {
  id: string
  name: string
  description: string
  category: string
  points_value: number
  icon_url?: string
}

interface ProfileCardProps {
  user?: User
  profile: any
  isOwnProfile?: boolean
  badges?: Badge[]
  earnedBadgeIds?: string[]
  codingStats?: any[]
  displayStatsAs?: 'tags' | 'boxes'
}

export function ProfileCard({ user, profile, isOwnProfile = true, badges = [], earnedBadgeIds = [], codingStats = [], displayStatsAs = 'tags' }: ProfileCardProps) {
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
  const [friendStatus, setFriendStatus] = useState<'none' | 'pending_sent' | 'pending_received' | 'friends'>('none')
  const [loadingFriendAction, setLoadingFriendAction] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (!isOwnProfile && profile?.id) {
      const checkStatus = async () => {
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        if (currentUser) {
          // Check follow status
          const { data: followData } = await supabase
            .from('follows')
            .select('*')
            .eq('follower_id', currentUser.id)
            .eq('following_id', profile.id)
            .maybeSingle()
          setIsFollowing(!!followData)

          // Check friend status
          // Sent request?
          const { data: sentRequest } = await supabase
            .from('friend_requests')
            .select('*')
            .eq('sender_id', currentUser.id)
            .eq('receiver_id', profile.id)
            .maybeSingle()

          if (sentRequest) {
            setFriendStatus(sentRequest.status === 'accepted' ? 'friends' : 'pending_sent')
            return
          }

          // Received request?
          const { data: receivedRequest } = await supabase
            .from('friend_requests')
            .select('*')
            .eq('sender_id', profile.id)
            .eq('receiver_id', currentUser.id)
            .maybeSingle()

          if (receivedRequest) {
            setFriendStatus(receivedRequest.status === 'accepted' ? 'friends' : 'pending_received')
          }
        }
      }
      checkStatus()
    }
  }, [isOwnProfile, profile?.id, supabase])

  const handleFriendAction = async (action: 'send' | 'accept' | 'remove') => {
    try {
      setLoadingFriendAction(true)
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) return

      if (action === 'send') {
        const { error } = await supabase
          .from('friend_requests')
          .insert([{ sender_id: currentUser.id, receiver_id: profile.id }])
        if (error) throw error
        setFriendStatus('pending_sent')
      } else if (action === 'accept') {
        const { error } = await supabase
          .from('friend_requests')
          .update({ status: 'accepted' })
          .eq('sender_id', profile.id)
          .eq('receiver_id', currentUser.id)
        if (error) throw error
        setFriendStatus('friends')
      } else if (action === 'remove') {
        // Delete any relationship
        const { error } = await supabase
          .from('friend_requests')
          .delete()
          .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${profile.id}),and(sender_id.eq.${profile.id},receiver_id.eq.${currentUser.id})`)
        if (error) throw error
        setFriendStatus('none')
      }
    } catch (error) {
      console.error('Error updating friend status:', error)
    } finally {
      setLoadingFriendAction(false)
    }
  }

  return (
    <div className="group relative overflow-hidden bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl transition-all hover:border-purple-500/30">

      {/* Decorative Background Pattern */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>

      {profile?.banner_url ? (
        <div
          className="absolute top-0 left-0 right-0 h-40 bg-cover bg-center"
          style={{ backgroundImage: `url(${profile.banner_url})` }}
        >
          <div className="absolute inset-0 bg-black/20"></div> {/* Overlay for readability */}
        </div>
      ) : (
        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 opacity-90"></div>
      )}

      {/* Content Container */}
      <div className="relative pt-28 px-6 pb-6">

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
                <div className="flex gap-2">
                  <FollowButton
                    targetUserId={profile.id}
                    initialIsFollowing={isFollowing}
                  />

                  {friendStatus === 'none' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                      onClick={() => handleFriendAction('send')}
                      disabled={loadingFriendAction}
                    >
                      {loadingFriendAction ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />}
                      Add Friend
                    </Button>
                  )}

                  {friendStatus === 'pending_sent' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled
                      className="opacity-70"
                    >
                      <UserCheck className="w-4 h-4 mr-2" />
                      Request Sent
                    </Button>
                  )}

                  {friendStatus === 'pending_received' && (
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleFriendAction('accept')}
                      disabled={loadingFriendAction}
                    >
                      {loadingFriendAction ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4 mr-2" />}
                      Accept Request
                    </Button>
                  )}

                  {friendStatus === 'friends' && (
                    <>
                      <Link href={`/messages?userId=${profile.id}`}>
                        <Button
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Message
                        </Button>
                      </Link>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
                        onClick={() => handleFriendAction('remove')}
                        title="Unfriend"
                        disabled={loadingFriendAction}
                      >
                        <UserMinus className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Bio & Meta */}
            {profile?.bio && (
              <p className="text-slate-300 mt-2 text-sm leading-relaxed max-w-2xl line-clamp-2">{profile.bio}</p>
            )}

            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-400 font-medium">
              <div className="flex items-center gap-2 px-3 py-1 bg-slate-800/50 border border-slate-700/50 rounded-full text-slate-300">
                <Calendar className="w-3.5 h-3.5" />
                <span>Joined {joinDate}</span>
              </div>

              {displayStatsAs === 'tags' && (
                <>
                  <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-yellow-500">
                    <Zap className="w-3.5 h-3.5" />
                    <span>{profile?.total_points || 0} Points</span>
                  </div>

                  <div className="flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-400">
                    <Trophy className="w-3.5 h-3.5" />
                    <span>Lvl {profile?.level || 1}</span>
                  </div>

                  <div className="flex items-center gap-2 px-3 py-1 bg-pink-500/10 border border-pink-500/20 rounded-full text-pink-400">
                    <Users className="w-3.5 h-3.5" />
                    <span>{profile?.followers_count || 0} Followers</span>
                  </div>

                  <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>{profile?.following_count || 0} Following</span>
                  </div>
                </>
              )}

              {/* Placeholders for future location/links */}
              {/* <div className="flex items-center gap-1.5">
                 <MapPin className="w-3.5 h-3.5" />
                 <span>San Francisco, CA</span>
               </div> */}
            </div>
          </div>
        </div>

        {/* Badges Row */}
        {earnedBadgeIds.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            <TooltipProvider>
              {badges
                .filter(b => earnedBadgeIds.includes(b.id))
                .slice(0, 5) // Show top 5
                .map(badge => (
                  <Tooltip key={badge.id}>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full cursor-help hover:bg-yellow-500/20 transition-colors">
                        <span className="text-sm">
                          {{
                            achievement: '🏆',
                            contest: '🎯',
                            community: '👥',
                            level: '⭐',
                            integration: '🔗',
                            consistency: '🔥',
                          }[badge.category] || '🎖️'}
                        </span>
                        <span className="text-xs font-medium text-yellow-500">{badge.name}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-bold">{badge.name}</p>
                      <p className="text-xs text-slate-400">{badge.description}</p>
                      <p className="text-xs text-yellow-500 mt-1">+{badge.points_value} pts</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
            </TooltipProvider>
            {earnedBadgeIds.length > 5 && (
              <Dialog>
                <DialogTrigger asChild>
                  <div className="flex items-center justify-center px-2 py-1 bg-slate-800 rounded-full border border-slate-700 cursor-pointer hover:bg-slate-700 transition-colors">
                    <span className="text-xs text-slate-400">+{earnedBadgeIds.length - 5} more</span>
                  </div>
                </DialogTrigger>
                <DialogContent className="bg-slate-900 border-slate-800 text-white sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Earned Badges ({earnedBadgeIds.length})</DialogTitle>
                  </DialogHeader>
                  <div className="flex flex-wrap gap-2 mt-4 max-h-[60vh] overflow-y-auto p-1">
                    <TooltipProvider>
                      {badges
                        .filter(b => earnedBadgeIds.includes(b.id))
                        .map(badge => (
                          <Tooltip key={badge.id}>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1.5 px-2 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full cursor-help hover:bg-yellow-500/20 transition-colors">
                                <span className="text-sm">
                                  {{
                                    achievement: '🏆',
                                    contest: '🎯',
                                    community: '👥',
                                    level: '⭐',
                                    integration: '🔗',
                                    consistency: '🔥',
                                  }[badge.category] || '🎖️'}
                                </span>
                                <span className="text-xs font-medium text-yellow-500">{badge.name}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="font-bold">{badge.name}</p>
                              <p className="text-xs text-slate-400">{badge.description}</p>
                              <p className="text-xs text-yellow-500 mt-1">+{badge.points_value} pts</p>
                            </TooltipContent>
                          </Tooltip>
                        ))}
                    </TooltipProvider>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        )}

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
          {profile?.geeksforgeeks_username && (
            <Link href={`https://www.geeksforgeeks.org/user/${profile?.geeksforgeeks_username}`} target="_blank" className="px-3 py-1.5 bg-slate-800 rounded-full hover:bg-green-600/20 hover:text-green-500 transition-colors text-slate-400 text-xs font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              GFG
            </Link>
          )}
        </div>





        {/* Stats Boxes (if enabled) */}
        {displayStatsAs === 'boxes' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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

            <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 transition-all hover:bg-slate-800/60 group">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-pink-500/10 rounded-lg text-pink-500 group-hover:scale-110 transition-transform">
                  <Trophy className="w-5 h-5" />
                </div>
                <span className="text-sm text-slate-400 font-medium">Followers</span>
              </div>
              <div className="text-2xl font-bold text-white">{profile?.followers_count || 0}</div>
            </div>

            <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 transition-all hover:bg-slate-800/60 group">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500 group-hover:scale-110 transition-transform">
                  <LinkIcon className="w-5 h-5" />
                </div>
                <span className="text-sm text-slate-400 font-medium">Following</span>
              </div>
              <div className="text-2xl font-bold text-white">{profile?.following_count || 0}</div>
            </div>
          </div>
        )}

        {/* Coding Stats Grid */}
        {displayStatsAs !== 'boxes' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {codingStats.length > 0 ? codingStats.map(stat => (
              <div key={stat.platform} className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 transition-all hover:bg-slate-800/60 group">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-slate-400 font-medium capitalize text-sm">{stat.platform}</h3>
                  <div className="p-1.5 bg-slate-800 rounded-lg group-hover:scale-110 transition-transform">
                    {stat.platform === 'leetcode' && <Code className="w-4 h-4 text-yellow-500" />}
                    {stat.platform === 'github' && <Github className="w-4 h-4 text-white" />}
                    {stat.platform === 'codeforces' && <Terminal className="w-4 h-4 text-blue-400" />}
                    {stat.platform === 'geeksforgeeks' && <Globe className="w-4 h-4 text-green-500" />}
                  </div>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-bold text-white">{stat.problems_solved}</span>
                  <span className="text-xs text-slate-500 mb-1">solved</span>
                </div>
              </div>
            )) : (
              // Don't show empty state if no stats, checking length above handles it.
              // But if we want a placeholder for empty:
              null
            )}
          </div>
        )}

        {/* LeetCode Heatmap */}
        {displayStatsAs !== 'boxes' && codingStats.find(s => s.platform === 'leetcode' && s.heatmap_data) && (
          <div className="mt-6 border-t border-slate-800 pt-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">LeetCode Activity</h3>
            </div>
            <div className="bg-slate-950/50 rounded-lg p-4 border border-slate-800 overflow-hidden">
              <LeetCodeHeatmap heatmapData={codingStats.find(s => s.platform === 'leetcode')?.heatmap_data} />
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
