import React from "react"
import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'

import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })

export const metadata: Metadata = {
  title: 'Insphere - Competitive Programming Tracking & Community Platform',
  description: 'Gamified platform for tracking LeetCode, GeeksforGeeks, Codeforces, and GitHub profiles with community features',
  keywords: ['competitive programming', 'leetcode', 'codeforces', 'gamification', 'community'],
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://insphere-gamified.vercel.app'),
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0f172a',
}

import { Toaster } from "@/components/ui/toaster"
import { GlobalNavbar } from "@/components/global-navbar"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.variable} ${jetbrains.variable} font-sans bg-slate-950 text-slate-100 antialiased`}>
        <GlobalNavbar />
        {children}
        <Toaster />
      </body>
    </html>
  )
}
