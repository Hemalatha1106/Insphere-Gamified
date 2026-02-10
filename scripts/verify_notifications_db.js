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
const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
    console.log("Verifying channel notifications schema...");

    // Check channels table for last_message_at
    const { data: channels, error: channelsError } = await supabase
        .from('channels')
        .select('last_message_at')
        .limit(1);

    if (channelsError) {
        console.error("Error checking channels table:", channelsError.message);
    } else {
        console.log("Channels table check: OK (column last_message_at exists)");
    }

    // Check channel_read_status table
    const { data: status, error: statusError } = await supabase
        .from('channel_read_status')
        .select('*')
        .limit(1);

    if (statusError) {
        console.error("Error checking channel_read_status table:", statusError.message);
        console.log("MISSING: channel_read_status table or permissions.");
    } else {
        console.log("channel_read_status table check: OK");
    }
}

verify();
