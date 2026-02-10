'use client'

import { Button } from '@/components/ui/button'
import { Users, Lock, Unlock, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface Community {
    id: string
    name: string
    description: string
    category: string
    type: 'public' | 'private'
    created_at: string
}

interface CommunityCardProps {
    community: Community
    isMember: boolean
}

export function CommunityCard({ community, isMember }: CommunityCardProps) {
    return (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 hover:border-purple-500/50 transition-all group">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs px-2 py-1 rounded-full border ${community.type === 'public'
                                ? 'border-green-500/30 text-green-400 bg-green-500/10'
                                : 'border-yellow-500/30 text-yellow-400 bg-yellow-500/10'
                            }`}>
                            {community.type === 'public' ? 'Public' : 'Private'}
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full border border-purple-500/30 text-purple-400 bg-purple-500/10">
                            {community.category}
                        </span>
                    </div>
                    <h3 className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors">
                        {community.name}
                    </h3>
                </div>
                {community.type === 'private' ? (
                    <Lock className="w-5 h-5 text-slate-500" />
                ) : (
                    <Unlock className="w-5 h-5 text-slate-500" />
                )}
            </div>

            <p className="text-slate-400 text-sm mb-6 line-clamp-2 min-h-[40px]">
                {community.description || 'No description provided.'}
            </p>

            <div className="flex items-center justify-between mt-auto">
                <div className="flex items-center text-slate-500 text-sm">
                    <Users className="w-4 h-4 mr-1" />
                    <span>View Members</span>
                </div>

                <Link href={`/community/${community.id}`}>
                    <Button
                        variant={isMember ? "secondary" : "default"}
                        className={isMember ? "" : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"}
                    >
                        {isMember ? 'Open' : (community.type === 'public' ? 'Join' : 'Request')}
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </Link>
            </div>
        </div>
    )
}
