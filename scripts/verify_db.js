const fs = require('fs');
const path = require('path');

try {
    const envPath = path.resolve(__dirname, '../.env.local');
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim();
        }
    });
} catch (e) {
    console.error('Error reading .env.local:', e.message);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
    console.log('Missing credentials');
    process.exit(1);
}

const fullUrl = `${url}/rest/v1/profiles?select=count`;

async function check() {
    try {
        const res = await fetch(fullUrl, {
            headers: {
                'apikey': key,
                'Authorization': `Bearer ${key}`
            }
        });

        if (res.ok) {
            console.log('Database connected and profiles table exists.');
        } else {
            console.log('Database connected but profiles table might be missing or RLS is blocking. Status:', res.status);
            const text = await res.text();
            console.log('Response:', text);
        }
    } catch (e) {
        console.error('Connection failed:', e.message);
    }
}

check();
