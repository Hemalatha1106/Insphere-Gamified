
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkUser() {
    const username = 'Parthasarathi';
    console.log(`Checking for user: "${username}"...`);

    // 1. Exact match
    const { data: exact, error: exactError } = await supabase
        .from('profiles')
        .select('id, username, display_name')
        .eq('username', username)
        .maybeSingle();

    if (exactError) console.error('Exact Match Error:', exactError.message);
    else console.log('Exact Match found:', exact);

    // 2. Case-insensitive match
    const { data: ilike, error: ilikeError } = await supabase
        .from('profiles')
        .select('id, username, display_name')
        .ilike('username', username)
        .maybeSingle();

    if (ilikeError) console.error('ILike Match Error:', ilikeError.message);
    else console.log('ILike Match found:', ilike);

    // 3. Check display name just in case
    const { data: display, error: displayError } = await supabase
        .from('profiles')
        .select('id, username, display_name')
        .ilike('display_name', username)
        .limit(5);

    if (displayError) console.error('Display Name Search Error:', displayError.message);
    else {
        console.log('Display Name Search found:', display?.length);
        display?.forEach(p => console.log(` - Username: ${p.username}, Display: ${p.display_name}`));
    }
}

checkUser();
