'use client'

import React from "react"
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CheckCircle } from 'lucide-react'

export default function SignUpSuccessPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4">
            <div className="w-full max-w-md text-center">
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 shadow-2xl flex flex-col items-center">
                    <div className="bg-green-500/10 p-4 rounded-full mb-6">
                        <CheckCircle className="w-12 h-12 text-green-500" />
                    </div>

                    <h1 className="text-2xl font-bold text-white mb-4">Account Created!</h1>

                    <p className="text-slate-400 mb-8">
                        Your account has been successfully created. You can now sign in to start your journey.
                    </p>

                    <Link href="/auth/login" className="w-full">
                        <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium py-2 rounded-lg transition">
                            Sign In
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    )
}
