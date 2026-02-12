
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testTablesAccess() {
    const username = 'testuser'; // dummy, just checking if we get "permission denied" or empty data/error

    console.log('--- Testing Table Access (Anon) ---');

    // 1. Profiles (Should work now)
    console.log('Checking profiles...');
    const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, username')
        .limit(1);

    if (profileError) console.error('Profiles Error:', profileError.message);
    else console.log('Profiles OK. Found:', profiles?.length);

    // 2. Coding Stats
    console.log('\nChecking coding_stats...');
    const { data: stats, error: statsError } = await supabase
        .from('coding_stats')
        .select('*')
        .limit(1);

    if (statsError) console.error('Coding Stats Error:', statsError.message);
    else console.log('Coding Stats OK. Found:', stats?.length);

    // 3. Badges
    console.log('\nChecking badges...');
    const { data: badges, error: badgesError } = await supabase
        .from('badges')
        .select('*')
        .limit(1);

    if (badgesError) console.error('Badges Error:', badgesError.message);
    else console.log('Badges OK. Found:', badges?.length);

    // 4. User Badges
    console.log('\nChecking user_badges...');
    const { data: userBadges, error: userBadgesError } = await supabase
        .from('user_badges')
        .select('*')
        .limit(1);

    if (userBadgesError) console.error('User Badges Error:', userBadgesError.message);
    else console.log('User Badges OK. Found:', userBadges?.length);
}

testTablesAccess();
