'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Save, Github, Code, Globe, Terminal, Linkedin, User, Upload, X } from 'lucide-react'
import { toast } from 'sonner'

interface EditProfileFormProps {
    onSuccess?: () => void
    onCancel?: () => void
}

export function EditProfileForm({ onSuccess, onCancel }: EditProfileFormProps) {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState({
        username: '',
        display_name: '',
        bio: '',
        avatar_url: '',
        leetcode_username: '',
        github_username: '',
        codeforces_username: '',
        geeksforgeeks_username: '',
        linkedin_username: '',
        banner_url: ''
    })

    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()

                if (!user) return

                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single()

                if (error) throw error

                if (profile) {
                    setFormData({
                        username: profile.username || '',
                        display_name: profile.display_name || '',
                        bio: profile.bio || '',
                        avatar_url: profile.avatar_url || '',
                        leetcode_username: profile.leetcode_username || '',
                        github_username: profile.github_username || '',
                        codeforces_username: profile.codeforces_username || '',
                        geeksforgeeks_username: profile.geeksforgeeks_username || '',
                        linkedin_username: profile.linkedin_username || '',
                        banner_url: profile.banner_url || ''
                    })
                }
            } catch (error) {
                console.error('Error fetching profile:', error)
                toast.error('Failed to load profile')
            } finally {
                setLoading(false)
            }
        }

        fetchProfile()
    }, [supabase])

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

            setFormData(prev => ({ ...prev, [field]: publicUrl }))
            toast.success('Image uploaded successfully!')
        } catch (error: any) {
            console.error('Error uploading image:', error)
            toast.error('Error uploading image')
        } finally {
            setSaving(false)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            // Check if username is taken (if changed)
            if (formData.username) {
                const { data: existingUser, error: checkError } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('username', formData.username)
                    .neq('id', user.id) // Exclude current user
                    .single()

                if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found", which is good
                    throw checkError
                }

                if (existingUser) {
                    toast.error('Username is already taken. Please choose another one.')
                    setSaving(false)
                    return
                }
            }

            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    username: formData.username,
                    display_name: formData.display_name,
                    bio: formData.bio,
                    avatar_url: formData.avatar_url,
                    leetcode_username: formData.leetcode_username,
                    github_username: formData.github_username,
                    codeforces_username: formData.codeforces_username,
                    geeksforgeeks_username: formData.geeksforgeeks_username,
                    linkedin_username: formData.linkedin_username,
                    banner_url: formData.banner_url,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id)

            if (profileError) {
                if (profileError.code === '23505') { // Postgres unique violation code
                    toast.error('Username is already taken. Please choose another one.')
                    return
                }
                throw profileError
            }

            // Trigger server-side stats update
            const response = await fetch('/api/profile/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    leetcode: formData.leetcode_username,
                    github: formData.github_username,
                    codeforces: formData.codeforces_username,
                    geeksforgeeks: formData.geeksforgeeks_username
                }),
            })

            if (!response.ok) {
                toast.warning('Profile saved, but stats sync failed.')
            } else {
                toast.success('Profile updated successfully!')
            }

            router.refresh()
            if (onSuccess) onSuccess()

        } catch (error: any) {
            console.error('Error updating profile:', error)
            toast.error(error.message || 'Failed to update profile')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">

            {/* Basic Info */}
            <div className="space-y-4">
                <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Public Profile</h3>

                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-700">
                        {formData.avatar_url ? (
                            <img src={formData.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <User className="w-8 h-8 text-slate-400" />
                        )}
                    </div>
                    <div className="flex-1 space-y-2">
                        <Label htmlFor="avatar-upload" className="text-slate-200">Profile Photo</Label>
                        <div className="flex gap-2">
                            <Input
                                id="avatar-upload"
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileUpload(e, 'avatars', 'avatar_url')}
                                className="bg-slate-800 border-slate-700 text-white file:text-purple-400 file:hover:text-purple-300"
                            />
                            {formData.avatar_url && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setFormData(prev => ({ ...prev, avatar_url: '' }))}
                                    className="text-slate-400 hover:text-red-400"
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            )}
                        </div>
                        {/* Hidden input to store URL if manually edited (optional, keeping it simple for now) */}
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="banner-upload" className="text-slate-200">Banner Image</Label>
                    <div className="flex gap-2">
                        <Input
                            id="banner-upload"
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, 'banners', 'banner_url')}
                            className="bg-slate-800 border-slate-700 text-white file:text-purple-400 file:hover:text-purple-300"
                        />
                        {formData.banner_url && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => setFormData(prev => ({ ...prev, banner_url: '' }))}
                                className="text-slate-400 hover:text-red-400"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                    {formData.banner_url && (
                        <div className="relative h-20 w-full rounded-md overflow-hidden border border-slate-700 mt-2">
                            <img src={formData.banner_url} alt="Banner Preview" className="w-full h-full object-cover" />
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="username" className="text-slate-200">Username</Label>
                        <Input
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            className="bg-slate-800 border-slate-700 text-white"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="display_name" className="text-slate-200">Display Name</Label>
                        <Input
                            id="display_name"
                            name="display_name"
                            value={formData.display_name}
                            onChange={handleChange}
                            className="bg-slate-800 border-slate-700 text-white"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="bio" className="text-slate-200">Bio</Label>
                    <Input
                        id="bio"
                        name="bio"
                        value={formData.bio}
                        onChange={handleChange}
                        className="bg-slate-800 border-slate-700 text-white"
                        placeholder="Software Engineer @ Tech"
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Linkedin className="w-4 h-4 text-blue-400" />
                        <Label htmlFor="linkedin_username" className="text-slate-200">LinkedIn Profile URL / ID</Label>
                    </div>
                    <Input
                        id="linkedin_username"
                        name="linkedin_username"
                        value={formData.linkedin_username}
                        onChange={handleChange}
                        className="bg-slate-800 border-slate-700 text-white"
                        placeholder="https://linkedin.com/in/username"
                    />
                </div>
            </div>

            {/* Coding Profiles */}
            <div className="space-y-4">
                <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Terminal className="w-4 h-4" />
                    Coding Platforms
                </h3>

                <div className="grid grid-cols-1 gap-4">
                    <div className="relative">
                        <Code className="absolute left-3 top-3 w-4 h-4 text-yellow-500" />
                        <Input
                            name="leetcode_username"
                            value={formData.leetcode_username}
                            onChange={handleChange}
                            className="bg-slate-800 border-slate-700 text-white pl-10"
                            placeholder="LeetCode Username"
                        />
                    </div>
                    <div className="relative">
                        <Github className="absolute left-3 top-3 w-4 h-4 text-white" />
                        <Input
                            name="github_username"
                            value={formData.github_username}
                            onChange={handleChange}
                            className="bg-slate-800 border-slate-700 text-white pl-10"
                            placeholder="GitHub Username"
                        />
                    </div>
                    <div className="relative">
                        <Globe className="absolute left-3 top-3 w-4 h-4 text-blue-500" />
                        <Input
                            name="codeforces_username"
                            value={formData.codeforces_username}
                            onChange={handleChange}
                            className="bg-slate-800 border-slate-700 text-white pl-10"
                            placeholder="Codeforces Handle"
                        />
                    </div>
                    <div className="relative">
                        <div className="absolute left-3 top-3 w-4 h-4 flex items-center justify-center font-bold text-green-500 text-xs">G</div>
                        <Input
                            name="geeksforgeeks_username"
                            value={formData.geeksforgeeks_username}
                            onChange={handleChange}
                            className="bg-slate-800 border-slate-700 text-white pl-10"
                            placeholder="GeeksforGeeks Username"
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-between pt-6 border-t border-slate-800">
                <Button type="button" variant="ghost" onClick={onCancel} className="text-slate-400 hover:text-white">
                    Cancel
                </Button>
                <Button
                    type="submit"
                    disabled={saving}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                    {saving ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                        </>
                    )}
                </Button>
            </div>
        </form>
    )
}
