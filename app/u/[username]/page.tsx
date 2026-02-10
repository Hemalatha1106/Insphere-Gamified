'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { User, MapPin, Link as LinkIcon, Calendar, Github, Code, Terminal, Globe, Linkedin, Trophy, Share2, Download, Check } from 'lucide-react'
import { toPng } from 'html-to-image'
import { toast } from 'sonner'

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
    created_at: string
    total_points: number
    level: number
}

interface CodingStats {
    platform: string
    total_problems: number
    problems_solved: number
    contest_rating: number
    level: string
}

export default function PublicProfilePage() {
    const params = useParams()
    // params.username will be available from the hook
    const [profile, setProfile] = useState<Profile | null>(null)
    const [codingStats, setCodingStats] = useState<CodingStats[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)
    const profileRef = useRef<HTMLDivElement>(null)
    const supabase = createClient()

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                // Fetch profile by username
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('username', params.username)
                    .single()

                if (profileError) throw profileError
                setProfile(profileData)

                // Fetch coding stats
                const { data: statsData } = await supabase
                    .from('coding_stats')
                    .select('*')
                    .eq('user_id', profileData.id)

                if (statsData) {
                    setCodingStats(statsData)
                }
            } catch (err: any) {
                console.error('Error fetching profile:', err)
                setError('User not found')
            } finally {
                setLoading(false)
            }
        }

        fetchProfile()
    }, [params.username, supabase])

    const handleShare = () => {
        const url = window.location.href
        navigator.clipboard.writeText(url)
        setCopied(true)
        toast.success("Profile link copied to clipboard!")
        setTimeout(() => setCopied(false), 2000)
    }

    const handlePrint = () => {
        window.print()
    }

    const handleDownload = async () => {
        if (!profileRef.current) return

        try {
            toast.loading("Generating image...")
            // Small delay to ensure styles are caught
            setTimeout(async () => {
                const dataUrl = await toPng(profileRef.current as HTMLElement, { quality: 0.95, backgroundColor: '#020617' })
                const link = document.createElement('a')
                link.download = `${profile?.username || 'profile'}-card.png`
                link.href = dataUrl
                link.click()
                toast.dismiss()
                toast.success("Profile image downloaded!")
            }, 100)
        } catch (err) {
            console.error('Download failed', err)
            toast.error("Failed to generate image")
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-slate-400">Loading profile...</p>
                </div>
            </div>
        )
    }

    if (error || !profile) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-white mb-4">404</h1>
                    <p className="text-slate-400 mb-6">User not found</p>
                    <Link href="/">
                        <Button>Go Home</Button>
                    </Link>
                </div>
            </div>
        )
    }

    // Format date
    const joinedDate = new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    const totalSolved = codingStats
        .filter(stat => stat.platform.toLowerCase() !== 'github')
        .reduce((acc, curr) => acc + curr.problems_solved, 0)

    return (
        <div className="min-h-screen bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 print:p-0 print:bg-white">
            <div className="max-w-4xl mx-auto print:max-w-none">
                {/* Action Bar - Hidden in print */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8 print:hidden">
                    <Link href="/" className="text-3xl font-bold bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 bg-clip-text text-transparent transform hover:scale-105 transition-transform">
                        INSPHERE
                    </Link>
                    <div className="flex flex-wrap justify-center gap-3 w-full md:w-auto">
                        <Button onClick={handleShare} variant="outline" className="text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white transition-colors">
                            {copied ? <Check className="w-4 h-4 mr-2 text-green-500" /> : <Share2 className="w-4 h-4 mr-2" />}
                            {copied ? "Copied Link" : "Share Profile"}
                        </Button>
                        <Button onClick={handlePrint} variant="outline" className="text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white transition-colors">
                            <Download className="w-4 h-4 mr-2" />
                            PDF / Print
                        </Button>
                        <Button onClick={handleDownload} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/20 transition-all hover:scale-105">
                            <Download className="w-4 h-4 mr-2" />
                            To Image
                        </Button>
                    </div>
                </div>

                {/* Profile Card Ref for Download */}
                {/* Print styles applied here to make it full page */}
                <div ref={profileRef} className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl p-8 print:p-8 print:border-0 print:shadow-none print:bg-white print:text-black print:absolute print:top-0 print:left-0 print:w-full print:m-0">
                    <style type="text/css" media="print">
                        {`
                            @media print {
                                body {
                                    visibility: hidden;
                                    -webkit-print-color-adjust: exact;
                                    print-color-adjust: exact;
                                }
                                /* Hide everything in body */
                                body * {
                                    visibility: hidden;
                                }
                                /* Show only the profile card and its children */
                                .print\\:absolute, .print\\:absolute * {
                                    visibility: visible;
                                }
                                .print\\:absolute {
                                    position: absolute;
                                    left: 0;
                                    top: 0;
                                    width: 100%;
                                    margin: 0;
                                }
                                @page {
                                    size: auto;
                                    margin: 0mm;
                                }
                                .print\\:text-black { color: black !important; }
                                .print\\:bg-white { background-color: white !important; }
                                .print\\:bg-transparent { background-color: transparent !important; }
                                .print\\:border-gray-300 { border-color: #d1d5db !important; }
                            }
                        `}
                    </style>

                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row gap-8 items-start mb-10">
                        <div className="relative">
                            <div className="w-32 h-32 rounded-full border-4 border-slate-800 bg-slate-800 overflow-hidden shadow-xl">
                                {profile.avatar_url ? (
                                    <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-slate-700 text-slate-400">
                                        <User className="w-12 h-12" />
                                    </div>
                                )}
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full border-4 border-slate-900">
                                Lvl {profile.level}
                            </div>
                        </div>

                        <div className="flex-1">
                            <h1 className="text-4xl font-bold text-white mb-2 print:text-black">{profile.display_name}</h1>
                            <p className="text-xl text-slate-400 mb-4 font-mono print:text-gray-700">@{profile.username}</p>
                            <p className="text-slate-300 leading-relaxed max-w-2xl mb-6 print:text-black">
                                {profile.bio || "No bio yet."}
                            </p>

                            <div className="flex flex-wrap gap-4 text-sm text-slate-400 print:text-black">
                                <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1 rounded-full border border-slate-700 print:border-gray-300 print:bg-transparent">
                                    <Calendar className="w-4 h-4 print:text-black" />
                                    <span>Joined {joinedDate}</span>
                                </div>
                                <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1 rounded-full border border-slate-700 print:border-gray-300 print:bg-transparent">
                                    <Trophy className="w-4 h-4 text-yellow-500 print:text-black" />
                                    <span className="text-white font-medium print:text-black">{profile.total_points.toLocaleString()} Points</span>
                                </div>
                                <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1 rounded-full border border-slate-700 print:border-gray-300 print:bg-transparent">
                                    <Code className="w-4 h-4 text-green-400 print:text-black" />
                                    <span className="text-white font-medium print:text-black">{totalSolved} Problems Solved</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-slate-800 my-8" />

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                        {codingStats.length > 0 ? codingStats.map(stat => (
                            <div key={stat.platform} className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-slate-400 font-medium capitalize">{stat.platform}</h3>
                                    {stat.platform === 'leetcode' && <Code className="w-5 h-5 text-yellow-500" />}
                                    {stat.platform === 'github' && <Github className="w-5 h-5 text-white" />}
                                    {stat.platform === 'codeforces' && <Terminal className="w-5 h-5 text-blue-400" />}
                                    {stat.platform === 'geeksforgeeks' && <Globe className="w-5 h-5 text-green-500" />}
                                </div>
                                <div className="flex items-end gap-2">
                                    <span className="text-2xl font-bold text-white">{stat.problems_solved}</span>
                                    <span className="text-xs text-slate-500 mb-1">solved</span>
                                </div>
                            </div>
                        )) : (
                            <div className="col-span-4 text-center py-4 text-slate-500">
                                No coding stats connected.
                            </div>
                        )}
                    </div>

                    {/* Footer Links (Live in HTML, visible in image) */}
                    <div className="flex flex-wrap justify-center gap-4">
                        {profile.leetcode_username && (
                            <a href={`https://leetcode.com/${profile.leetcode_username}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                                <Code className="w-4 h-4" /> leetcode.com/{profile.leetcode_username}
                            </a>
                        )}
                        {profile.github_username && (
                            <a href={`https://github.com/${profile.github_username}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                                <Github className="w-4 h-4" /> github.com/{profile.github_username}
                            </a>
                        )}
                        {profile.linkedin_username && (
                            <a href={profile.linkedin_username.startsWith('http') ? profile.linkedin_username : `https://linkedin.com/in/${profile.linkedin_username}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                                <Linkedin className="w-4 h-4" /> linkedin.com/in/{profile.linkedin_username}
                            </a>
                        )}
                    </div>
                </div>

                <div className="mt-8 text-center space-y-4">
                    <Button onClick={handleDownload} variant="ghost" className="text-slate-400 hover:text-white pb-1 border-b border-transparent hover:border-slate-500 rounded-none h-auto px-0">
                        <Download className="w-3 h-3 mr-2" />
                        Download this card functionality not working? Click here to try again.
                    </Button>
                    <p className="text-slate-500 text-sm">Insphere - Gamified Coding Platform</p>
                </div>
            </div>
        </div>
    )
}
