'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation' // Use useParams for dynamic routes in client components
import { createClient } from '@/lib/supabase/client'
import { ProfileCard } from '@/components/dashboard/profile-card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function PublicProfilePage() {
    const params = useParams()
    const userId = params.id as string
    const [profile, setProfile] = useState<any>(null)
    const [codingStats, setCodingStats] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    const supabase = createClient()

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Get current user to check if it's their own profile
                const { data: { user } } = await supabase.auth.getUser()
                setCurrentUserId(user?.id || null)

                // Fetch requested profile
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .single()

                if (error) throw error
                setProfile(data)

                // Fetch coding stats
                const { data: statsData } = await supabase
                    .from('coding_stats')
                    .select('*')
                    .eq('user_id', userId)

                if (statsData) {
                    setCodingStats(statsData)
                }

            } catch (error) {
                console.error('Error fetching publicly profile:', error)
            } finally {
                setLoading(false)
            }
        }

        if (userId) fetchData()
    }, [userId, supabase])

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            </div>
        )
    }

    if (!profile) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
                <h1 className="text-2xl text-white font-bold mb-4">User not found</h1>
                <Link href="/dashboard">
                    <Button variant="outline">Go Home</Button>
                </Link>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                    <Link href="/dashboard" className="text-slate-400 hover:text-white flex items-center text-sm transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Dashboard
                    </Link>
                </div>

                <ProfileCard
                    profile={profile}
                    isOwnProfile={currentUserId === userId}
                    codingStats={codingStats}
                />
            </div>
        </div>
    )
}
