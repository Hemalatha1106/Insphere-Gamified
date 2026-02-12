
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

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

    // 1. Search with Anon Key
    console.log('\n--- Searching with Anon Key ---');
    const { data: anonData, error: anonError } = await supabaseAnon
        .from('profiles')
        .select('username')
        .limit(5);

    if (anonError) {
        console.error('Anon Search Error:', anonError.message);
    } else {
        console.log(`Anon Search found ${anonData ? anonData.length : 0} profiles`);
        if (anonData && anonData.length > 0) console.log(anonData.map(p => p.username));
    }

    // 2. Search with Service Key
    if (supabaseAdmin) {
        console.log('\n--- Searching with Service Key ---');
        const { data: adminData, error: adminError } = await supabaseAdmin
            .from('profiles')
            .select('username')
            .limit(5);

        if (adminError) {
            console.error('Admin Search Error:', adminError.message);
        } else {
            console.log(`Admin Search found ${adminData ? adminData.length : 0} profiles`);
            if (adminData && adminData.length > 0) console.log(adminData.map(p => p.username));
        }
    } else {
        console.log('\nSkipping Admin search (no service key found)');
    }
}

testSearch();
