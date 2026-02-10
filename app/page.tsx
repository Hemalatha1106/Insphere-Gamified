'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Trophy, Users, Zap, TrendingUp, MessageCircle, Award } from 'lucide-react'

export default function Page() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        setIsAuthenticated(true)
        router.push('/dashboard')
      } else {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router, supabase])

  if (loading) {
    return null
  }

  const features = [
    {
      icon: <Trophy className="w-8 h-8" />,
      title: 'Track Progress',
      description: 'Monitor your coding stats across LeetCode, GeeksforGeeks, Codeforces, and GitHub in one place.',
      color: 'from-yellow-500 to-orange-500',
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: 'Gamification',
      description: 'Earn points, unlock badges, and level up as you solve problems and achieve milestones.',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: 'Community',
      description: 'Connect with other competitive programmers, share knowledge, and collaborate on challenges.',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: <MessageCircle className="w-8 h-8" />,
      title: 'Direct Messaging',
      description: 'Chat one-on-one with other members to discuss strategies and build friendships.',
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: 'Analytics',
      description: 'Visualize your growth with detailed charts and insights about your progress.',
      color: 'from-red-500 to-pink-500',
    },
    {
      icon: <Award className="w-8 h-8" />,
      title: 'Leaderboards',
      description: 'Compete globally with others and see where you stand in the community.',
      color: 'from-indigo-500 to-purple-500',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
      {/* Navigation */}
      <nav className="border-b border-slate-800 bg-slate-950/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 bg-clip-text text-transparent">
            INSPHERE
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost" className="text-slate-300 hover:text-white">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Your Competitive Programming{' '}
            <span className="bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 bg-clip-text text-transparent">
              Command Center
            </span>
          </h1>
          <p className="text-xl text-slate-400 mb-8 max-w-2xl mx-auto">
            Track progress across all coding platforms, earn badges, compete with friends, and grow as a competitive programmer in one gamified ecosystem.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/sign-up">
              <Button className="px-8 py-3 text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg">
                Start Free
              </Button>
            </Link>
            <Button variant="outline" className="px-8 py-3 text-lg border-purple-500/50 text-purple-400 hover:bg-purple-500/10 rounded-lg bg-transparent">
              Watch Demo
            </Button>
          </div>
        </div>

        {/* Hero Graphic */}
        <div className="relative h-96 md:h-[500px] bg-gradient-to-b from-purple-500/10 via-pink-500/5 to-transparent rounded-2xl border border-purple-500/20 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-10 left-10 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-10 w-40 h-40 bg-pink-500/20 rounded-full blur-3xl" />
          </div>
          <div className="relative text-center">
            <div className="text-6xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent">
              🎮 INSPHERE
            </div>
            <p className="text-slate-400 mt-4">Gamified Competitive Programming Platform</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-4xl font-bold text-center text-white mb-12">Powerful Features</h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="group bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-lg p-8 hover:border-purple-500/50 transition"
            >
              <div className={`w-14 h-14 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-slate-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-4 gap-6">
          {[
            { stat: '10K+', label: 'Active Coders' },
            { stat: '500K+', label: 'Problems Tracked' },
            { stat: '50K+', label: 'Badges Earned' },
            { stat: '100K+', label: 'Messages Sent' },
          ].map((item, idx) => (
            <div key={idx} className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-lg p-6 text-center">
              <p className="text-4xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent mb-2">{item.stat}</p>
              <p className="text-slate-400">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="text-4xl font-bold text-white mb-4">Ready to Level Up?</h2>
        <p className="text-xl text-slate-400 mb-8">Join thousands of competitive programmers already using Insphere to track their journey.</p>

        <Link href="/auth/sign-up">
          <Button className="px-10 py-4 text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg">
            Get Started Now
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950/50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-500">
          <p>&copy; 2024 Insphere. Built for competitive programmers, by competitive programmers.</p>
        </div>
      </footer>
    </div>
  )
}
