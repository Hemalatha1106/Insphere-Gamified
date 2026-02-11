'use client'

import React, { Suspense } from "react"
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

function AuthCodeErrorContent() {
    const searchParams = useSearchParams()
    const error = searchParams.get('error')

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4">
            <div className="w-full max-w-md text-center">
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 shadow-2xl flex flex-col items-center">
                    <div className="bg-red-500/10 p-4 rounded-full mb-6">
                        <AlertTriangle className="w-12 h-12 text-red-500" />
                    </div>

                    <h1 className="text-2xl font-bold text-white mb-4">Authentication Error</h1>

                    <p className="text-slate-400 mb-4">
                        There was an error verifying your email or signing you in.
                    </p>

                    {error && (
                        <div className="bg-red-950/50 border border-red-900/50 p-3 rounded-md mb-6 w-full break-words">
                            <p className="text-red-400 text-sm font-mono">{error}</p>
                        </div>
                    )}

                    <div className="flex flex-col gap-3 w-full">
                        <Link href="/auth/login" className="w-full">
                            <Button className="w-full bg-slate-800 hover:bg-slate-700 text-white font-medium py-2 rounded-lg transition">
                                Back to Login
                            </Button>
                        </Link>
                        <Link href="/auth/sign-up" className="w-full">
                            <Button variant="outline" className="w-full border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800">
                                Try Signing Up Again
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function AuthCodeErrorPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>}>
            <AuthCodeErrorContent />
        </Suspense>
    )
}
