'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { User, LogOut, Settings, Award } from 'lucide-react'

interface UserNavProps {
    user: {
        email?: string
        user_metadata?: {
            username?: string
            avatar_url?: string
            display_name?: string
        }
    }
}

export function UserNav({ user }: UserNavProps) {
    const router = useRouter()
    const supabase = createClient()
    const [open, setOpen] = useState(false)

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/auth/login')
    }

    const username = user?.user_metadata?.username || user?.email?.split('@')[0] || 'User'
    const initial = username.charAt(0).toUpperCase()
    const avatarUrl = user?.user_metadata?.avatar_url

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-slate-800">
                    <Avatar className="h-10 w-10 border-2 border-slate-700">
                        <AvatarImage src={avatarUrl} alt={username} />
                        <AvatarFallback className="bg-slate-800 text-purple-400 font-bold">{initial}</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-slate-900 border-slate-800 text-slate-200" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none text-white">{user?.user_metadata?.display_name || username}</p>
                        <p className="text-xs leading-none text-slate-400">
                            {user?.email}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-800" />
                <DropdownMenuGroup>
                    <DropdownMenuItem className="focus:bg-slate-800 focus:text-white cursor-pointer" onClick={() => router.push(`/u/${username}`)}>
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="focus:bg-slate-800 focus:text-white cursor-pointer" onClick={() => router.push('/dashboard')}>
                        <Award className="mr-2 h-4 w-4" />
                        <span>Badges & Stats</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="focus:bg-slate-800 focus:text-white cursor-pointer" onClick={() => router.push('/settings')}>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator className="bg-slate-800" />
                <DropdownMenuItem className="focus:bg-slate-800 focus:text-red-400 cursor-pointer text-red-400" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
