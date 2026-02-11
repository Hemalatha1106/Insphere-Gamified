import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get('next') ?? '/'

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
            const isLocalEnv = process.env.NODE_ENV === 'development'
            if (isLocalEnv) {
                // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
                return NextResponse.redirect(`${origin}${next}`)
            } else if (forwardedHost) {
                return NextResponse.redirect(`https://${forwardedHost}${next}`)
            } else {
                return NextResponse.redirect(`${origin}${next}`)
            }
        } else {
            console.error('Auth callback error:', error)
            return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent(error.message)}`)
        }
    } else {
        console.error('Auth callback error: No code provided')
        return NextResponse.redirect(`${origin}/auth/auth-code-error?error=No+code+provided`)
    }

    // return the user to an error page with instructions e.g if code was missing but we handled it above
    // keeping this as fallback? Actually code above covers it. 
    // But structure of original file had the return at the end.
    // The previous code block had logic that didn't return in the `else` of `if (code)`?
    // No, wait. 
    // Original: 
    // if (code) { ... if (!error) return ... }
    // return redirect error

    // I will restructure slightly to be clear
    return NextResponse.redirect(`${origin}/auth/auth-code-error?error=Unknown+error`)
}
