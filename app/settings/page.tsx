'use client'

import React from "react"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Save, Upload, Settings, User } from 'lucide-react'
import { toast } from 'sonner'
import { Label } from '@/components/ui/label' // Added Label import
import { Loader2, Github, Code, Globe, Terminal, Linkedin, X } from 'lucide-react' // Added missing imports

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
    banner_url: string
}

export default function SettingsPage() {
    const [user, setUser] = useState<any>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
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

            setLoading(false)
        }

        checkAuth()
    }, [router, supabase])

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!profile || !user) return

        setSaving(true)
        setError(null)

        try {
            const { error: updateError } = await supabase.from('profiles').update({
                username: profile.username,
                display_name: profile.display_name,
                bio: profile.bio,
                avatar_url: profile.avatar_url,
                leetcode_username: profile.leetcode_username,
                geeksforgeeks_username: profile.geeksforgeeks_username,
                codeforces_username: profile.codeforces_username,
                github_username: profile.github_username,
                linkedin_username: profile.linkedin_username,
                banner_url: profile.banner_url,
                updated_at: new Date().toISOString()
            }).eq('id', user.id)

            if (updateError) throw updateError

            // Trigger server-side stats update
            const response = await fetch('/api/profile/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    leetcode: profile.leetcode_username,
                    github: profile.github_username,
                    codeforces: profile.codeforces_username,
                    geeksforgeeks: profile.geeksforgeeks_username
                }),
            })

            if (!response.ok) {
                toast.warning('Profile saved, but stats sync failed.')
            } else {
                toast.success('Profile updated successfully!')
            }

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update profile')
            toast.error('Failed to update profile')
        } finally {
            setSaving(false)
        }
    }

    const handleInputChange = (field: keyof Profile, value: string) => {
        setProfile((prev) => (prev ? { ...prev, [field]: value } : null))
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, bucket: 'avatars' | 'banners', field: 'avatar_url' | 'banner_url') => {
        const file = e.target.files?.[0]
        if (!file) return

        try {
            setSaving(true)
            const fileExt = file.name.split('.').pop()
            const fileName = `${Math.random()}.${fileExt}`
            const filePath = `${fileName}`

            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(filePath, file)

            if (uploadError) {
                throw uploadError
            }

            const { data: { publicUrl } } = supabase.storage
                .from(bucket)
                .getPublicUrl(filePath)

            setProfile(prev => (prev ? { ...prev, [field]: publicUrl } : null))
            toast.success('Image uploaded successfully!')
        } catch (error: any) {
            console.error('Error uploading image:', error)
            toast.error('Error uploading image')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-slate-400">Loading settings...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            {/* Navigation */}
            <nav className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                    <Link href="/dashboard" className="text-2xl font-bold bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 bg-clip-text text-transparent">
                        INSPHERE
                    </Link>
                    <div className="flex items-center gap-3">
                        <Link href="/dashboard">
                            <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
                                Dashboard
                            </Button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <Settings className="w-8 h-8 text-purple-400" />
                        <h1 className="text-4xl font-bold text-white">Settings</h1>
                    </div>
                    <p className="text-slate-400">Manage your account settings and preferences</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400">
                        {error}
                    </div>
                )}

                {profile && (
                    <form onSubmit={handleUpdate} className="space-y-6">
                        {/* Avatar Section */}
                        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-lg p-6">
                            <h2 className="text-xl font-bold text-white mb-4">Profile Picture</h2>
                            <div className="flex items-center gap-6">
                                <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-700">
                                    {profile.avatar_url ? (
                                        <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-8 h-8 text-slate-400" />
                                    )}
                                </div>
                                <div>
                                    <Label htmlFor="avatar-upload" className="sr-only">Upload Photo</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="avatar-upload"
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleFileUpload(e, 'avatars', 'avatar_url')}
                                            className="bg-slate-700 border-slate-600 text-white w-full"
                                        />
                                        {profile.avatar_url && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setProfile(prev => (prev ? { ...prev, avatar_url: '' } : null))}
                                                className="text-slate-400 hover:text-red-400"
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Basic Info */}
                        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-lg p-6">
                            <h2 className="text-xl font-bold text-white mb-4">Basic Information</h2>

                            <div className="space-y-4">
                                <div>
                                    <Label className="block text-sm font-medium text-slate-300 mb-2">Email</Label>
                                    <Input
                                        type="email"
                                        value={user?.email}
                                        disabled
                                        className="bg-slate-700 border-slate-600 text-slate-400 cursor-not-allowed"
                                    />
                                    <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
                                </div>

                                <div>
                                    <Label className="block text-sm font-medium text-slate-300 mb-2">Username</Label>
                                    <Input
                                        type="text"
                                        value={profile.username || ''}
                                        onChange={(e) => handleInputChange('username', e.target.value)}
                                        className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
                                    />
                                </div>

                                <div>
                                    <Label className="block text-sm font-medium text-slate-300 mb-2">Display Name</Label>
                                    <Input
                                        type="text"
                                        value={profile.display_name || ''}
                                        onChange={(e) => handleInputChange('display_name', e.target.value)}
                                        className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
                                    />
                                </div>

                                <div>
                                    <Label className="block text-sm font-medium text-slate-300 mb-2">Bio</Label>
                                    <textarea
                                        value={profile.bio || ''}
                                        onChange={(e) => handleInputChange('bio', e.target.value)}
                                        placeholder="Tell us about yourself..."
                                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 text-sm"
                                        rows={4}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Connected Platforms */}
                        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-lg p-6">
                            <h2 className="text-xl font-bold text-white mb-4">Connected Platforms</h2>

                            <div className="space-y-4">
                                <div>
                                    <Label className="block text-sm font-medium text-slate-300 mb-2">
                                        <span className="text-yellow-400">🟡</span> LeetCode Username
                                    </Label>
                                    <Input
                                        type="text"
                                        value={profile.leetcode_username || ''}
                                        onChange={(e) => handleInputChange('leetcode_username', e.target.value)}
                                        placeholder="your_leetcode_username"
                                        className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
                                    />
                                </div>

                                <div>
                                    <Label className="block text-sm font-medium text-slate-300 mb-2">
                                        <span className="text-green-400">🟢</span> GeeksforGeeks Username
                                    </Label>
                                    <Input
                                        type="text"
                                        value={profile.geeksforgeeks_username || ''}
                                        onChange={(e) => handleInputChange('geeksforgeeks_username', e.target.value)}
                                        placeholder="your_gfg_username"
                                        className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
                                    />
                                </div>

                                <div>
                                    <Label className="block text-sm font-medium text-slate-300 mb-2">
                                        <span className="text-blue-400">🔵</span> Codeforces Username
                                    </Label>
                                    <Input
                                        type="text"
                                        value={profile.codeforces_username || ''}
                                        onChange={(e) => handleInputChange('codeforces_username', e.target.value)}
                                        placeholder="your_codeforces_username"
                                        className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
                                    />
                                </div>

                                <div>
                                    <Label className="block text-sm font-medium text-slate-300 mb-2">
                                        <span className="text-gray-400">⚫</span> GitHub Username
                                    </Label>
                                    <Input
                                        type="text"
                                        value={profile.github_username || ''}
                                        onChange={(e) => handleInputChange('github_username', e.target.value)}
                                        placeholder="your_github_username"
                                        className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
                                    />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Linkedin className="w-4 h-4 text-blue-400" />
                                        <Label htmlFor="linkedin_username" className="text-slate-300">LinkedIn Profile URL / ID</Label>
                                    </div>
                                    <Input
                                        id="linkedin_username"
                                        name="linkedin_username"
                                        value={profile.linkedin_username || ''}
                                        onChange={(e) => handleInputChange('linkedin_username', e.target.value)}
                                        className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
                                        placeholder="https://linkedin.com/in/username"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Save Button */}
                        <div className="flex gap-4">
                            <Button
                                type="submit"
                                disabled={saving}
                                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium py-2 px-6 rounded-lg transition"
                            >
                                <Save className="w-4 h-4 mr-2" />
                                {saving ? 'Saving...' : 'Save Changes'}
                            </Button>
                            <Link href="/dashboard">
                                <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent">
                                    Cancel
                                </Button>
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    )
}
