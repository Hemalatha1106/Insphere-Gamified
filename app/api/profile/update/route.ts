import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// --- Helpers ---

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

// Logic based on user's provided reliable scraper
const extractObject = (unescapedData: string, key: string): any => {
    const searchPattern = `"${key}":`
    const startIdx = unescapedData.indexOf(searchPattern)
    if (startIdx === -1) return null

    let openBraceIdx = unescapedData.indexOf('{', startIdx)
    if (openBraceIdx === -1) return null

    let braceCount = 0
    let endIdx = -1

    for (let i = openBraceIdx; i < unescapedData.length; i++) {
        if (unescapedData[i] === '{') braceCount++
        else if (unescapedData[i] === '}') braceCount--

        if (braceCount === 0) {
            endIdx = i + 1
            break
        }
    }

    if (endIdx === -1) return null
    try {
        return JSON.parse(unescapedData.substring(openBraceIdx, endIdx))
    } catch (e) {
        return null
    }
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

        // 1. Check Rate Limit (Internal Throttling)
        // Prevent users from spamming the update button
        const { data: existingStats } = await supabase
            .from('coding_stats')
            .select('updated_at')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false })
            .limit(1)
            .single()

        if (existingStats?.updated_at) {
            const lastUpdate = new Date(existingStats.updated_at)
            const now = new Date()
            const diffMinutes = (now.getTime() - lastUpdate.getTime()) / (1000 * 60)

            if (diffMinutes < 2) {
                return NextResponse.json({
                    message: `Profile is already up to date. Please wait ${Math.ceil(2 - diffMinutes)} minutes.`,
                    throttled: true
                }, { status: 429 })
            }
        }

        // 2. Fetch Stats from external APIs
        const stats: any[] = []

        // --- LeetCode ---
        // --- LeetCode ---
        if (leetcode) {
            try {
                let totalSolved = 0
                let totalQuestions = 0
                let ranking = 'Active'
                let contestRating = 0

                // Strategy: Try robust APIs in order
                // Mirroring successful approach from community scripts

                const fetchLeetCodeStats = async () => {
                    // Try Alfa API first (seems more reliable recently)
                    try {
                        const [solvedRes, profileRes, contestRes, calendarRes] = await Promise.all([
                            fetch(`https://alfa-leetcode-api.onrender.com/${leetcode}/solved`),
                            fetch(`https://alfa-leetcode-api.onrender.com/${leetcode}`),
                            fetch(`https://alfa-leetcode-api.onrender.com/${leetcode}/contest`),
                            fetch(`https://alfa-leetcode-api.onrender.com/${leetcode}/calendar`)
                        ])

                        let submissionCalendar = {}

                        if (solvedRes.ok) {
                            const solvedData = await solvedRes.json()
                            if (solvedData.solvedProblem) {
                                totalSolved = solvedData.solvedProblem
                            }
                        }

                        if (profileRes.ok) {
                            const profileData = await profileRes.json()
                            if (profileData.ranking) {
                                ranking = `Rank ${profileData.ranking}`
                            }
                        }

                        if (contestRes.ok) {
                            const contestData = await contestRes.json()
                            if (contestData.contestRating) {
                                contestRating = Math.round(contestData.contestRating)
                            }
                        }

                        if (calendarRes.ok) {
                            const calendarData = await calendarRes.json()
                            if (calendarData.submissionCalendar) {
                                // It usually comes as stringified JSON inside the JSON response
                                try {
                                    submissionCalendar = JSON.parse(calendarData.submissionCalendar)
                                } catch (e) {
                                    submissionCalendar = calendarData.submissionCalendar
                                }
                            }
                        }

                        // If we got valid data, return the calendar too
                        if (totalSolved > 0) return { success: true, calendar: submissionCalendar }
                    } catch (e) {
                        console.warn('Alfa API failed, trying fallback...', e)
                    }

                    // Fallback 1: FaisalShohag API
                    try {
                        const res = await fetch(`https://leetcode-api-faisalshohag.vercel.app/${leetcode}`)
                        if (res.ok) {
                            const data = await res.json()
                            if (data.totalSolved) {
                                totalSolved = data.totalSolved
                                totalQuestions = data.totalQuestions || 0
                                ranking = data.ranking ? `Rank ${data.ranking}` : 'Active'
                                return { success: true, calendar: data.submissionCalendar || {} }
                            }
                        }
                    } catch (e) {
                        console.warn('FaisalShohag API failed', e)
                    }

                    // Fallback 2: LeetCode Stats API (Heroku) - Used by manual script, very reliable for totals
                    try {
                        const res = await fetch(`https://leetcode-stats-api.herokuapp.com/${leetcode}`)
                        if (res.ok) {
                            const data = await res.json()
                            if (data.status === 'success') {
                                // If we don't have totals yet, or if this one is more complete
                                if (!totalSolved || totalSolved === 0) totalSolved = data.totalSolved
                                if (!totalQuestions || totalQuestions === 0) totalQuestions = data.totalQuestions
                                if (!ranking || ranking === 'Active') ranking = data.ranking ? `Rank ${data.ranking}` : 'Active'

                                // Return success if we have what we need, even if calendar is missing (we might have got it from alfa)
                                return { success: true, calendar: data.submissionCalendar || {} }
                            }
                        }
                    } catch (e) {
                        console.warn('Heroku Stats API failed', e)
                    }

                    // Fallback 2: Heroku API
                    try {
                        const lcRes = await fetch(`https://leetcode-stats-api.herokuapp.com/${leetcode}`)
                        if (lcRes.ok) {
                            const lcData = await lcRes.json()
                            if (lcData.status === 'success') {
                                totalQuestions = lcData.totalQuestions || 0
                                totalSolved = lcData.totalSolved || 0
                                ranking = lcData.ranking ? `Rank ${lcData.ranking}` : 'Active'
                                return { success: true, calendar: lcData.submissionCalendar || {} }
                            }
                        }
                    } catch (e) {
                        console.warn('Heroku API failed', e)
                    }

                    return { success: false, calendar: {} }
                }

                const result = await fetchLeetCodeStats()

                stats.push({
                    user_id: userId,
                    platform: 'leetcode',
                    total_problems: totalQuestions,
                    problems_solved: totalSolved,
                    contest_rating: contestRating,
                    level: ranking,
                    heatmap_data: result.calendar
                })

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

                console.log(`[Codeforces] Fetching info for ${codeforces}...`)
                const cfInfoRes = await fetch(`https://codeforces.com/api/user.info?handles=${codeforces}`)
                if (cfInfoRes.ok) {
                    const cfData = await cfInfoRes.json()
                    if (cfData.status === 'OK' && cfData.result?.length > 0) {
                        const user = cfData.result[0]
                        rating = user.rating || 0
                        rank = user.rank || 'Unrated'
                        console.log(`[Codeforces] Info success: Rating=${rating}, Rank=${rank}`)
                    } else {
                        console.warn(`[Codeforces] Info API returned non-OK: ${cfData.comment || 'No result'}`)
                    }
                } else {
                    console.error(`[Codeforces] Info API HTTP Error: ${cfInfoRes.status}`)
                }

                // 2. User Status for Solved Count
                // We need to fetch submissions and count unique 'OK' verdicts
                let solvedCount = 0
                try {
                    console.log(`[Codeforces] Fetching submissions for ${codeforces}...`)
                    const cfStatusRes = await fetch(`https://codeforces.com/api/user.status?handle=${codeforces}&from=1&count=5000`)

                    if (cfStatusRes.ok) {
                        const statusData = await cfStatusRes.json()
                        if (statusData.status === 'OK') {
                            const submissions = statusData.result || []
                            console.log(`[Codeforces] Fetched ${submissions.length} submissions`)

                            const solvedProblems = new Set()

                            submissions.forEach((sub: any) => {
                                if (sub.verdict === 'OK' && sub.problem) {
                                    const problemKey = `${sub.problem.contestId}-${sub.problem.index}`
                                    solvedProblems.add(problemKey)
                                }
                            })
                            solvedCount = solvedProblems.size
                            console.log(`[Codeforces] Unique solved count: ${solvedCount}`)
                        } else {
                            console.warn(`[Codeforces] Status API returned non-OK: ${statusData.comment}`)
                        }
                    } else {
                        console.error(`[Codeforces] Status API HTTP Error: ${cfStatusRes.status} ${cfStatusRes.statusText}`)
                        const text = await cfStatusRes.text()
                        console.error(`[Codeforces] Error Body: ${text}`)
                    }
                } catch (e) {
                    console.error('[Codeforces] Status fetch exception:', e)
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

        // --- GeeksforGeeks ---
        if (geeksforgeeks) {
            try {
                // Fetch the main profile page which contains the data in Next.js hydration scripts
                const targetUrl = `https://www.geeksforgeeks.org/user/${geeksforgeeks}/`

                const gfgRes = await fetch(targetUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    }
                })

                if (gfgRes.ok) {
                    const html = await gfgRes.text()

                    // Use the reliable parsing logic
                    const pushChunks = html.match(/self\.__next_f\.push\(\[1,"(.*?)"\]\)/g) || []

                    let unescapedData = pushChunks
                        .map(chunk => {
                            const contentMatch = chunk.match(/push\(\[1,"(.*)"\]\)/)
                            return contentMatch ? contentMatch[1]
                                .replace(/\\"/g, '"')
                                .replace(/\\\\/g, '\\')
                                .replace(/\\u003c/g, '<')
                                .replace(/\\u003e/g, '>') : ""
                        })
                        .join('')

                    const userData = extractObject(unescapedData, "userData")

                    const gfgStats = userData?.data || {}
                    let problemsSolved = gfgStats.total_problems_solved || 0
                    let codingScore = gfgStats.score || 0

                    // Fallback
                    if (!problemsSolved || !codingScore) {
                        const scoreMatch = unescapedData.match(/"score"\s*:\s*(\d+)/)
                        const solvedMatch = unescapedData.match(/"total_problems_solved"\s*:\s*(\d+)/)

                        if (scoreMatch) codingScore = parseInt(scoreMatch[1], 10)
                        if (solvedMatch) problemsSolved = parseInt(solvedMatch[1], 10)
                    }

                    let level = 'Connected'
                    if (codingScore > 0) {
                        level = `Score: ${codingScore}`
                    }

                    stats.push({
                        user_id: userId,
                        platform: 'geeksforgeeks',
                        total_problems: 0,
                        problems_solved: problemsSolved,
                        contest_rating: codingScore,
                        level: level
                    })
                } else {
                    stats.push({
                        user_id: userId,
                        platform: 'geeksforgeeks',
                        total_problems: 0,
                        problems_solved: 0,
                        contest_rating: 0,
                        level: 'Connection Failed'
                    })
                }
            } catch (e: any) {
                console.error('GeeksforGeeks fetch error:', e)
                stats.push({
                    user_id: userId,
                    platform: 'geeksforgeeks',
                    total_problems: 0,
                    problems_solved: 0,
                    contest_rating: 0,
                    level: 'Error'
                })
            }
        }

        console.log('Stats collected:', stats)

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
                if (s.platform === 'leetcode') {
                    // 10 pts per problem + (Rating / 10)
                    totalPoints += (s.problems_solved * 10) + Math.floor((s.contest_rating || 0) / 10)
                }
                if (s.platform === 'github') {
                    // 10 pts per Repo + 1 pt per Contribution (solved = contributions, total = repos in our schema)
                    totalPoints += (s.total_problems * 10) + (s.problems_solved * 1)
                }
                if (s.platform === 'codeforces') {
                    // 20 pts per problem + (Rating / 5)
                    totalPoints += (s.problems_solved * 20) + Math.floor((s.contest_rating || 0) / 5)
                }
                if (s.platform === 'geeksforgeeks') {
                    // 5 pts per problem + (Score / 5) -> contest_rating holds Score for GFG
                    totalPoints += (s.problems_solved * 5) + Math.floor((s.contest_rating || 0) / 5)
                }
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
