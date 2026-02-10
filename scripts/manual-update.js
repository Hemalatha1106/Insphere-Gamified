const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envConfig = {};
envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        const key = parts[0].trim();
        const val = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
        envConfig[key] = val;
    }
});

const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Logic from route.ts
const extractUsername = (input, platform) => {
    if (!input) return ''
    input = input.trim()

    try {
        if (input.startsWith('http://') || input.startsWith('https://')) {
            const url = new URL(input)
            const pathParts = url.pathname.split('/').filter(p => p.length > 0)

            switch (platform) {
                case 'leetcode':
                    if (pathParts[0] === 'u' && pathParts.length >= 2) return pathParts[1]
                    if (pathParts.length >= 1) return pathParts[0]
                    break
                case 'github':
                    if (pathParts.length >= 1) return pathParts[0]
                    break
                case 'codeforces':
                    if (pathParts[0] === 'profile' && pathParts.length >= 2) return pathParts[1]
                    break
                case 'geeksforgeeks':
                    if ((pathParts[0] === 'user' || pathParts[0] === 'profile') && pathParts.length >= 2) return pathParts[1]
                    break
            }
        }
    } catch (e) {
        console.warn(`Could not parse URL for ${platform}: ${input}`, e)
    }
    return input.replace(/\/$/, '')
}

async function runManualUpdate() {
    // 1. Get User
    const username = 'Hemalatha_Venkatesan';
    console.log(`Searching for user: ${username}`);
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`leetcode_username.eq.${username},github_username.eq.${username},username.eq.${username}`)

    if (error || !profiles || profiles.length === 0) {
        console.error('User not found or error:', error);
        return;
    }
    const user = profiles[0];
    const userId = user.id;
    console.log(`Found user ${userId}`);

    // Inputs from user request
    let leetcode = 'https://leetcode.com/u/Hemalatha_Venkatesan/';
    let github = 'https://github.com/Hemalatha1106';
    let codeforces = 'https://codeforces.com/profile/Hemalatha_Venkatesan';
    let geeksforgeeks = 'https://www.geeksforgeeks.org/profile/hemavenkk293';

    leetcode = extractUsername(leetcode, 'leetcode');
    github = extractUsername(github, 'github');
    codeforces = extractUsername(codeforces, 'codeforces');
    geeksforgeeks = extractUsername(geeksforgeeks, 'geeksforgeeks');

    console.log('Extracted:', { leetcode, github, codeforces, geeksforgeeks });

    const stats = [];

    // --- LeetCode ---
    if (leetcode) {
        try {
            console.log(`Fetching LeetCode: ${leetcode}`);
            const lcRes = await fetch(`https://leetcode-stats-api.herokuapp.com/${leetcode}`);
            if (lcRes.ok) {
                const lcData = await lcRes.json();
                console.log('LeetCode Data:', lcData.status, lcData.totalSolved);
                if (lcData.status === 'success') {
                    stats.push({
                        user_id: userId,
                        platform: 'leetcode',
                        total_problems: lcData.totalQuestions || 0,
                        problems_solved: lcData.totalSolved || 0,
                        contest_rating: 0,
                        level: lcData.ranking ? `Rank ${lcData.ranking}` : 'Active'
                    });
                }
            } else {
                console.error('LeetCode fetch failed status:', lcRes.status);
            }
        } catch (e) {
            console.error('LeetCode error:', e);
        }
    }

    // --- GitHub ---
    if (github) {
        try {
            console.log(`Fetching GitHub: ${github}`);
            const ghRes = await fetch(`https://api.github.com/users/${github}`);
            let publicRepos = 0;
            let followers = 0;
            if (ghRes.ok) {
                const ghData = await ghRes.json();
                publicRepos = ghData.public_repos || 0;
                followers = ghData.followers || 0;
            }

            let totalContributions = 0;
            try {
                const contribRes = await fetch(`https://github-contributions-api.jogruber.de/v4/${github}?y=last`);
                if (contribRes.ok) {
                    const contribData = await contribRes.json();
                    const totals = contribData.total || {};
                    totalContributions = Object.values(totals).reduce((a, b) => a + b, 0);
                    console.log('GitHub Contributions:', totalContributions);
                }
            } catch (e) {
                console.error('GitHub contrib error:', e);
            }

            stats.push({
                user_id: userId,
                platform: 'github',
                total_problems: publicRepos,
                problems_solved: totalContributions,
                contest_rating: 0,
                level: `${followers} Followers`
            });
        } catch (e) {
            console.error('GitHub error:', e);
        }
    }

    // --- Codeforces ---
    if (codeforces) {
        try {
            console.log(`Fetching Codeforces: ${codeforces}`);
            let rating = 0;
            let rank = 'Unrated';

            const cfInfoRes = await fetch(`https://codeforces.com/api/user.info?handles=${codeforces}`);
            if (cfInfoRes.ok) {
                const cfData = await cfInfoRes.json();
                if (cfData.status === 'OK' && cfData.result?.length > 0) {
                    const u = cfData.result[0];
                    rating = u.rating || 0;
                    rank = u.rank || 'Unrated';
                }
            }

            let solvedCount = 0;
            const cfStatusRes = await fetch(`https://codeforces.com/api/user.status?handle=${codeforces}&from=1&count=10000`);
            if (cfStatusRes.ok) {
                const statusData = await cfStatusRes.json();
                if (statusData.status === 'OK') {
                    const submissions = statusData.result || [];
                    const solvedProblems = new Set();
                    submissions.forEach((sub) => {
                        if (sub.verdict === 'OK' && sub.problem) {
                            const problemKey = `${sub.problem.contestId}-${sub.problem.index}`;
                            solvedProblems.add(problemKey);
                        }
                    });
                    solvedCount = solvedProblems.size;
                    console.log('Codeforces Solved:', solvedCount);
                }
            }

            stats.push({
                user_id: userId,
                platform: 'codeforces',
                total_problems: 0,
                problems_solved: solvedCount,
                contest_rating: rating,
                level: rank
            });
        } catch (e) {
            console.error('Codeforces error:', e);
        }
    }

    console.log('Stats to Insert:', stats);

    if (stats.length > 0) {
        const platforms = stats.map(s => s.platform);

        // Upsert or Delete/Insert
        console.log('Deleting old stats...');
        const { error: delError } = await supabase
            .from('coding_stats')
            .delete()
            .eq('user_id', userId)
            .in('platform', platforms);

        if (delError) console.error('Delete error:', delError);

        console.log('Inserting new stats...');
        const { error: insertError } = await supabase
            .from('coding_stats')
            .insert(stats);

        if (insertError) console.error('Insert error:', insertError);
        else console.log('Successfully inserted stats!');
    }
}

runManualUpdate();
