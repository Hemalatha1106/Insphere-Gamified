
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const SUPABASE_URL = 'https://outpjkqtsuypakpwgopd.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91dHBqa3F0c3V5cGFrcHdnb3BkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2Mzk1NzEsImV4cCI6MjA4NjIxNTU3MX0.R6lpPS_KdItKei0MXgeQbo4LHYFusCYa0AqYYU2DWc0'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function run() {
    const userId = '2d2fcf5d-91a7-4d90-9066-0377db3ad841';
    console.log(`Checking GFG stats for user: ${userId}`);

    const { data, error } = await supabase
        .from('coding_stats')
        .select('*')
        .eq('user_id', userId)
        .eq('platform', 'geeksforgeeks');

    let output = '';
    if (error) {
        output = JSON.stringify(error, null, 2);
    } else {
        output = JSON.stringify(data, null, 2);
    }

    fs.writeFileSync('gfg_stats_output.txt', output);
    console.log('Done writing to gfg_stats_output.txt');
}

run();
