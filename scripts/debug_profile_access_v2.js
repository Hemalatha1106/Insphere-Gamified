
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

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
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

async function testSearch() {
    console.log('Testing Profile Search...');
    console.log('URL:', supabaseUrl);

    // 1. Search with Anon Key
    console.log('\n--- Searching with Anon Key (Client) ---');
    const { data: anonData, error: anonError } = await supabaseAnon
        .from('profiles')
        .select('username')
        .limit(5);

    if (anonError) {
        console.error('Anon Search Error:', anonError.message);
    } else {
        console.log(`Anon Search found ${anonData ? anonData.length : 0} profiles`);
    }

    // 2. Search with Service Key
    if (supabaseAdmin) {
        console.log('\n--- Searching with Service Key (Admin) ---');
        const { data: adminData, error: adminError } = await supabaseAdmin
            .from('profiles')
            .select('username')
            .limit(5);

        if (adminError) {
            console.error('Admin Search Error:', adminError.message);
        } else {
            console.log(`Admin Search found ${adminData ? adminData.length : 0} profiles`);
        }
    } else {
        console.log('\nSkipping Admin search (no service key found)');
    }
}

testSearch();
