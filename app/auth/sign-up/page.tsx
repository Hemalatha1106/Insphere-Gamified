'use client'

import React from "react"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  // Strict email validation regex
  const validateEmail = (email: string) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    return re.test(email)
  }

  const checkUsernameAvailability = async (username: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .single()

    // If we get a result, the username is taken
    if (data) return false
    // If error is "not found" (PGRST116), the username is available
    if (error && error.code === 'PGRST116') return true

    // Any other error, we assume unavailable to be safe or throw
    return false
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()

    // Trim email to remove potential leading/trailing spaces
    const trimmedEmail = email.trim()

    console.log('RETRY: Sign up attempt with email:', trimmedEmail)
    const isValid = validateEmail(trimmedEmail)
    console.log('RETRY: Is email valid?', isValid)

    setLoading(true)
    setError(null)

    if (!isValid) {
      const msg = 'Please enter a valid email address.'
      setError(msg)
      toast({
        variant: "destructive",
        title: "Invalid Email",
        description: msg,
      })
      setLoading(false)
      return
    }

    try {
      // 1. Check if username exists
      const isUsernameAvailable = await checkUsernameAvailability(username)
      if (!isUsernameAvailable) {
        const msg = 'Username is already taken. Please choose another one.'
        toast({
          variant: "destructive",
          title: "Username Taken",
          description: msg,
        })
        throw new Error(msg)
      }

      // 2. Attempt Sign Up
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/auth/callback`,
          data: {
            username,
            display_name: displayName,
          },
        },
      })

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          const msg = 'User already exists with this email.'
          toast({
            variant: "destructive",
            title: "Sign Up Failed",
            description: msg,
          })
          throw new Error(msg)
        }
        throw signUpError
      }

      if (data.user) {
        console.log('SignUp Successful. Session:', data.session ? 'Created (Auto-confirm ON)' : 'Null (Confirm Required)')
        // Double check if identity exists (sometimes sign up returns user but no identity if email taken)
        if (data.user.identities && data.user.identities.length === 0) {
          throw new Error('User already exists with this email.')
        }

        setSuccess(true)
        setTimeout(() => {
          if (data.session) {
            // Auto-confirm is ON, user is logged in
            router.push('/dashboard')
          } else {
            // Confirm is OFF, user needs to check email
            router.push('/auth/sign-up-success')
          }
        }, 1500)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to sign up'
      setError(msg)
      if (!msg.includes('already exists') && !msg.includes('Username')) {
        toast({
          variant: "destructive",
          title: "Error",
          description: msg,
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    setLoading(true)
    setError(null)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })
      if (error) throw error
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to sign up with Google'
      setError(msg)
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
          <p className="text-slate-400">Join the Community</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 shadow-2xl">
          <h1 className="text-2xl font-bold text-white mb-6">Create Account</h1>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded text-red-400 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/50 rounded text-green-400 text-sm">
              Account created! Redirecting to confirmation page...
            </div>
          )}

          <div className="space-y-4 mb-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleSignUp}
              disabled={loading}
              className="w-full bg-white text-black hover:bg-slate-100 border-slate-200 font-medium py-2 rounded-lg transition flex items-center justify-center gap-2"
            >
              <svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Sign up with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-900 px-2 text-slate-500">Or continue with</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSignUp} className="space-y-4" noValidate>
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

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Username
              </label>
              <Input
                type="text"
                placeholder="your_username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="bg-slate-800 border-slate-700 text-white placeholder-slate-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Display Name
              </label>
              <Input
                type="text"
                placeholder="Your Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="bg-slate-800 border-slate-700 text-white placeholder-slate-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-slate-800 border-slate-700 text-white placeholder-slate-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium py-2 rounded-lg transition"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                  Creating account...
                </>
              ) : 'Sign Up'}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800">
            <p className="text-slate-400 text-sm text-center">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-purple-400 hover:text-purple-300 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-500 text-sm mt-8">
          Start tracking your competitive programming journey
        </p>
      </div>
    </div>
  )
}
