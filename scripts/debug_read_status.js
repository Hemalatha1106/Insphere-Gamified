const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse env file
const envLocal = fs.readFileSync(path.resolve(__dirname, '../.env.local'), 'utf8');
const envConfig = {};
envLocal.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        envConfig[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
    }
});

const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY; // Using anon key

async function check() {
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Checking read statuses...");

    // 1. Get a user
    // If strict RLS is on, this might return empty without session.
    // Let's try to sign in with a hardcoded test user if we knew one, 
    // or just hope we can see public profiles.
    const { data: profiles, error: pError } = await supabase.from('profiles').select('id, display_name').limit(1);

    if (pError || !profiles || profiles.length === 0) {
        console.log("Could not fetch profiles (RLS likely blocking).");
        console.log("Error:", pError?.message);
        return;
    }

    const userId = profiles[0].id;
    console.log(`Checking for User: ${profiles[0].display_name} (${userId})`);

    // 2. Check Channels
    const { data: channels } = await supabase.from('channels').select('id, name, last_message_at').limit(5);

    // Using anon key to fetch own read status won't work for *other* users usually.
    // But if RLS allows "users can view their own", using a service key would be better.
    // Since I don't have service key in env (user said so), 
    // I can only debug if I log in.
    // I'll try to just print the channels to check timestamps.

    // 3. Check Channel Read Status
    const { data: statuses, error: sError } = await supabase
        .from('channel_read_status')
        .select('*')
        .eq('user_id', userId);

    if (sError) {
        console.log("Error reading statuses:", sError.message);
    } else if (channels && statuses) {
        console.log("\n--- Channel Read Status ---");
        channels.forEach(ch => {
            const status = statuses.find(s => s.channel_id === ch.id);
            const msgTime = ch.last_message_at ? new Date(ch.last_message_at) : null;
            const readTime = status ? new Date(status.last_read_at) : null;

            let isUnread = false;
            // The logic used in frontend:
            // !status || (msgTime && readTime && msgTime > readTime)
            if (!status) isUnread = true;
            else if (msgTime && readTime && msgTime > readTime) isUnread = true;

            console.log(`Channel: ${ch.name} `);
            console.log(`  Last Message: ${ch.last_message_at} (${msgTime?.getTime()})`);
            console.log(`  Last Read:    ${status?.last_read_at} (${readTime?.getTime()})`);
            console.log(`  Is Unread ? ${isUnread ? 'YES (Purple Dot)' : 'NO'} `);
        });
    }

    // 4. Check Global Notifications
    const { data: notifs, error: nError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('is_read', false);

    if (nError) {
        console.log("Error reading notifications:", nError.message);
    } else {
        console.log("\n--- Unread Global Notifications (Bell Icon) ---");
        console.log(`Count: ${notifs?.length} `);
        notifs?.forEach(n => console.log(`- ${n.content} (${n.is_read ? 'Read' : 'Unread'})`));
    }
}

check();
