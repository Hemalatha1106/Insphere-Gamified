import React from "react"
import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'

import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })

export const metadata: Metadata = {
  title: 'Insphere - Competitive Programming Platform',
  description: 'Gamified platform for tracking LeetCode, GeeksforGeeks, Codeforces, and GitHub profiles with community features',
  keywords: ['competitive programming', 'leetcode', 'codeforces', 'gamification', 'community'],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0f172a',
}

import { Toaster } from "@/components/ui/toaster"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.variable} ${jetbrains.variable} font-sans bg-slate-950 text-slate-100 antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
