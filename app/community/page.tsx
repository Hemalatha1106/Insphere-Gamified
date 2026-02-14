'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CommunityCard } from '@/components/community/community-card'
import { CommunityDetailsDialog } from '@/components/community/community-details-dialog'
import { Plus, Search, Loader2 } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Community {
  id: string
  name: string
  description: string
  category: string
  type: 'public' | 'private'
  created_at: string
  created_by: string
  tags?: string[]
}

export default function CommunityPage() {
  const [communities, setCommunities] = useState<Community[]>([])
  const [myMemberships, setMyMemberships] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')

  // Dialog State
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const supabase = createClient()
  const router = useRouter()

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

  const handleCommunitySelect = (community: Community) => {
    setSelectedCommunity(community)
    setIsDialogOpen(true)
  }

  const handleJoinRequest = (communityId: string) => {
    // For now, redirect to the community page which handles joining
    router.push(`/community/${communityId}`)
  }

  const filteredCommunities = communities.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || c.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const myCommunities = filteredCommunities.filter(c => myMemberships.has(c.id))
  const discoverCommunities = filteredCommunities.filter(c => !myMemberships.has(c.id))

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Communities</h1>
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

        {/* Tabs and Content */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
          </div>
        ) : (
          <Tabs defaultValue="my-communities" className="w-full">
            <TabsList className="bg-slate-900 border border-slate-800 p-1 mb-6">
              <TabsTrigger
                value="my-communities"
                className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-slate-400"
              >
                My Communities
              </TabsTrigger>
              <TabsTrigger
                value="discover"
                className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-slate-400"
              >
                Discover
              </TabsTrigger>
            </TabsList>

            <TabsContent value="my-communities">
              {myCommunities.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myCommunities.map(community => (
                    <CommunityCard
                      key={community.id}
                      community={community}
                      isMember={true}
                      onSelect={handleCommunitySelect}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-slate-900/50 rounded-lg border border-slate-800 border-dashed">
                  <h3 className="text-xl font-bold text-white mb-2">You haven&apos;t joined any communities yet</h3>
                  <p className="text-slate-400">Head over to the Discover tab to find communities to join!</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="discover">
              {discoverCommunities.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {discoverCommunities.map(community => (
                    <CommunityCard
                      key={community.id}
                      community={community}
                      isMember={false}
                      onSelect={handleCommunitySelect}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-slate-900/50 rounded-lg border border-slate-800 border-dashed">
                  <h3 className="text-xl font-bold text-white mb-2">No active communities found</h3>
                  <p className="text-slate-400 mb-6">Be the first to create a community in this category!</p>
                  <Link href="/community/create">
                    <Button variant="outline" className="text-purple-400 border-purple-500/30 hover:bg-purple-500/10">
                      Create New Community
                    </Button>
                  </Link>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}

        {/* Details Dialog */}
        <CommunityDetailsDialog
          community={selectedCommunity}
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          isMember={selectedCommunity ? myMemberships.has(selectedCommunity.id) : false}
          onJoinRequest={handleJoinRequest}
        />
      </div>
    </div>
  )
}
