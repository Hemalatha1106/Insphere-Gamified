
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

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Try to get Service Role Key
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
let supabaseAdmin = null;
if (supabaseServiceKey) {
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
}

async function testTablesAccess() {
    console.log('--- Debugging Profile Access ---');

    // 1. Check with Service Role (Bypass RLS)
    if (supabaseAdmin) {
        console.log('\n[Service Role] Listing ALL profiles (Bypassing RLS):');
        const { data: allProfiles, error: adminError } = await supabaseAdmin
            .from('profiles')
            .select('id, username, display_name');

        if (adminError) console.error('Admin Error:', adminError.message);
        else {
            console.log(`Found ${allProfiles?.length} profiles in DB:`);
            allProfiles.forEach(p => console.log(` - ${p.username} (${p.id})`));
        }
    } else {
        console.log('\n[Service Role] Key not found, skipping admin check.');
    }

    // 2. Check with Anon (RLS Applied)
    console.log('\n[Anon Client] Listing profiles visible to public:');
    const { data: publicProfiles, error: publicError } = await supabase
        .from('profiles')
        .select('id, username, display_name');

    if (publicError) console.error('Anon Error:', publicError.message);
    else {
        console.log(`Found ${publicProfiles?.length} visible profiles:`);
        publicProfiles.forEach(p => console.log(` - ${p.username} (${p.id})`));
    }
}

testTablesAccess();
