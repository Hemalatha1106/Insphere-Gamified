import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Helper to extract username from input which might be a URL
const extractUsername = (input: string, platform: string): string => {
    if (!input) return ''
    input = input.trim()

    try {
        // If it's a URL, try to parse it
        if (input.startsWith('http://') || input.startsWith('https://')) {
            const url = new URL(input)
            const pathParts = url.pathname.split('/').filter(p => p.length > 0)

            switch (platform) {
                case 'leetcode':
                    // https://leetcode.com/u/username/ or https://leetcode.com/username/
                    if (pathParts[0] === 'u' && pathParts.length >= 2) return pathParts[1]
                    if (pathParts.length >= 1) return pathParts[0]
                    break
                case 'github':
                    // https://github.com/username
                    if (pathParts.length >= 1) return pathParts[0]
                    break
                case 'codeforces':
                    // https://codeforces.com/profile/username
                    if (pathParts[0] === 'profile' && pathParts.length >= 2) return pathParts[1]
                    break
                case 'geeksforgeeks':
                    // https://www.geeksforgeeks.org/user/username/ or /profile/username/
                    if ((pathParts[0] === 'user' || pathParts[0] === 'profile') && pathParts.length >= 2) return pathParts[1]
                    break
            }
        }
    } catch (e) {
        // Not a valid URL, assume it's just the username
        console.warn(`Could not parse URL for ${platform}: ${input}`, e)
    }

    // Fallback: return input as is, stripped of trailing slashes
    return input.replace(/\/$/, '')
}

