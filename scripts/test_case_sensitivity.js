
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

async function testCaseSensitivity() {
    // 1. Get a real username
    const { data: users } = await supabase.from('profiles').select('username').limit(1);
    if (!users || users.length === 0) {
        console.log('No users found to test.');
        return;
    }

    const originalUsername = users[0].username;
    console.log('Testing with username:', originalUsername);

    // 2. Test Exact Match
    const { data: exact, error: exactError } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', originalUsername)
        .single();

    if (exactError) console.log('Exact match failed:', exactError.message);
    else console.log('Exact match success');

    // 3. Test Wrong Case Match
    const wrongCase = originalUsername === originalUsername.toLowerCase()
        ? originalUsername.toUpperCase()
        : originalUsername.toLowerCase();

    console.log('Testing with wrong case:', wrongCase);

    const { data: caseTest, error: caseError } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', wrongCase)
        .single();

    if (caseError) {
        console.log('Wrong case match failed (Expected if case-sensitive):', caseError.message, caseError.details);
    } else {
        console.log('Wrong case match success (Case-insensitive behavior)');
    }
}

testCaseSensitivity();
