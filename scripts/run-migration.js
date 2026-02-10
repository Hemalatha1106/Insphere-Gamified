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
// Note: Anon key likely can't run DDL. 
// If this fails, I might need to ask user to run SQL or use a workaround if I have service role key (not in .env.local usually).
// Let's try to see if I can RPC it or if I have a service key in env (unlikely).
// Actually, I can likely just use the "User" connection if I had a session specific token, but here I am untrusted script.

// Wait, I can't run DDL with anon key.
// But I can try to use the dashboard SQL editor if I could... I can't.
// I will try to use the REST API to call a function if it exists, but I am adding a column.

// ALTERNATIVE: Use the `postgres` library if I had the connection string.
// I don't have the connection string.
// I will try to use `service_role` key if it happens to be in .env.local (sometimes it is).
const serviceRoleKey = envConfig.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
    console.error("No service role key found. Cannot run DDL migrations from script.");
    // In this case, I will assume the column exists or ask user to add it.
    // However, for the purpose of this environment, I might not be able to execute DDL.
    // Let's check if the column already exists by trying to select it.
}

const supabase = createClient(supabaseUrl, serviceRoleKey || supabaseKey);

async function runMigration() {
    if (!serviceRoleKey) {
        console.log("Checking if linkedin_username exists...");
        const { data, error } = await supabase.from('profiles').select('linkedin_username').limit(1);
        if (error) {
            console.error("Column likely missing:", error.message);
            console.log("Please run this SQL in your Supabase SQL Editor:");
            console.log("ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS linkedin_username TEXT;");
        } else {
            console.log("Column exists!");
        }
        return;
    }

    // If I have service key, I might be able to run raw sql if there is a function for it, but standard supabase-js client doesn't support raw SQL execution directly without an RPC function.
    // So I am stuck unless I have a postgres connection string or an RPC function `exec_sql`.

    console.log("Cannot execute raw SQL via client. Please run SQL manually.");
    console.log("ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS linkedin_username TEXT;");
}

runMigration();
