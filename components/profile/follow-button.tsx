'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Loader2, UserPlus, UserMinus } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation' // Add router for refresh

interface FollowButtonProps {
    targetUserId: string
    initialIsFollowing: boolean
    onFollowChange?: (isFollowing: boolean) => void
}

export function FollowButton({ targetUserId, initialIsFollowing, onFollowChange }: FollowButtonProps) {
    const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
    const [loading, setLoading] = useState(false)
    const supabase = createClient()
    const router = useRouter() // Use router

    // Sync state if prop changes (e.g. initial load)
    useEffect(() => {
        setIsFollowing(initialIsFollowing)
    }, [initialIsFollowing])

    const handleFollowToggle = async () => {
        setLoading(true)
        const newStatus = !isFollowing

        // Optimistic update
        setIsFollowing(newStatus)
        if (onFollowChange) onFollowChange(newStatus)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                toast.error('You must be logged in to follow users.')
                setIsFollowing(!newStatus) // Revert
                return
            }

            if (newStatus) {
                // Follow
                const { error } = await supabase
                    .from('follows')
                    .insert([{ follower_id: user.id, following_id: targetUserId }])

                if (error) throw error
                toast.success('Followed!')
            } else {
                // Unfollow
                const { error } = await supabase
                    .from('follows')
                    .delete()
                    .eq('follower_id', user.id)
                    .eq('following_id', targetUserId)

                if (error) throw error
                toast.success('Unfollowed.')
            }
            router.refresh() // Refresh to update counts
        } catch (error: any) {
            console.error('Error toggling follow:', error)
            toast.error('Failed to update follow status.')
            setIsFollowing(!newStatus) // Revert on error
            if (onFollowChange) onFollowChange(!newStatus)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button
            variant={isFollowing ? "outline" : "default"}
            size="sm"
            onClick={handleFollowToggle}
            disabled={loading}
            className={`transition-all ${isFollowing
                ? 'border-slate-600 text-slate-300 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/50'
                : 'bg-purple-600 hover:bg-purple-700 text-white'}`}
        >
            {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : isFollowing ? (
                <>
                    <UserMinus className="w-4 h-4 mr-2" />
                    Unfollow
                </>
            ) : (
                <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Follow
                </>
            )}
        </Button>
    )
}
