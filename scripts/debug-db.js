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

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugUser(username) {
    console.log(`Searching for user with leetcode/github matching: ${username}`);
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`leetcode_username.eq.${username},github_username.eq.${username},username.eq.${username}`)

    if (error) {
        console.error('Error searching profile:', error);
        return;
    }

    if (!profiles || profiles.length === 0) {
        console.log(`No matching profile found for ${username}.`);
        return;
    }

    const user = profiles[0];
    console.log('Found User Profile:', {
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        leetcode: user.leetcode_username,
        github: user.github_username,
        codeforces: user.codeforces_username
    });

    console.log('Fetching Stats...');
    const { data: stats, error: statsError } = await supabase
        .from('coding_stats')
        .select('*')
        .eq('user_id', user.id);

    if (statsError) {
        console.error('Error fetching stats:', statsError);
    } else {
        console.log('User Stats:', stats);
    }
}

// Check for the specific user mentions
(async () => {
    await debugUser('Hemalatha_Venkatesan'); // LeetCode
    await debugUser('Hemalatha1106'); // GitHub
})();
