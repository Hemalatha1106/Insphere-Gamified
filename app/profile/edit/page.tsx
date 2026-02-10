'use client'

import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { EditProfileForm } from '@/components/profile/edit-profile-form'

export default function EditProfilePage() {
    const router = useRouter()

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
                <div className="mb-6">
                    <Link href="/dashboard" className="text-slate-400 hover:text-white flex items-center text-sm transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Dashboard
                    </Link>
                </div>

                <Card className="bg-slate-900 border-slate-800 shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold text-white">Edit Profile</CardTitle>
                        <CardDescription className="text-slate-400">
                            Update your personal details and connect your coding profiles to track your progress.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <EditProfileForm
                            onSuccess={() => router.push('/dashboard')}
                            onCancel={() => router.push('/dashboard')}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
