
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                process.env[key.trim()] = value.trim();
            }
        });
    }
} catch (e) {
    console.warn('Could not read .env.local:', e.message);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkUser() {
    const usernameQuery = 'Parthasarathi';
    console.log(`Checking for user: "${usernameQuery}"...`);

    // 1. Exact match
    const { data: exact, error: exactError } = await supabase
        .from('profiles')
        .select('id, username, display_name')
        .eq('username', usernameQuery)
        .maybeSingle();

    if (exactError) console.error('Exact Match Error:', exactError.message);
    else console.log('Exact Match found:', exact);

    // 2. Case-insensitive match (ilike)
    const { data: ilike, error: ilikeError } = await supabase
        .from('profiles')
        .select('id, username, display_name')
        .ilike('username', usernameQuery)
        .maybeSingle();

    if (ilikeError) console.error('ILike Match Error:', ilikeError.message);
    else console.log('ILike Match found:', ilike);

    // 3. Search by Display Name (ilike)
    console.log(`Checking display_name ilike '%${usernameQuery}%'...`);
    const { data: display, error: displayError } = await supabase
        .from('profiles')
        .select('id, username, display_name')
        .ilike('display_name', `%${usernameQuery}%`)
        .limit(5);

    if (displayError) console.error('Display Name Search Error:', displayError.message);
    else {
        console.log(`Display Name Search found ${display?.length} matches:`);
        display?.forEach(p => {
            console.log(` - Username: "${p.username}" (Length: ${p.username.length})`);
            console.log(` - Display: "${p.display_name}"`);
            // Log char codes to be sure
            console.log(` - Char codes: ${p.username.split('').map(c => c.charCodeAt(0)).join(',')}`);
        });
    }
}

checkUser();
