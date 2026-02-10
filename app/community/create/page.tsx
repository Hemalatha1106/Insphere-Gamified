'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Loader2, Lock, Unlock } from 'lucide-react'
import Link from 'next/link'

export default function CreateCommunityPage() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: '',
        type: 'public',
        invite_code: '',
    })

    const categories = ['DSA', 'Web', 'ML', 'Competitive Programming', 'System Design', 'Other']

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                throw new Error('You must be logged in to create a community')
            }

            // 1. Create the community
            const { data: community, error: createError } = await supabase
                .from('communities')
                .insert([
                    {
                        name: formData.name,
                        description: formData.description,
                        category: formData.category,
                        type: formData.type,
                        invite_code: formData.type === 'private' ? formData.invite_code : null,
                        created_by: user.id
                    }
                ])
                .select()
                .single()

            if (createError) throw createError

            // 2. Add creator as admin
            const { error: memberError } = await supabase
                .from('community_members')
                .insert([
                    {
                        community_id: community.id,
                        user_id: user.id,
                        role: 'admin',
                        status: 'approved'
                    }
                ])

            if (memberError) {
                // Rollback (delete community if member creation fails)
                await supabase.from('communities').delete().eq('id', community.id)
                throw memberError
            }

            router.push(`/community/${community.id}`)
        } catch (err: any) {
            console.error('Error creating community:', err)
            setError(err.message || 'Failed to create community')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 flex items-center justify-center">
            <div className="w-full max-w-2xl">
                <div className="mb-6">
                    <Link href="/community" className="text-slate-400 hover:text-white flex items-center">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Discover
                    </Link>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 shadow-2xl">
                    <h1 className="text-3xl font-bold text-white mb-2">Create a Classroom</h1>
                    <p className="text-slate-400 mb-8">Start a new community for learning and collaboration.</p>

                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-white">Community Name</Label>
                            <Input
                                id="name"
                                placeholder="e.g. Advanced DSA Group"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                className="bg-slate-800 border-slate-700 text-white"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-white">Description</Label>
                            <Textarea
                                id="description"
                                placeholder="What is this community about?"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="bg-slate-800 border-slate-700 text-white min-h-[100px]"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="category" className="text-white">Category</Label>
                            <Select
                                value={formData.category}
                                onValueChange={(val) => setFormData({ ...formData, category: val })}
                                required
                            >
                                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                                    <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                    {categories.map((cat) => (
                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-slate-800">
                            <Label className="text-white">Privacy Settings</Label>
                            <RadioGroup
                                value={formData.type}
                                onValueChange={(val) => setFormData({ ...formData, type: val })}
                                className="flex flex-col gap-4"
                            >
                                <div className="flex items-center space-x-2 border border-slate-800 rounded-lg p-4 hover:bg-slate-800/50 transition cursor-pointer">
                                    <RadioGroupItem value="public" id="public" className="border-slate-500 text-purple-600" />
                                    <Label htmlFor="public" className="flex-1 cursor-pointer">
                                        <div className="flex items-center gap-2 mb-1 text-white">
                                            <Unlock className="w-4 h-4 text-green-400" />
                                            Public
                                        </div>
                                        <p className="text-sm text-slate-400">Anyone can find and request to join.</p>
                                    </Label>
                                </div>

                                <div className="flex items-center space-x-2 border border-slate-800 rounded-lg p-4 hover:bg-slate-800/50 transition cursor-pointer">
                                    <RadioGroupItem value="private" id="private" className="border-slate-500 text-purple-600" />
                                    <Label htmlFor="private" className="flex-1 cursor-pointer">
                                        <div className="flex items-center gap-2 mb-1 text-white">
                                            <Lock className="w-4 h-4 text-yellow-400" />
                                            Private
                                        </div>
                                        <p className="text-sm text-slate-400">Invite-only. Users need a code to join.</p>
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>

                        {formData.type === 'private' && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-4">
                                <Label htmlFor="invite_code" className="text-white">Invite Code</Label>
                                <Input
                                    id="invite_code"
                                    placeholder="e.g. SECRET123"
                                    value={formData.invite_code}
                                    onChange={(e) => setFormData({ ...formData, invite_code: e.target.value })}
                                    required
                                    className="bg-slate-800 border-slate-700 text-white"
                                />
                                <p className="text-xs text-slate-500">Share this code with people you want to invite.</p>
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 mt-6"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                'Create Community'
                            )}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    )
}