export async function POST(request: Request) {
    try {
        const supabase = await createClient()

        // Verify authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        let { leetcode, github, codeforces, geeksforgeeks } = body
        const userId = user.id

        // Clean inputs
        leetcode = extractUsername(leetcode, 'leetcode')
        github = extractUsername(github, 'github')
        codeforces = extractUsername(codeforces, 'codeforces')
        geeksforgeeks = extractUsername(geeksforgeeks, 'geeksforgeeks')

        console.log('API Request - Extracted usernames:', { leetcode, github, codeforces, geeksforgeeks })

        // 1. Fetch Stats from external APIs
        const stats: any[] = []

        // --- LeetCode ---
        if (leetcode) {
            try {
                const lcRes = await fetch(`https://leetcode-stats-api.herokuapp.com/${leetcode}`)
                if (lcRes.ok) {
                    const lcData = await lcRes.json()
                    if (lcData.status === 'success') {
                        stats.push({
                            user_id: userId,
                            platform: 'leetcode',
                            total_problems: lcData.totalQuestions || 0,
                            problems_solved: lcData.totalSolved || 0,
                            contest_rating: 0,
                            level: lcData.ranking ? `Rank ${lcData.ranking}` : 'Active'
                        })
                    }
                }
            } catch (e) {
                console.error('LeetCode fetch error:', e)
            }
        }

        // --- GitHub ---
        if (github) {
            try {
                // Fetch basic info for followers/repos
                const ghRes = await fetch(`https://api.github.com/users/${github}`)
                let publicRepos = 0
                let followers = 0

                if (ghRes.ok) {
                    const ghData = await ghRes.json()
                    publicRepos = ghData.public_repos || 0
                    followers = ghData.followers || 0
                }

                // Fetch contribution stats (using a third-party API wrapper since GitHub API makes this hard without complex GraphQL)
                // Using: https://github-contributions-api.jogruber.de/v4/
                let totalContributions = 0
                try {
                    const contribRes = await fetch(`https://github-contributions-api.jogruber.de/v4/${github}?y=last`)
                    if (contribRes.ok) {
                        const contribData = await contribRes.json()
                        // Sum up total contributions for the current year/last year returned
                        // The structure is { total: { "2024": 123, ... }, contributions: [...] }
                        // Or sometimes just { total: { "lastYear": 123 } } depending on query.
                        // Let's use the 'total' object if available.
                        const totals = contribData.total || {}
                        // Sum all years/keys in total to be safe, or just take the most recent?
                        // The API docs say it returns total contributions per year.
                        totalContributions = Object.values(totals).reduce((a: any, b: any) => a + b, 0) as number
                    }
                } catch (e) {
                    console.error('GitHub contributions fetch error:', e)
                    // Fallback to public repos as a proxy if contributions fail
                    totalContributions = publicRepos
                }

                stats.push({
                    user_id: userId,
                    platform: 'github',
                    total_problems: publicRepos, // We'll label this "Repos" in UI
                    problems_solved: totalContributions, // We'll label this "Contributions" in UI
                    contest_rating: 0,
                    level: `${followers} Followers`
                })

            } catch (e) {
                console.error('GitHub fetch error:', e)
            }
        }

        // --- Codeforces ---
        if (codeforces) {
            try {
                // 1. User Info for Rating/Rank
                let rating = 0
                let rank = 'Unrated'

                const cfInfoRes = await fetch(`https://codeforces.com/api/user.info?handles=${codeforces}`)
                if (cfInfoRes.ok) {
                    const cfData = await cfInfoRes.json()
                    if (cfData.status === 'OK' && cfData.result?.length > 0) {
                        const user = cfData.result[0]
                        rating = user.rating || 0
                        rank = user.rank || 'Unrated'
                    }
                }

                // 2. User Status for Solved Count
                // We need to fetch submissions and count unique 'OK' verdicts
                let solvedCount = 0
                try {
                    const cfStatusRes = await fetch(`https://codeforces.com/api/user.status?handle=${codeforces}&from=1&count=1000`)
                    if (cfStatusRes.ok) {
                        const statusData = await cfStatusRes.json()
                        if (statusData.status === 'OK') {
                            const submissions = statusData.result || []
                            const solvedProblems = new Set()

                            submissions.forEach((sub: any) => {
                                if (sub.verdict === 'OK' && sub.problem) {
                                    // Create a unique key for the problem (contestId + index)
                                    const problemKey = `${sub.problem.contestId}-${sub.problem.index}`
                                    solvedProblems.add(problemKey)
                                }
                            })
                            solvedCount = solvedProblems.size
                        }
                    }
                } catch (e) {
                    console.error('Codeforces status fetch error:', e)
                }

                stats.push({
                    user_id: userId,
                    platform: 'codeforces',
                    total_problems: 0,
                    problems_solved: solvedCount,
                    contest_rating: rating,
                    level: rank
                })
            } catch (e) {
                console.error('Codeforces fetch error:', e)
            }
        }

        console.log('Stats collected:', stats)

        // --- GeeksforGeeks ---
        if (geeksforgeeks) {
            stats.push({
                user_id: userId,
                platform: 'geeksforgeeks',
                total_problems: 0,
                problems_solved: 0,
                contest_rating: 0,
                level: 'Connected'
            })
        }

        // 2. Update Database
        if (stats.length > 0) {
            const platforms = stats.map(s => s.platform)

            // Delete existing stats for these platforms to avoid duplicates
            const { error: delError } = await supabase
                .from('coding_stats')
                .delete()
                .eq('user_id', userId)
                .in('platform', platforms)

            if (delError) {
                console.error('Error deleting old stats:', delError)
            }

            const { error: insertError } = await supabase
                .from('coding_stats')
                .insert(stats)

            if (insertError) {
                console.error('Error inserting stats:', insertError)
                return NextResponse.json({ error: 'Failed to save stats' }, { status: 500 })
            }
        }

        // 3. Update total profile points
        let totalPoints = 0

        // Fetch all stats to calculate total points
        const { data: allStats } = await supabase
            .from('coding_stats')
            .select('*')
            .eq('user_id', userId)

        if (allStats) {
            allStats.forEach((s: any) => {
                if (s.platform === 'leetcode') totalPoints += (s.problems_solved * 10)
                if (s.platform === 'github') totalPoints += (s.problems_solved * 5) // weighted contributions less than full problems
                if (s.platform === 'codeforces') totalPoints += (s.problems_solved * 15) + (s.contest_rating > 0 ? s.contest_rating : 0)
            })
        }

        if (totalPoints > 0) {
            await supabase
                .from('profiles')
                .update({ total_points: totalPoints })
                .eq('id', userId)
        }

        // Update profile usernames
        await supabase.from('profiles').update({
            leetcode_username: leetcode,
            github_username: github,
            codeforces_username: codeforces,
            geeksforgeeks_username: geeksforgeeks
        }).eq('id', userId)


        return NextResponse.json({ success: true, stats })

    } catch (error: any) {
        console.error('Profile update error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
