'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft } from 'lucide-react'

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const supabase = createClient()

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setSuccess(false)

        try {
            const origin = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${origin}/auth/callback?next=/auth/update-password`,
            })

            if (error) throw error
            setSuccess(true)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to send reset email')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4">
            <div className="w-full max-w-md">
                {/* Logo/Title */}
                <div className="text-center mb-8">
                    <div className="text-4xl font-bold bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 bg-clip-text text-transparent mb-2">
                        INSPHERE
                    </div>
                    <p className="text-slate-400">Recover your account</p>
                </div>

                {/* Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 shadow-2xl">
                    <Link
                        href="/auth/login"
                        className="flex items-center text-slate-400 hover:text-white transition-colors mb-6 text-sm"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Login
                    </Link>

                    <h1 className="text-2xl font-bold text-white mb-6">Forgot Password</h1>

                    {error && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {success ? (
                        <div className="space-y-4">
                            <div className="p-3 bg-green-500/10 border border-green-500/50 rounded text-green-400 text-sm">
                                Check your email for the password reset link.
                            </div>
                            <p className="text-slate-400 text-sm">
                                If you don't see it, check your spam folder.
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Email
                                </label>
                                <Input
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="bg-slate-800 border-slate-700 text-white placeholder-slate-500"
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium py-2 rounded-lg transition"
                            >
                                {loading ? 'Sending link...' : 'Send Reset Link'}
                            </Button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}
