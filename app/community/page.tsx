'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CommunityCard } from '@/components/community/community-card'
import { Plus, Search, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface Community {
  id: string
  name: string
  description: string
  category: string
  type: 'public' | 'private'
  created_at: string
}

export default function CommunityPage() {
  const [communities, setCommunities] = useState<Community[]>([])
  const [myMemberships, setMyMemberships] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')

  const supabase = createClient()

  const categories = ['All', 'DSA', 'Web', 'ML', 'Competitive Programming', 'System Design']

  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        setLoading(true)

        // Fetch communities
        const { data: communitiesData, error: communitiesError } = await supabase
          .from('communities')
          .select('*')
          .order('created_at', { ascending: false })

        if (communitiesError) throw communitiesError

        // Fetch user memberships to know which ones to mark as "joined"
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: membersData } = await supabase
            .from('community_members')
            .select('community_id')
            .eq('user_id', user.id)

          if (membersData) {
            setMyMemberships(new Set(membersData.map(m => m.community_id)))
          }
        }

        setCommunities(communitiesData || [])
      } catch (error) {
        console.error('Error fetching communities:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCommunities()
  }, [])

  const filteredCommunities = communities.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || c.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href="/dashboard" className="text-slate-400 hover:text-white flex items-center text-sm transition-colors mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Discover Communities</h1>
              <p className="text-slate-400">Join classrooms and groups to learn together</p>
            </div>
            <Link href="/community/create">
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Community
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
            <Input
              placeholder="Search communities..."
              className="pl-10 bg-slate-900 border-slate-800 text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 font-medium">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${selectedCategory === cat
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
          </div>
        ) : filteredCommunities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCommunities.map(community => (
              <CommunityCard
                key={community.id}
                community={community}
                isMember={myMemberships.has(community.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-slate-900/50 rounded-lg border border-slate-800 border-dashed">
            <h3 className="text-xl font-bold text-white mb-2">No communities found</h3>
            <p className="text-slate-400 mb-6">Try adjusting your filters or create your own community.</p>
            <Link href="/community/create">
              <Button variant="outline" className="text-purple-400 border-purple-500/30 hover:bg-purple-500/10">
                Create New Community
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
