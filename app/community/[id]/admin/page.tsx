'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Check, X, Shield, Users, Loader2, Trash2, Plus, GripVertical } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface Member {
    id: string
    user_id: string
    role: string
    status: string
    joined_at: string
    profiles: {
        username: string
        display_name: string
        avatar_url: string
    }
}

export default function CommunityAdminPage() {
    const params = useParams()
    const router = useRouter()
    const supabase = createClient()
    const communityId = params.id as string

    const [members, setMembers] = useState<Member[]>([])
    const [loading, setLoading] = useState(true)
    const [isAdmin, setIsAdmin] = useState(false)
    const [communityName, setCommunityName] = useState('')
    const [communityDescription, setCommunityDescription] = useState('')
    const [communityTags, setCommunityTags] = useState<string[]>([])
    const [newTag, setNewTag] = useState('')
    const [isSaving, setIsSaving] = useState(false)

    const fetchMembers = async () => {
        try {
            // 1. Fetch members
            const { data: membersData, error: membersError } = await supabase
                .from('community_members')
                .select('*')
                .eq('community_id', communityId)
                .order('joined_at', { ascending: false })

            if (membersError) throw membersError
            if (!membersData || membersData.length === 0) {
                setMembers([])
                return
            }

            // 2. Fetch profiles for these members
            const userIds = membersData.map(m => m.user_id)
            const { data: profilesData, error: profilesError } = await supabase
                .from('profiles')
                .select('id, username, display_name, avatar_url')
                .in('id', userIds)

            if (profilesError) throw profilesError

            // 3. Merge data
            const profilesMap = new Map(profilesData?.map(p => [p.id, p]))

            const combinedMembers = membersData.map(member => ({
                ...member,
                profiles: profilesMap.get(member.user_id) || {
                    username: 'Unknown',
                    display_name: 'Unknown User',
                    avatar_url: null
                }
            }))

            setMembers(combinedMembers)
        } catch (error) {
            console.error('Error fetching members:', error)
        }
    }

    useEffect(() => {
        const checkAdminAndFetch = async () => {
            try {
                setLoading(true)
                const { data: { user } } = await supabase.auth.getUser()

                if (!user) {
                    router.push('/auth/login')
                    return
                }

                // Check if current user is admin
                const { data: memberData } = await supabase
                    .from('community_members')
                    .select('role')
                    .eq('community_id', communityId)
                    .eq('user_id', user.id)
                    .single()

                if (memberData?.role !== 'admin') {
                    router.push(`/community/${communityId}`)
                    return
                }

                setIsAdmin(true)

                // Fetch community details
                const { data: commData } = await supabase
                    .from('communities')
                    .select('name, description, tags')
                    .eq('id', communityId)
                    .single()

                if (commData) {
                    setCommunityName(commData.name)
                    setCommunityDescription(commData.description || '')
                    setCommunityTags(commData.tags || [])
                }

                await fetchMembers()
            } finally {
                setLoading(false)
            }
        }

        checkAdminAndFetch()
    }, [communityId, router, supabase])

    const handleUpdateStatus = async (memberId: string, newStatus: 'approved' | 'rejected') => {
        try {
            if (newStatus === 'rejected') {
                const { error } = await supabase
                    .from('community_members')
                    .delete()
                    .eq('id', memberId)

                if (error) throw error
            } else {
                const { error } = await supabase
                    .from('community_members')
                    .update({ status: newStatus })
                    .eq('id', memberId)

                if (error) throw error
            }

            await fetchMembers()
        } catch (error) {
            console.error('Error updating status:', error)
        }
    }

    const handleSaveDetails = async () => {
        setIsSaving(true)
        try {
            const { error } = await supabase
                .from('communities')
                .update({
                    description: communityDescription,
                    tags: communityTags
                })
                .eq('id', communityId)

            if (error) throw error

            toast.success('Community details updated successfully')
        } catch (error: any) {
            console.error('Error updating details:', error)
            toast.error('Failed to update details')
        } finally {
            setIsSaving(false)
        }
    }

    const handleAddTag = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && newTag.trim()) {
            if (!communityTags.includes(newTag.trim())) {
                setCommunityTags([...communityTags, newTag.trim()])
            }
            setNewTag('')
        }
    }

    const handleRemoveTag = (tagToRemove: string) => {
        setCommunityTags(communityTags.filter(tag => tag !== tagToRemove))
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            </div>
        )
    }

    if (!isAdmin) return null

    const pendingMembers = members.filter(m => m.status === 'pending')
    const approvedMembers = members.filter(m => m.status === 'approved')

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
            <div className="max-w-4xl mx-auto">
                <Link
                    href={`/community/${communityId}`}
                    className="text-slate-400 hover:text-white flex items-center mb-6"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Classroom
                </Link>

                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Manage Community</h1>
                        <p className="text-slate-400">Admin dashboard for {communityName}</p>
                    </div>
                    <div className="bg-purple-900/30 px-4 py-2 rounded-lg border border-purple-500/30 flex items-center text-purple-300">
                        <Shield className="w-5 h-5 mr-2" />
                        Admin Access
                    </div>
                </div>

                {/* Edit Details Section */}
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 mb-8">
                    <h2 className="text-xl font-bold text-white mb-6">Edit Details</h2>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Description (Bio)</label>
                            <Textarea
                                value={communityDescription}
                                onChange={(e) => setCommunityDescription(e.target.value)}
                                className="bg-slate-800 border-slate-700 text-white min-h-[100px]"
                                placeholder="Describe your community..."
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Tags (Press Enter to add)</label>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {communityTags.map(tag => (
                                    <Badge key={tag} variant="secondary" className="bg-purple-900/30 text-purple-300 hover:bg-purple-900/50">
                                        {tag}
                                        <button onClick={() => handleRemoveTag(tag)} className="ml-1 hover:text-white">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                            <Input
                                value={newTag}
                                onChange={(e) => setNewTag(e.target.value)}
                                onKeyDown={handleAddTag}
                                className="bg-slate-800 border-slate-700 text-white"
                                placeholder="Add a tag..."
                            />
                        </div>

                        <Button
                            onClick={handleSaveDetails}
                            disabled={isSaving}
                            className="bg-purple-600 hover:bg-purple-700"
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                            Save Changes
                        </Button>
                    </div>
                </div>

                {/* Pending Requests */}
                {pendingMembers.length > 0 && (
                    <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 mb-8">
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                            <span className="bg-yellow-500/10 text-yellow-400 px-2 py-1 rounded text-sm mr-2 border border-yellow-500/20">
                                {pendingMembers.length}
                            </span>
                            Pending Requests
                        </h2>
                        <div className="space-y-4">
                            {pendingMembers.map(member => (
                                <div key={member.id} className="flex items-center justify-between bg-slate-800/50 p-4 rounded-lg">
                                    <div className="flex items-center">
                                        {/* Avatar placeholder if needed */}
                                        <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center mr-3 text-white font-bold">
                                            {member.profiles?.username?.[0]?.toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="text-white font-bold">{member.profiles?.display_name || 'Unknown User'}</div>
                                            <div className="text-slate-400 text-sm">@{member.profiles?.username}</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            onClick={() => handleUpdateStatus(member.id, 'approved')}
                                            className="bg-green-600 hover:bg-green-700"
                                        >
                                            <Check className="w-4 h-4 mr-1" />
                                            Approve
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => handleUpdateStatus(member.id, 'rejected')}
                                        >
                                            <X className="w-4 h-4 mr-1" />
                                            Reject
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Member List */}
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 mb-8">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                        <Users className="w-5 h-5 mr-2 text-slate-400" />
                        Members ({approvedMembers.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {approvedMembers.map(member => (
                            <div key={member.id} className="flex items-center justify-between bg-slate-800/30 p-4 rounded-lg border border-slate-800/50">
                                <div className="flex items-center">
                                    <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center mr-3 text-white font-bold">
                                        {member.profiles?.username?.[0]?.toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="text-white font-medium flex items-center gap-2">
                                            {member.profiles?.display_name}
                                            {member.role === 'admin' && (
                                                <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full">
                                                    ADMIN
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-slate-500 text-xs">@{member.profiles?.username}</div>
                                    </div>
                                </div>
                                {member.role !== 'admin' && (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 px-2"
                                        onClick={() => {
                                            if (confirm(`Are you sure you want to remove ${member.profiles?.display_name || 'this member'}?`)) {
                                                handleUpdateStatus(member.id, 'rejected')
                                            }
                                        }}
                                    >
                                        <X className="w-4 h-4 mr-1" />
                                        Remove
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Danger Zone */}
                <div className="bg-red-950/20 border border-red-900/50 rounded-lg p-6">
                    <h2 className="text-xl font-bold text-red-500 mb-4 flex items-center">
                        <Trash2 className="w-5 h-5 mr-2" />
                        Danger Zone
                    </h2>
                    <p className="text-slate-400 mb-6 text-sm">
                        Deleting this community is irreversible. All channels, messages, and member associations will be permanently removed.
                    </p>
                    <Button
                        variant="destructive"
                        className="bg-red-600 hover:bg-red-700"
                        onClick={async () => {
                            const confirmed = confirm('Are you absolutely sure you want to delete this community? This action cannot be undone.')
                            if (!confirmed) return

                            // Double confirmation
                            const communityNameInput = prompt(`Please type "${communityName}" to confirm deletion:`)
                            if (communityNameInput !== communityName) {
                                alert('Community name does not match.')
                                return
                            }

                            try {
                                const { error } = await supabase
                                    .from('communities')
                                    .delete()
                                    .eq('id', communityId)

                                if (error) throw error

                                router.push('/community')
                            } catch (error: any) {
                                console.error('Error deleting community:', error)
                                alert(`Failed to delete community: ${error.message}`)
                            }
                        }}
                    >
                        Delete Community
                    </Button>
                </div>
            </div>
        </div>
    )
}
