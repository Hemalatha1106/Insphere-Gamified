'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { UserNav } from '@/components/dashboard/user-nav'
import { NotificationsPopover } from '@/components/dashboard/notifications-popover'
import { Users, MessageSquare } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

export function GlobalNavbar() {
    const pathname = usePathname()

    // Hide navbar on landing page and auth pages
    if (!pathname || pathname === '/' || pathname.startsWith('/auth')) {
        return null
    }

    return <NavbarContent />
}

function NavbarContent() {
    const pathname = usePathname()
    const [user, setUser] = useState<any>(null)
    const [profile, setProfile] = useState<any>(null)
    const [unreadMessageCount, setUnreadMessageCount] = useState(0)
    const supabase = createClient()
    const { toast } = useToast()

    useEffect(() => {
        const checkAuth = async () => {
            const {
                data: { user: authUser },
            } = await supabase.auth.getUser()

            if (!authUser) return

            setUser(authUser)

            // Fetch profile
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', authUser.id)
                .single()

            if (profileData) {
                setProfile(profileData)
            }

            // Fetch unread messages count
            const { count } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('recipient_id', authUser.id)
                .eq('is_read', false)

            if (count !== null) {
                setUnreadMessageCount(count)
            }

            // Subscribe to new messages
            const channel = supabase
                .channel('global_navbar_messages')
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'messages',
                        filter: `recipient_id=eq.${authUser.id}`,
                    },
                    async (payload) => {
                        console.log('New message received in GlobalNavbar:', payload)
                        setUnreadMessageCount((prev) => prev + 1)

                        const newMessage = payload.new as any

                        // Fetch sender details for toast
                        const { data: sender } = await supabase
                            .from('profiles')
                            .select('display_name')
                            .eq('id', newMessage.sender_id)
                            .single()

                        if (sender) {
                            toast({
                                title: `New message from ${sender.display_name}`,
                                description: newMessage.content.length > 50
                                    ? newMessage.content.substring(0, 50) + '...'
                                    : newMessage.content,
                                duration: 5000,
                            })
                        }
                    }
                )
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'messages',
                        filter: `recipient_id=eq.${authUser.id}`,
                    },
                    async () => {
                        // Refetch count to be safe and accurate
                        const { count } = await supabase
                            .from('messages')
                            .select('*', { count: 'exact', head: true })
                            .eq('recipient_id', authUser.id)
                            .eq('is_read', false)

                        if (count !== null) {
                            setUnreadMessageCount(count)
                        }
                    }
                )
                .subscribe((status) => {
                    console.log('GlobalNavbar subscription status:', status)
                    if (status === 'SUBSCRIBED') {
                        // Optional: Refresh count on connect to be sure
                    }
                })

            return () => {
                supabase.removeChannel(channel)
            }
        }

        checkAuth()
    }, [])

    return (
        <nav className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                <Link href="/dashboard" className="text-2xl font-bold bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 bg-clip-text text-transparent">
                    INSPHERE
                </Link>

                <div className="flex items-center gap-3">
                    <Link href="/dashboard">
                        <Button variant="ghost" size="sm" className={`text-slate-300 hover:text-white ${pathname === '/dashboard' ? 'bg-white/10 text-white' : ''}`}>
                            Dashboard
                        </Button>
                    </Link>
                    <Link href="/community">
                        <Button variant="ghost" size="sm" className={`text-slate-300 hover:text-white ${pathname?.startsWith('/community') ? 'bg-white/10 text-white' : ''}`}>
                            <Users className="w-4 h-4 mr-2" />
                            Community
                        </Button>
                    </Link>
                    <Link href="/messages">
                        <Button variant="ghost" size="sm" className={`text-slate-300 hover:text-white relative ${pathname?.startsWith('/messages') ? 'bg-white/10 text-white' : ''}`}>
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Messages
                            {unreadMessageCount > 0 && (
                                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 ring-2 ring-slate-950 animate-pulse" />
                            )}
                        </Button>
                    </Link>

                    <NotificationsPopover />

                    {/* User Dropdown */}
                    {user && <UserNav user={user} profile={profile} />}
                </div>
            </div>
        </nav>
    )
}
