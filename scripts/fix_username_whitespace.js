
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
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
    console.error('Missing SUPABASE_SERVICE_ROLE_KEY. Cannot update profiles.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function trimUsernames() {
    console.log('Fetching profiles...');
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, username');

    if (error) {
        console.error('Error fetching profiles:', error.message);
        return;
    }

    let updatedCount = 0;
    for (const profile of profiles) {
        if (profile.username !== profile.username.trim()) {
            console.log(`Trimming username for: "${profile.username}" (ID: ${profile.id})`);
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ username: profile.username.trim() })
                .eq('id', profile.id);

            if (updateError) {
                console.error(`Error updating ${profile.username}:`, updateError.message);
            } else {
                updatedCount++;
            }
        }
    }

    console.log(`Process Complete. Updated ${updatedCount} profiles.`);
}

trimUsernames();
